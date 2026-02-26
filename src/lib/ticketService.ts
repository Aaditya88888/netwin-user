import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc, 
  where, 
  Timestamp, 
  deleteDoc,
  addDoc,
  serverTimestamp
} from "firebase/firestore";

// Types
export interface SupportTicket {
  id: string;
  ticketId: string;
  userId: string;
  userEmail: string;
  username: string;
  subject: string;
  category: string;
  priority: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  responses: TicketResponse[];
}

export interface TicketResponse {
  id: string;
  message: string;
  isAdmin: boolean;
  createdAt: Timestamp;
  adminName?: string;
}

export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
}

export interface TicketFilter {
  status?: string;
  category?: string;
  priority?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  searchTerm?: string;
}

// Export API for the admin app to consume
export const TicketAPI = {
  fetchTickets: async (filters?: TicketFilter) => {
    try {
      const ticketsRef = collection(db, "support_tickets");
      let q = query(ticketsRef, orderBy("createdAt", "desc"));
      
      if (filters?.status && filters.status !== 'all') {
        q = query(q, where("status", "==", filters.status));
      }
      
      if (filters?.category && filters.category !== 'all') {
        q = query(q, where("category", "==", filters.category));
      }
      
      if (filters?.priority && filters.priority !== 'all') {
        q = query(q, where("priority", "==", filters.priority));
      }
      
      const querySnapshot = await getDocs(q);
      const tickets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SupportTicket));
      
      // Apply search filter client-side if needed
      if (filters?.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        return tickets.filter(ticket => 
          ticket.subject?.toLowerCase().includes(searchTerm) ||
          ticket.description?.toLowerCase().includes(searchTerm) ||
          ticket.username?.toLowerCase().includes(searchTerm) ||
          ticket.userEmail?.toLowerCase().includes(searchTerm) ||
          ticket.ticketId?.toLowerCase().includes(searchTerm)
        );
      }
      
      return tickets;
    } catch (error) {
      console.error("Error fetching tickets:", error);
      throw error;
    }
  },
  
  getTicketById: async (ticketId: string) => {
    try {
      const ticketsRef = collection(db, "support_tickets");
      const q = query(ticketsRef, where("ticketId", "==", ticketId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error(`No ticket found with ID ${ticketId}`);
      }
      
      const ticket = {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data()
      } as SupportTicket;
      
      return ticket;
    } catch (error) {
      console.error(`Error fetching ticket with ID ${ticketId}:`, error);
      throw error;
    }
  },
  
  updateTicketStatus: async (ticketId: string, newStatus: string) => {
    try {
      const ticketRef = doc(db, "support_tickets", ticketId);
      await updateDoc(ticketRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Error updating ticket status:", error);
      throw error;
    }
  },
  
  addResponse: async (ticketId: string, message: string, adminName: string) => {
    try {
      const ticketRef = doc(db, "support_tickets", ticketId);
      const ticketSnap = await getDocs(query(collection(db, "support_tickets"), where("id", "==", ticketId)));
      
      if (ticketSnap.empty) {
        throw new Error("Ticket not found");
      }
      
      const ticketData = ticketSnap.docs[0].data() as SupportTicket;
      
      const newResponse = {
        id: `resp-${Date.now()}`,
        message: message.trim(),
        isAdmin: true,
        adminName: adminName,
        createdAt: serverTimestamp()
      };
      
      // Update ticket status to in_progress if currently open
      const newStatus = ticketData.status === 'open' ? 'in_progress' : ticketData.status;
      
      await updateDoc(ticketRef, {
        responses: [...(ticketData.responses || []), newResponse],
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error("Error adding response:", error);
      throw error;
    }
  },
  
  deleteTicket: async (ticketId: string) => {
    try {
      await deleteDoc(doc(db, "support_tickets", ticketId));
      return true;
    } catch (error) {
      console.error("Error deleting ticket:", error);
      throw error;
    }
  },
  
  // Create a new ticket (admin can create tickets on behalf of users if needed)
  createTicket: async (ticketData: {
    userId: string;
    userEmail: string;
    username: string;
    subject: string;
    category: string;
    priority: string;
    description: string;
  }) => {
    try {
      const ticketId = `ST-${Date.now().toString(36).toUpperCase()}`;
      
      const newTicket = {
        ...ticketData,
        ticketId,
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        responses: []
      };
      
      const docRef = await addDoc(collection(db, "support_tickets"), newTicket);      return {
        id: docRef.id,
        ...newTicket
      };
    } catch (error) {
      console.error("Error creating ticket:", error);
      throw error;
    }
  },
  
  exportTickets: async (format: ExportFormat, filters?: TicketFilter) => {
    try {
      const tickets = await TicketAPI.fetchTickets(filters);
      
      if (format === ExportFormat.JSON) {
        return JSON.stringify(tickets, null, 2);
      } else {
        // CSV Format
        const headers = ["Ticket ID", "User", "Email", "Subject", "Category", "Priority", "Status", "Created At"];
        const rows = tickets.map(ticket => [
          ticket.ticketId,
          ticket.username,
          ticket.userEmail,
          ticket.subject,
          ticket.category,
          ticket.priority,
          ticket.status,
          ticket.createdAt?.toDate?.().toLocaleString() || ''
        ]);
        return [headers, ...rows].map(row => row.join(',')).join('\n');
      }
    } catch (error) {
      console.error("Error exporting tickets:", error);
      throw error;
    }
  },
  
  // Get ticket analytics/statistics
  getTicketAnalytics: async () => {
    try {
      const tickets = await TicketAPI.fetchTickets();
      
      const analytics = {
        total: tickets.length,
        byStatus: {
          open: tickets.filter(t => t.status === 'open').length,
          in_progress: tickets.filter(t => t.status === 'in_progress').length,
          resolved: tickets.filter(t => t.status === 'resolved').length,
          closed: tickets.filter(t => t.status === 'closed').length
        },
        byCategory: {} as Record<string, number>,
        byPriority: {
          high: tickets.filter(t => t.priority === 'high').length,
          medium: tickets.filter(t => t.priority === 'medium').length,
          low: tickets.filter(t => t.priority === 'low').length,
        },
        responseTime: {
          average: 0,
          min: 0,
          max: 0
        }
      };
      
      // Calculate categories
      tickets.forEach(ticket => {
        if (ticket.category) {
          analytics.byCategory[ticket.category] = (analytics.byCategory[ticket.category] || 0) + 1;
        }
      });
      
      // Calculate response times (for tickets with responses)
      const ticketsWithResponses = tickets.filter(t => t.responses && t.responses.length > 0);
      if (ticketsWithResponses.length > 0) {
        const responseTimes = ticketsWithResponses.map(ticket => {
          const createdTime = ticket.createdAt.toDate().getTime();
          const firstResponseTime = ticket.responses.find(r => r.isAdmin)?.createdAt.toDate().getTime() || 0;
          return firstResponseTime ? (firstResponseTime - createdTime) / 1000 / 60 / 60 : 0; // hours
        }).filter(time => time > 0);
        
        if (responseTimes.length > 0) {
          analytics.responseTime = {
            average: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
            min: Math.min(...responseTimes),
            max: Math.max(...responseTimes)
          };
        }
      }
      
      return analytics;
    } catch (error) {
      console.error("Error getting ticket analytics:", error);
      throw error;
    }
  }
};
