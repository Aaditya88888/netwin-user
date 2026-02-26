import { storage, db } from './firebaseConfig';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';

export interface ScreenshotUploadResult {
  success: boolean;
  downloadURL?: string;
  error?: string;
}

/**
 * Calculate tournament points based on kills and position
 */
export const calculateTournamentPoints = (kills: number, position: number | null): number => {
  let points = 0;
  
  // Points for kills (1 point per kill)
  points += kills;
  
  // Points for placement
  if (position === 1) points += 10; // Winner gets 10 points
  else if (position === 2) points += 6; // Second place gets 6 points
  else if (position === 3) points += 4; // Third place gets 4 points
  else if (position && position <= 10) points += 2; // Top 10 gets 2 points
  
  return points;
};

export class ScreenshotService {
  /**
   * Upload a screenshot for a match result
   */
  static async uploadMatchScreenshot(
    userId: string,
    matchId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ScreenshotUploadResult> {
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        return { success: false, error: 'Please upload an image file' };
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return { success: false, error: 'Image size should be less than 5MB' };
      }

      // Create unique filename
      const timestamp = Date.now();
      const fileName = `screenshots/${userId}/${matchId}/result_${timestamp}.${file.name.split('.').pop()}`;
      
      // Create storage reference
      const storageRef = ref(storage, fileName);

      // Upload file with progress tracking
      if (onProgress) {
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        return new Promise((resolve) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              onProgress(progress);
            },
            (error) => {
              console.error('Screenshot upload error:', error);
              resolve({ success: false, error: error.message });
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve({ success: true, downloadURL });
              } catch (error) {
                resolve({ success: false, error: (error as Error).message });
              }
            }
          );
        });
      } else {
        // Simple upload without progress
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return { success: true, downloadURL };
      }
    } catch (error) {
      console.error('Screenshot upload error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Upload a screenshot from base64 data
   */
  static async uploadScreenshotFromBase64(
    userId: string,
    matchId: string,
    base64Data: string
  ): Promise<ScreenshotUploadResult> {
    try {
      // Convert base64 to blob
      const response = await fetch(base64Data);
      const blob = await response.blob();
      
      // Create file from blob
      const file = new File([blob], `screenshot_${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });

      return this.uploadMatchScreenshot(userId, matchId, file);
    } catch (error) {
      console.error('Base64 screenshot upload error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Update match result with screenshot and data
   */
  static async submitMatchResult(
    matchId: string,
    screenshot: string,
    kills?: number,
    position?: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First try to update user_matches document (if it exists)
      try {
        const matchRef = doc(db, 'user_matches', matchId);
        
        const updateData = {
          resultScreenshot: screenshot,
          resultImageUrl: screenshot, // Also save to resultImageUrl field
          resultSubmitted: true,
          resultSubmittedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...(typeof kills === 'number' && { kills }),
          ...(typeof position === 'number' && { position })
        };

        await updateDoc(matchRef, updateData);
        } catch (userMatchError) {
        console.warn('[ScreenshotService] Failed to update user_matches document (might not exist):', userMatchError);
        // Continue to try tournament registration update
      }

      // Also update the tournament registration with the result image URL
      // This is the primary method now since we're using tournament registrations
      try {
        // The matchId might actually be a user_match ID, so let's try to find the tournament registration
        // First, try to get the user match to extract userId and tournamentId
        let userId, tournamentId;
        
        try {
          const matchSnapshot = await getDocs(query(collection(db, 'user_matches'), where('__name__', '==', matchId)));
          
          if (!matchSnapshot.empty) {
            const matchData = matchSnapshot.docs[0].data();
            userId = matchData.userId;
            tournamentId = matchData.tournamentId;
            } else {
            console.warn('[ScreenshotService] No user_matches document found for matchId:', matchId);
            // The matchId might be a tournament registration ID directly
            // In that case, try to update the tournament registration directly
            const registrationRef = doc(db, 'tournament_registrations', matchId);
            await updateDoc(registrationRef, {
              resultImageUrl: screenshot,
              resultSubmitted: true,
              resultSubmittedAt: serverTimestamp(),
              ...(typeof kills === 'number' && { kills }),
              ...(typeof position === 'number' && { position }),
              points: calculateTournamentPoints(kills || 0, position || null),
              updatedAt: serverTimestamp()
            });
            return { success: true };
          }
        } catch (queryError) {
          console.error('[ScreenshotService] Error querying user_matches:', queryError);
          return { success: false, error: 'Failed to find match data' };
        }
        
        if (userId && tournamentId) {
          // Find and update the corresponding tournament registration
          const registrationQuery = query(
            collection(db, 'tournament_registrations'),
            where('userId', '==', userId),
            where('tournamentId', '==', tournamentId)
          );
          
          const registrationSnapshot = await getDocs(registrationQuery);
          if (!registrationSnapshot.empty) {
            const registrationRef = registrationSnapshot.docs[0].ref;
            await updateDoc(registrationRef, {
              resultImageUrl: screenshot,
              resultSubmitted: true,
              resultSubmittedAt: serverTimestamp(),
              ...(typeof kills === 'number' && { kills }),
              ...(typeof position === 'number' && { position }),
              // Calculate points based on kills and position
              points: calculateTournamentPoints(kills || 0, position || null),
              updatedAt: serverTimestamp()
            });
            } else {
            console.error('[ScreenshotService] No tournament registration found for userId:', userId, 'tournamentId:', tournamentId);
            return { success: false, error: 'Tournament registration not found' };
          }
        }
      } catch (regError) {
        console.error('[ScreenshotService] Failed to update tournament registration with result image:', regError);
        return { success: false, error: 'Failed to update tournament registration: ' + (regError as Error).message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error submitting match result:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Validate image file before upload
   */
  static validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'Please select an image file' };
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { valid: false, error: 'Image size must be less than 5MB' };
    }

    // Check supported formats
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!supportedTypes.includes(file.type)) {
      return { valid: false, error: 'Supported formats: JPEG, PNG, WebP' };
    }

    return { valid: true };
  }

  /**
   * Get download URL for a storage path
   */
  static async getDownloadURL(storagePath: string): Promise<string | null> {
    try {
      const storageRef = ref(storage, storagePath);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error getting download URL:', error);
      return null;
    }
  }
}
