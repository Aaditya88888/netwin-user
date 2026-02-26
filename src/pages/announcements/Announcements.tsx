import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Bell, Search, Pin, Info, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow, parseISO } from "date-fns";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, where, getDocs, limit } from "firebase/firestore";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: 'low' | 'medium' | 'high';
  targetAudience: 'all' | 'participants' | 'staff' | 'custom';
  isActive: boolean;
  isPinned: boolean;
  scheduledAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  viewCount: number;
  tags: string[];
}

export default function Announcements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState<"all" | "pinned">("all");

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      
      // Query announcements from Firestore
      const announcementsRef = collection(db, "announcements");
      const q = query(
        announcementsRef,
        where("isActive", "==", true),
        where("targetAudience", "in", ["all", "participants"]),
        orderBy("isPinned", "desc"),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      const fetchedAnnouncements = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Announcement[];
      
      // Filter out expired announcements
      const now = new Date();
      const activeAnnouncements = fetchedAnnouncements.filter(announcement => {
        if (announcement.expiresAt) {
          return parseISO(announcement.expiresAt) > now;
        }
        return true;
      });
      
      setAnnouncements(activeAnnouncements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-900 bg-opacity-20 border-yellow-700 text-yellow-400';
      case 'success':
        return 'bg-green-900 bg-opacity-20 border-green-700 text-green-400';
      case 'error':
        return 'bg-red-900 bg-opacity-20 border-red-700 text-red-400';
      default:
        return 'bg-blue-900 bg-opacity-20 border-blue-700 text-blue-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = searchTerm === "" || 
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = selectedTab === "all" || 
      (selectedTab === "pinned" && announcement.isPinned);
    
    return matchesSearch && matchesTab;
  });

  const pinnedAnnouncements = filteredAnnouncements.filter(a => a.isPinned);
  const regularAnnouncements = filteredAnnouncements.filter(a => !a.isPinned);

  if (!user) return null;

  return (
    <div className="container-responsive py-4 sm:py-6 md:py-10">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-responsive-lg font-bold font-poppins flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" />
          Announcements
        </h1>
        <p className="text-gray-400 mt-1 text-sm sm:text-base">
          Stay updated with the latest news and updates
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search announcements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as "all" | "pinned")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">All Announcements</TabsTrigger>
          <TabsTrigger value="pinned">Pinned</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-700 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-gray-700 rounded animate-pulse w-full" />
                    <div className="h-3 bg-gray-700 rounded animate-pulse w-2/3" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <Card className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">No announcements found</h3>
              <p className="text-gray-400">
                {searchTerm ? "Try adjusting your search terms" : "Check back later for updates"}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Pinned Announcements */}
              {pinnedAnnouncements.map((announcement) => (
                <Card key={announcement.id} className={`border-l-4 border-l-primary ${getTypeColor(announcement.type)}`}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Pin className="h-4 w-4 text-primary" />
                        <Badge variant="secondary" className="bg-primary bg-opacity-20 text-primary">
                          Pinned
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(announcement.priority)}>
                          {announcement.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        {getTypeIcon(announcement.type)}
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(parseISO(announcement.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{announcement.title}</h3>
                    <p className="text-gray-300 leading-relaxed">{announcement.content}</p>
                    {announcement.tags && announcement.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {announcement.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}

              {/* Regular Announcements */}
              {regularAnnouncements.map((announcement) => (
                <Card key={announcement.id} className={`${getTypeColor(announcement.type)}`}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getPriorityColor(announcement.priority)}>
                          {announcement.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        {getTypeIcon(announcement.type)}
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(parseISO(announcement.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{announcement.title}</h3>
                    <p className="text-gray-300 leading-relaxed">{announcement.content}</p>
                    {announcement.tags && announcement.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {announcement.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pinned" className="space-y-4 mt-6">
          {pinnedAnnouncements.length === 0 ? (
            <Card className="p-8 text-center">
              <Pin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">No pinned announcements</h3>
              <p className="text-gray-400">Important announcements will appear here when pinned</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {pinnedAnnouncements.map((announcement) => (
                <Card key={announcement.id} className={`border-l-4 border-l-primary ${getTypeColor(announcement.type)}`}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Pin className="h-4 w-4 text-primary" />
                        <Badge variant="secondary" className="bg-primary bg-opacity-20 text-primary">
                          Pinned
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(announcement.priority)}>
                          {announcement.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        {getTypeIcon(announcement.type)}
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(parseISO(announcement.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{announcement.title}</h3>
                    <p className="text-gray-300 leading-relaxed">{announcement.content}</p>
                    {announcement.tags && announcement.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {announcement.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
