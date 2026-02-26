import { db, auth } from "@/lib/firebase";
import { 
  collection, 
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs
} from "firebase/firestore";
import { UserProfile } from "@/types";

// Interface for the ticket form data
export interface TicketFormData {
  subject: string;
  category: string;
  priority: string;
  description: string;
}

// Function to submit a ticket from the user side
export const submitTicket = async (
  formData: TicketFormData,
  userProfile: UserProfile
): Promise<{ success: boolean; ticketId?: string; error?: string }> => {
  try {
        if (!auth.currentUser) {
      console.error('❌ No authenticated user found');
      return {
        success: false,
        error: "User not authenticated"
      };
    }

    // Generate a unique ticket ID
    const ticketId = `ST-${Date.now().toString(36).toUpperCase()}`;
    
    // Create the ticket document
    const ticketData = {
      ticketId,
      userId: userProfile.uid,
      userEmail: userProfile.email || "",
      username: userProfile.username || userProfile.displayName || "Anonymous",
      subject: formData.subject.trim(),
      category: formData.category,
      priority: formData.priority,
      description: formData.description.trim(),
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      responses: []    };
    
    // Add the ticket to Firestore
    const docRef = await addDoc(collection(db, "support_tickets"), ticketData);
    
    return {
      success: true,
      ticketId
    };
  } catch (error) {
    console.error("Error submitting support ticket:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};

// Function to get user's tickets
export const getUserTickets = async (userId: string) => {
  try {
    const ticketsRef = collection(db, "support_tickets");
    const q = query(
      ticketsRef, 
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const tickets = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      };
    });
    
    return { success: true, tickets };
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", tickets: [] };
  }
};
