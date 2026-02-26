import React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface Ticket {
  id: string;
  ticketId: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function MyTickets() {
  const { userProfile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!userProfile) return;
      
      try {
        setLoading(true);
        
        const ticketsQuery = query(
          collection(db, "support_tickets"),
          where("userId", "==", userProfile.uid),
          orderBy("createdAt", "desc")
        );
        
        const ticketsSnapshot = await getDocs(ticketsQuery);
        const ticketsData: Ticket[] = [];
        
        ticketsSnapshot.forEach((doc) => {
          const data = doc.data();
          ticketsData.push({
            id: doc.id,
            ticketId: data.ticketId,
            subject: data.subject,
            category: data.category,
            priority: data.priority,
            status: data.status,
            description: data.description,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        });
        
        setTickets(ticketsData);
      } catch (error) {
        console.error("Error fetching tickets", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTickets();
  }, [userProfile]);
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "in_progress":
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "closed":
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Open</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="border-blue-500 text-blue-500">In Progress</Badge>;
      case "resolved":
        return <Badge variant="outline" className="border-green-500 text-green-500">Resolved</Badge>;
      case "closed":
        return <Badge variant="outline" className="border-gray-500 text-gray-500">Closed</Badge>;
      default:
        return <Badge variant="outline" className="border-red-500 text-red-500">Unknown</Badge>;
    }
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-t-transparent"></div>
        <span className="ml-2">Loading tickets...</span>
      </div>
    );
  }
  
  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500 text-center">
        <MessageCircle className="h-12 w-12 mb-4 text-gray-400" />
        <p className="mb-2">You don&apos;t have any support tickets yet</p>
        <p className="text-sm">When you submit a ticket, it will appear here.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <Card key={ticket.id} className="p-4 bg-dark-card border-gray-800">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              {getStatusIcon(ticket.status)}
              <h3 className="font-medium text-sm sm:text-base">{ticket.subject}</h3>
            </div>
            {getStatusBadge(ticket.status)}
          </div>
          
          <div className="text-gray-400 text-xs mb-3">
            <span className="inline-block mr-4">#{ticket.ticketId}</span>
            <span className="inline-block mr-4">{ticket.category}</span>
            <span>{formatDate(ticket.createdAt)}</span>
          </div>
          
          <p className="text-sm text-gray-300 line-clamp-2 mb-2">{ticket.description}</p>
          
          <div className="pt-2 border-t border-gray-800 mt-2 text-xs text-gray-400 flex items-center justify-between">
            <span>Priority: {ticket.priority}</span>
            {ticket.status === "open" && (
              <span className="text-yellow-500">Waiting for response</span>
            )}
            {ticket.status === "in_progress" && (
              <span className="text-blue-500">Agent is responding</span>
            )}
            {ticket.status === "resolved" && (
              <span className="text-green-500">Resolved on {formatDate(ticket.updatedAt)}</span>
            )}
            {ticket.status === "closed" && (
              <span className="text-gray-500">Closed on {formatDate(ticket.updatedAt)}</span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
