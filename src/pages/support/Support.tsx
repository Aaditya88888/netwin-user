import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { submitTicket, getUserTickets } from "@/lib/userTicketService";
import { submitTicketViaAPI, getUserTicketsViaAPI } from "@/lib/userTicketServiceAPI";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  MessageCircle,
  Phone,
  Mail,
  HelpCircle,
  FileText,
  Users,
  Shield,
  Gamepad2,
  CreditCard,
  Settings,
  Loader2,
} from "lucide-react";
import { SUPPORT_CONTACTS } from "@/config/supportContacts";

const supportTicketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  category: z.string().min(1, "Please select a category"),
  priority: z.string().min(1, "Please select a priority"),
  description: z.string().min(20, "Description must be at least 20 characters"),
});

type SupportTicketFormValues = z.infer<typeof supportTicketSchema>;

const FAQ_ITEMS = [
  {
    question: "How do I join a tournament?",
    answer: "Navigate to the Tournaments page, select a tournament, and click 'Join Tournament'. Make sure you have sufficient wallet balance for the entry fee.",
    category: "tournaments",
  },
  {
    question: "How do I add money to my wallet?",
    answer: "Go to the Wallet page and click 'Add Money'. You can add funds using UPI, cards, or net banking. Minimum amount is ₹10.",
    category: "wallet",
  },
  {
    question: "What is KYC verification and why is it required?",
    answer: "KYC (Know Your Customer) verification is required for withdrawals and high-stakes tournaments. Upload your Aadhaar card and PAN card in the Profile section.",
    category: "kyc",
  },
  {
    question: "How do I upload match screenshots?",
    answer: "After your match starts, go to My Matches, find your match, and upload screenshots showing your game results within the specified time limit.",
    category: "matches",
  },
  {
    question: "When will my withdrawal be processed?",
    answer: "Withdrawals are processed within 1-3 business days after KYC verification. Weekend withdrawals may take longer to process.",
    category: "wallet",
  },
  {
    question: "How do I change my game ID?",
    answer: "Go to Profile > Gaming Profile and update your Game ID. Make sure it matches your actual in-game player ID.",
    category: "profile",
  },
];

const CONTACT_INFO = [
  {
    icon: Phone,
    title: "Phone Support",
    details: [
      { country: 'Nigeria', number: SUPPORT_CONTACTS.phone.nigeria },
      { country: 'India', number: SUPPORT_CONTACTS.phone.india },
      { country: 'USA', number: SUPPORT_CONTACTS.phone.usa },
    ],
    availability: "Mon-Fri, 9 AM - 6 PM",
    action: "Call Now",
  },
  {
    icon: Mail,
    title: "Email Support",
    details: SUPPORT_CONTACTS.email,
    availability: "24/7 Support",
    action: "Send Email",
  },
  {
    icon: MessageCircle,
    title: "Live Chat",
    details: "Chat with our support team",
    availability: "Mon-Fri, 10 AM - 8 PM",
    action: "Start Chat",
  },
];

