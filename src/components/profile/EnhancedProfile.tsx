import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTournaments } from "@/hooks/useTournaments";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  Award,
  Camera,
  Medal,
  Zap,
} from "lucide-react";

interface UserStats {
  totalTournaments: number;
  tournamentsWon: number;
  totalEarnings: number;
  currentStreak: number;
  bestRank: number;
  averageRank: number;
  winRate: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export default function EnhancedProfile() {
  const { userProfile, updateUserProfile } = useAuth();
  const { userMatches } = useTournaments();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [profileData, setProfileData] = useState({
    displayName: userProfile?.displayName || "",
    bio: userProfile?.bio || "",
    gameId: userProfile?.gameId || "",
    favoriteGame: userProfile?.favoriteGame || "",
  });

  useEffect(() => {
    if (userProfile && userMatches) {
      calculateStats();
      fetchAchievements();
    }
  }, [userProfile, userMatches]);

  const calculateStats = () => {
    const totalTournaments = userMatches.length;
    const tournamentsWon = userMatches.filter(
      (match) => match.result === "won"
    ).length;
    const totalEarnings = userMatches.reduce(
      (sum, match) =>
        sum +
        ("winnings" in match && typeof match.winnings === "number"
          ? match.winnings
          : 0),
      0
    );

    // Calculate streak
    let currentStreak = 0;
    for (let i = userMatches.length - 1; i >= 0; i--) {
      if (userMatches[i].result === "won") {
        currentStreak++;
      } else {
        break;
      }
    }

    const positions = userMatches
      .filter((match) => typeof match.position === "number")
      .map((match) => match.position as number);

    const bestRank = positions.length > 0 ? Math.min(...positions) : 0;
    const averageRank =
      positions.length > 0
        ? Math.round(
            positions.reduce((sum, pos) => (sum ?? 0) + (pos ?? 0), 0) /
              positions.length
          )
        : 0;

    const winRate = totalTournaments > 0 ? (tournamentsWon / totalTournaments) * 100 : 0;

    setStats({
      totalTournaments,
      tournamentsWon,
      totalEarnings,
      currentStreak,
      bestRank,
      averageRank,
      winRate: Math.round(winRate * 100) / 100,
    });
  };

  const fetchAchievements = async () => {
    if (!userProfile) return;

    try {
      const achievementsDoc = await getDoc(
        doc(db, "user_achievements", userProfile.uid)
      );
      if (achievementsDoc.exists()) {
        setAchievements(achievementsDoc.data().achievements || []);
      }
    } catch (error) {
      console.error("Error fetching achievements:", error);
    }
  };
  // Helper function to resize image before upload to stay within Firestore limits
  const resizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          // Max dimensions - keeping the image reasonably sized
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;

          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height && width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          } else if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to blob with reduced quality (0.8 = 80% quality)
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Canvas to Blob conversion failed"));
              }
            },
            "image/jpeg",
            0.8
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userProfile) return;

    setIsLoading(true);
    try {
      // Resize the image before uploading to reduce size
      const resizedImage = await resizeImage(file);

      // Generate a unique filename with timestamp and user ID
      const filename = `profile_${Date.now()}.jpg`;
      const storageRef = ref(storage, `avatars/${userProfile.uid}/${filename}`);

      // Upload the resized image to Firebase Storage
      await uploadBytes(storageRef, resizedImage);
      const downloadURL = await getDownloadURL(storageRef);

      // Update only the photoURL in Firestore, not the full image data
      await updateUserProfile({ photoURL: downloadURL });

      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to update profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!userProfile) return;

    setIsLoading(true);
    try {
      await updateDoc(doc(db, "users", userProfile.uid), {
        displayName: profileData.displayName,
        bio: profileData.bio,
        gameId: profileData.gameId,
        favoriteGame: profileData.favoriteGame,
        updatedAt: new Date(),
      });

      await updateUserProfile(profileData);
      setIsEditing(false);

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "bg-gradient-to-r from-yellow-400 to-orange-500";
      case "epic":
        return "bg-gradient-to-r from-purple-400 to-pink-500";
      case "rare":
        return "bg-gradient-to-r from-blue-400 to-cyan-500";
      default:
        return "bg-gradient-to-r from-gray-400 to-gray-600";
    }
  };

  if (!userProfile) return null;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24 md:w-32 md:h-32 relative">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full z-10">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>
                  </div>
                )}
                <AvatarImage src={userProfile.photoURL} />
                <AvatarFallback className="text-2xl">
                  {userProfile.displayName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>

              <label
                className={`absolute bottom-0 right-0 bg-primary rounded-full p-2 cursor-pointer hover:bg-primary/80 transition-colors ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isLoading}
                />
              </label>
            </div>

            <div className="flex-1 space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={profileData.displayName}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          displayName: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="gameId">Game ID</Label>
                    <Input
                      id="gameId"
                      value={profileData.gameId}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          gameId: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          bio: e.target.value,
                        }))
                      }
                      placeholder="Tell others about yourself..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} disabled={isLoading}>
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">{userProfile.displayName}</h1>
                    <Button onClick={() => setIsEditing(true)} variant="outline">
                      Edit Profile
                    </Button>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400">
                    @{userProfile.gameId}
                  </p>

                  {userProfile.bio && (
                    <p className="text-gray-800 dark:text-gray-200 mt-2">
                      {userProfile.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge variant="secondary">
                      <Calendar className="w-3 h-3 mr-1" />
                      Joined{" "}
                      {userProfile.createdAt instanceof Date
                        ? userProfile.createdAt.toLocaleDateString()
                        : new Date(
                            (userProfile.createdAt as { seconds?: number })
                              ?.seconds
                              ? (userProfile.createdAt as { seconds: number })
                                  .seconds * 1000
                              : Date.now()
                          ).toLocaleDateString()}
                    </Badge>
                    {userProfile.favoriteGame && (
                      <Badge variant="secondary">
                        <Target className="w-3 h-3 mr-1" />
                        {userProfile.favoriteGame}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{stats.tournamentsWon}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Tournaments Won
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{stats.winRate}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Win Rate
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{stats.currentStreak}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Current Streak
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Medal className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">#{stats.bestRank}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Best Rank
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Achievements Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {achievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg ${getRarityColor(
                    achievement.rarity
                  )} text-white`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div>
                      <h3 className="font-semibold">{achievement.title}</h3>
                      <p className="text-sm opacity-90">
                        {achievement.description}
                      </p>
                      <p className="text-xs opacity-75 mt-1">
                        {achievement.unlockedAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Award className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>
                No achievements yet. Start playing tournaments to unlock
                achievements!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
