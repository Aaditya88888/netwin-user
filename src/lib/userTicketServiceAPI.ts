import { UserProfile } from "@/types";

// Backend API service for ticket submission (alternative to direct Firebase)
export interface TicketFormData {
  subject: string;
  category: string;
  priority: string;
  description: string;
}

// Function to submit a ticket via backend API
export const submitTicketViaAPI = async (
  formData: TicketFormData,
  userProfile: UserProfile
): Promise<{ success: boolean; ticketId?: string; error?: string }> => {
  try {
    const response = await fetch('/api/support/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userProfile.uid,
        userEmail: userProfile.email || "",
        username: userProfile.username || userProfile.displayName || "Anonymous",
        subject: formData.subject.trim(),
        category: formData.category,
        priority: formData.priority,
        description: formData.description.trim()
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to submit ticket');
    }

    const result = await response.json();
    return {
      success: true,
      ticketId: result.ticketId
    };
  } catch (error) {
    console.error("Error submitting support ticket via API:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};

// Function to get user's tickets via backend API
export const getUserTicketsViaAPI = async (userId: string) => {
  try {
    const response = await fetch(`/api/support/tickets/${userId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch tickets');
    }

    const result = await response.json();
    return { 
      success: true, 
      tickets: result.tickets || [] 
    };
  } catch (error) {
    console.error("Error fetching user tickets via API:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error", 
      tickets: [] 
    };
  }
};