export default function Support() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [userTickets, setUserTickets] = useState<{ id: string; ticketId: string; subject: string; category: string; priority: string; status: string; createdAt: string | Date; description: string; responses?: { isAdmin: boolean; createdAt: string | Date; message: string }[]; }[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [activeTab, setActiveTab] = useState("faq");
  const form = useForm<SupportTicketFormValues>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: {
      subject: "",
      category: "",
      priority: "",
      description: "",
    },
  });

  // Function to fetch user's tickets
  const fetchUserTickets = async () => {
    if (!userProfile) return;
    
    setLoadingTickets(true);
    try {
      // Try API version first, fallback to direct Firebase
      let result;
      try {
        result = await getUserTicketsViaAPI(userProfile.uid);
      } catch (apiError) {
        console.warn("API ticket fetch failed, trying direct Firebase:", apiError);
        result = await getUserTickets(userProfile.uid);
      }
      
      if (result.success) {
        setUserTickets(result.tickets);
      } else {
        console.error("Failed to fetch tickets:", result.error);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoadingTickets(false);
    }
  };

  // Fetch tickets when component mounts or user profile changes
  useEffect(() => {
    if (userProfile && activeTab === "mytickets") {
      fetchUserTickets();
    }
  }, [userProfile, activeTab]);const onSubmit = async (values: SupportTicketFormValues) => {
    if (!userProfile) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to submit a support ticket.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Try API version first (server-side), fallback to direct Firebase
      let result;
      try {
        result = await submitTicketViaAPI(values, userProfile);
      } catch (apiError) {
        console.warn("API submission failed, trying direct Firebase:", apiError);
        result = await submitTicket(values, userProfile);
      }
      
      if (result.success) {
        toast({
          title: "Support ticket created",
          description: `We'll get back to you within 24 hours. Ticket ID: #${result.ticketId}`,
        });
        
        form.reset();
        
        // Switch to My Tickets tab and refresh tickets
        setActiveTab("mytickets");
        fetchUserTickets();
      } else {
        throw new Error(result.error || "Failed to submit ticket");
      }
    } catch (error) {
      console.error("Submit ticket error:", error);
      toast({
        variant: "destructive",
        title: "Failed to submit",
        description: "Please try again or contact us directly.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredFAQs = selectedCategory === "all" 
    ? FAQ_ITEMS 
    : FAQ_ITEMS.filter(item => item.category === selectedCategory);

  if (!userProfile) return null;
  return (
    <div className="container-responsive py-4 sm:py-6 md:py-10">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-responsive-lg font-bold font-poppins">
          Support Center
        </h1>
        <p className="text-gray-400 mt-1 text-sm sm:text-base">
          Get help with your account, tournaments, and payments
        </p>
      </div>      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-dark-card border border-gray-800 h-12 sm:h-auto">
          <TabsTrigger value="faq" className="data-[state=active]:bg-primary text-xs sm:text-sm">
            <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">FAQ</span>
            <span className="sm:hidden">Help</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="data-[state=active]:bg-primary text-xs sm:text-sm">
            <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Contact</span>
            <span className="sm:hidden">Call</span>
          </TabsTrigger>
          <TabsTrigger value="ticket" className="data-[state=active]:bg-primary text-xs sm:text-sm">
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Submit Ticket</span>
            <span className="sm:hidden">Submit</span>
          </TabsTrigger>
          <TabsTrigger value="mytickets" className="data-[state=active]:bg-primary text-xs sm:text-sm">
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">My Tickets</span>
            <span className="sm:hidden">Tickets</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="mt-4 sm:mt-6">
          <Card className="bg-dark-card border-gray-800 p-4 sm:p-6">            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Frequently Asked Questions</h2>
              
              <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                  className="text-xs h-8 sm:h-9 px-2 sm:px-3 touch-target"
                >
                  All
                </Button>
                <Button
                  variant={selectedCategory === "tournaments" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("tournaments")}
                  className="text-xs h-8 sm:h-9 px-2 sm:px-3 touch-target"
                >
                  <Gamepad2 className="h-3 w-3 mr-1" />
                  Tournaments
                </Button>
                <Button
                  variant={selectedCategory === "wallet" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("wallet")}
                  className="text-xs"
                >
                  <CreditCard className="h-3 w-3 mr-1" />
                  Wallet
                </Button>
                <Button
                  variant={selectedCategory === "kyc" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("kyc")}
                  className="text-xs"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  KYC
                </Button>
                <Button
                  variant={selectedCategory === "matches" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("matches")}
                  className="text-xs"
                >
                  <Users className="h-3 w-3 mr-1" />
                  Matches
                </Button>
                <Button
                  variant={selectedCategory === "profile" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("profile")}
                  className="text-xs"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Profile
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredFAQs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-dark-lighter border border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-sm">{faq.question}</h3>
                    <Badge variant="outline" className="text-xs border-gray-600">
                      {faq.category}
                    </Badge>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>        <TabsContent value="contact" className="mt-4 sm:mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {CONTACT_INFO.map((contact, index) => (
              <Card key={index} className="bg-dark-card border-gray-800 p-4 sm:p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/20 p-2 sm:p-3 rounded-full mb-3 sm:mb-4">
                    <contact.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2 text-sm sm:text-base">{contact.title}</h3>
                  {Array.isArray(contact.details) ? (
                    <div className="text-gray-300 mb-1 text-sm text-left">
                      {contact.details.map((item, idx) => (
                        <div key={item.country} className="mb-1">
                          <span className="font-bold">{item.country}:</span> <span className="font-bold">{item.number}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-300 mb-1 text-sm">{contact.details}</p>
                  )}
                  <p className="text-gray-500 text-xs sm:text-sm mb-3 sm:mb-4">{contact.availability}</p>
                  {contact.action === "Send Email" ? (
                    <Button
                      className="w-full touch-target"
                      size="sm"
                      asChild
                    >
                      <a href={`mailto:${SUPPORT_CONTACTS.email}`}>Send Email</a>
                    </Button>
                  ) : (
                    <Button className="w-full touch-target" size="sm">
                      {contact.action}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>          <Card className="bg-dark-card border-gray-800 p-4 sm:p-6 mt-4 sm:mt-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Support Hours</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-center justify-between py-2 text-sm sm:text-base">
                <span className="text-gray-300">Monday - Friday</span>
                <span className="text-green-500 font-medium">9:00 AM - 8:00 PM</span>
              </div>
              <div className="flex items-center justify-between py-2 text-sm sm:text-base">
                <span className="text-gray-300">Saturday</span>
                <span className="text-yellow-500 font-medium">10:00 AM - 6:00 PM</span>
              </div>
              <div className="flex items-center justify-between py-2 text-sm sm:text-base">
                <span className="text-gray-300">Sunday</span>
                <span className="text-red-500 font-medium">Closed</span>
              </div>
              <div className="flex items-center justify-between py-2 text-sm sm:text-base">
                <span className="text-gray-300">Email Support</span>
                <span className="text-green-500 font-medium">24/7</span>
              </div>
            </div>
          </Card>
        </TabsContent>        <TabsContent value="ticket" className="mt-4 sm:mt-6">
          <Card className="bg-dark-card border-gray-800 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Submit Support Ticket</h2>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 form-mobile">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-dark-lighter border-gray-700 h-10 sm:h-12">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="account">Account Issues</SelectItem>
                            <SelectItem value="tournament">Tournament Problems</SelectItem>
                            <SelectItem value="payment">Payment & Wallet</SelectItem>
                            <SelectItem value="kyc">KYC Verification</SelectItem>
                            <SelectItem value="technical">Technical Issues</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-dark-lighter border-gray-700 h-10 sm:h-12">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Brief description of your issue"
                          className="bg-dark-lighter border-gray-700 h-10 sm:h-12"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your issue in detail. Include steps to reproduce if it's a technical problem."
                          className="bg-dark-lighter border-gray-700 min-h-[100px] sm:min-h-[120px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-dark-lighter border border-gray-700 rounded-lg p-3 sm:p-4">
                  <h3 className="font-medium mb-2 text-sm sm:text-base">Account Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400">
                    <div>
                      <span className="font-medium">Username:</span> {userProfile.username}
                    </div>
                    <div>
                      <span className="font-medium">User ID:</span> {userProfile.uid?.slice(0, 8)}...
                    </div>
                    <div>
                      <span className="font-medium">Game Mode:</span> {userProfile.gameMode}
                    </div>
                    <div>
                      <span className="font-medium">KYC Status:</span> {userProfile.kycStatus}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                    className="order-2 sm:order-1 touch-target"
                  >
                    <span className="hidden sm:inline">Clear Form</span>
                    <span className="sm:hidden">Clear</span>
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 order-1 sm:order-2 touch-target"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span className="hidden sm:inline">Submitting...</span>
                        <span className="sm:hidden">Wait...</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">Submit Ticket</span>
                        <span className="sm:hidden">Submit</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>          </Card>
        </TabsContent>

        <TabsContent value="mytickets" className="mt-4 sm:mt-6">
          <Card className="bg-dark-card border-gray-800 p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold">My Support Tickets</h2>
              <Button
                onClick={fetchUserTickets}
                disabled={loadingTickets}
                variant="outline"
                size="sm"
              >
                {loadingTickets ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  "Refresh"
                )}
              </Button>
            </div>
            
            {loadingTickets ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading tickets...</span>
              </div>
            ) : userTickets.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No tickets found</h3>
                <p className="text-gray-400 mb-4">You haven&apos;t submitted any support tickets yet.</p>
                <Button onClick={() => setActiveTab("ticket")}>
                  Submit Your First Ticket
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {userTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-dark-lighter border border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-white mb-1">
                          {ticket.subject}
                        </h3>
                        <p className="text-sm text-gray-400">
                          Ticket ID: #{ticket.ticketId}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          className={`${
                            ticket.status === 'open'
                              ? 'bg-yellow-600 hover:bg-yellow-700'
                              : ticket.status === 'in_progress'
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : ticket.status === 'resolved'
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-gray-600 hover:bg-gray-700'
                          } text-white`}
                        >
                          {ticket.status === 'open' && 'Open'}
                          {ticket.status === 'in_progress' && 'In Progress'}
                          {ticket.status === 'resolved' && 'Resolved'}
                          {ticket.status === 'closed' && 'Closed'}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-gray-600">
                          {ticket.priority}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                      <div>
                        <span className="text-xs text-gray-400">Category:</span>
                        <p className="text-sm text-gray-300 capitalize">{ticket.category}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400">Created:</span>
                        <p className="text-sm text-gray-300">
                          {(() => {
                            if (ticket.createdAt instanceof Date) {
                              return ticket.createdAt.toLocaleDateString();
                            } else if (typeof ticket.createdAt === 'string') {
                              const d = new Date(ticket.createdAt);
                              return isNaN(d.getTime()) ? ticket.createdAt : d.toLocaleDateString();
                            } else {
                              return '';
                            }
                          })()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <span className="text-xs text-gray-400">Description:</span>
                      <p className="text-sm text-gray-300 mt-1 line-clamp-3">
                        {ticket.description}
                      </p>
                    </div>
                    
                    {ticket.responses && ticket.responses.length > 0 && (
                      <div className="border-t border-gray-700 pt-3">
                        <span className="text-xs text-gray-400">Latest Response:</span>
                        <div className="mt-2 bg-dark p-3 rounded">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-primary">
                              {ticket.responses[ticket.responses.length - 1].isAdmin ? 'Admin' : 'You'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {(() => {
                                const respDate = ticket.responses[ticket.responses.length - 1].createdAt;
                                if (respDate instanceof Date) {
                                  return respDate.toLocaleDateString();
                                } else if (typeof respDate === 'string') {
                                  const d = new Date(respDate);
                                  return isNaN(d.getTime()) ? respDate : d.toLocaleDateString();
                                } else {
                                  return '';
                                }
                              })()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300">
                            {ticket.responses[ticket.responses.length - 1].message}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
