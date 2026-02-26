import React, { useState, useContext } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ThemeContext } from "@/contexts/ThemeContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

import {
  Form,
  FormControl,
  FormDescription,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Settings as SettingsIcon,
  Palette,
  Bell,
  Shield,
  Globe,
  Gamepad2,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Monitor,
  User,
  Trash2,
  Download,
  Lock,
  RefreshCw,
} from "lucide-react";
import { COUNTRIES } from "@/utils/constants";

// Settings form schemas
const generalSettingsSchema = z.object({
  country: z.string().min(1, "Country is required"),
  // gameMode and language removed for now
});

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  matchReminders: z.boolean(),
  tournamentUpdates: z.boolean(),
  promotionalEmails: z.boolean(),
  weeklyDigest: z.boolean(),
});

const privacySettingsSchema = z.object({
  profileVisibility: z.enum(["public", "friends", "private"]),
  showGameStats: z.boolean(),
  showWinnings: z.boolean(),
  allowFriendRequests: z.boolean(),
  showOnlineStatus: z.boolean(),
  dataCollection: z.boolean(),
});

type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;
type NotificationSettingsValues = z.infer<typeof notificationSettingsSchema>;
type PrivacySettingsValues = z.infer<typeof privacySettingsSchema>;

interface UserSettings {
  general: GeneralSettingsValues;
  notifications: NotificationSettingsValues;
  privacy: PrivacySettingsValues;
  theme: "light" | "dark" | "system";
  soundEnabled: boolean;
}

export default function Settings() {
  const { userProfile, updateUserProfile, signOut } = useAuth();
  const { theme, setTheme } = useContext(ThemeContext);
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<string>("general");
  const [isUpdating, setIsUpdating] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(
    localStorage.getItem("netwin_sound_enabled") !== "false"
  );

  // Load user settings from localStorage or defaults
  const loadUserSettings = (): UserSettings => {
    const stored = localStorage.getItem("netwin_user_settings");
    const defaults: UserSettings = {
      general: {
        country: userProfile?.country || "India",
        // gameMode and language removed for now
      },
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        matchReminders: true,
        tournamentUpdates: true,
        promotionalEmails: false,
        weeklyDigest: true,
      },
      privacy: {
        profileVisibility: "public",
        showGameStats: true,
        showWinnings: false,
        allowFriendRequests: true,
        showOnlineStatus: true,
        dataCollection: true,
      },
      theme: theme,
      soundEnabled: soundEnabled,
    };

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return { ...defaults, ...parsed };
      } catch (error) {
        console.error("Error parsing user settings:", error);
      }
    }
    return defaults;
  };

  const [userSettings, setUserSettings] = useState<UserSettings>(loadUserSettings());

  // Form initialization
  const generalForm = useForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: userSettings.general,
  });

  const notificationForm = useForm<NotificationSettingsValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: userSettings.notifications,
  });

  const privacyForm = useForm<PrivacySettingsValues>({
    resolver: zodResolver(privacySettingsSchema),
    defaultValues: userSettings.privacy,
  });

  if (!userProfile) return null;

  // Save settings to localStorage
  const saveSettings = (newSettings: Partial<UserSettings>) => {
    const updatedSettings = { ...userSettings, ...newSettings };
    setUserSettings(updatedSettings);
    localStorage.setItem("netwin_user_settings", JSON.stringify(updatedSettings));
  };
  // Handle general settings form submission
  const onGeneralSubmit = async (values: GeneralSettingsValues) => {
    setIsUpdating(true);
    try {
      // Update user profile with new settings (country only for now)
      const updatedProfile = {
        country: values.country
        // gameMode and language removed
      };

      // Update user profile
      await updateUserProfile(updatedProfile);

      // Save to local settings
      saveSettings({ general: values });

      toast({
        title: "Settings Updated",
        description: "General settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update general settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle notification settings form submission
  const onNotificationSubmit = async (values: NotificationSettingsValues) => {
    setIsUpdating(true);
    try {
      saveSettings({ notifications: values });
      toast({
        title: "Notification Preferences Updated",
        description: "Your notification settings have been saved.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update notification settings.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle privacy settings form submission
  const onPrivacySubmit = async (values: PrivacySettingsValues) => {
    setIsUpdating(true);
    try {
      saveSettings({ privacy: values });
      toast({
        title: "Privacy Settings Updated",
        description: "Your privacy preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update privacy settings.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle theme change
  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    if (newTheme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    } else {
      setTheme(newTheme);
    }
    saveSettings({ theme: newTheme });
    
    toast({
      title: "Theme Updated",
      description: `Theme changed to ${newTheme}.`,
    });
  };

  // Handle sound toggle
  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem("netwin_sound_enabled", enabled.toString());
    saveSettings({ soundEnabled: enabled });
    
    toast({
      title: "Sound Settings",
      description: `Sound ${enabled ? "enabled" : "disabled"}.`,
    });
  };

  // Handle data export
  const handleDataExport = () => {
    const exportData = {
      profile: userProfile,
      settings: userSettings,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `netwin-data-${userProfile.username || "user"}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data Exported",
      description: "Your data has been downloaded as a JSON file.",
    });
  };

  // Handle account deletion
  const handleAccountDeletion = async () => {
    try {
      // Note: In a real app, this would call an API to delete the account
      await signOut();
      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete account. Please contact support.",
        variant: "destructive",
      });
    }
  };

  // Get current country info
  const currentCountry = COUNTRIES.find(c => c.name === userSettings.general.country) || COUNTRIES[0];
  return (
    <div className="container-responsive py-4 sm:py-6 md:py-10">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-responsive-lg font-bold font-poppins flex items-center">
          <SettingsIcon className="mr-2 sm:mr-3 h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          Settings
        </h1>
        <p className="text-gray-400 mt-1 text-sm sm:text-base">
          Manage your account preferences and privacy settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Settings Navigation Sidebar */}
        <div className="lg:col-span-1">
          <Card className="bg-dark-card border-gray-800 p-3 sm:p-4">            <nav className="space-y-1 sm:space-y-2">
              <button
                onClick={() => setSelectedTab("general")}
                className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg text-left transition touch-target text-sm sm:text-base ${
                  selectedTab === "general"
                    ? "bg-primary/20 text-primary"
                    : "text-gray-400 hover:text-white hover:bg-dark-lighter"
                }`}
              >
                <Globe className="h-4 w-4 flex-shrink-0" />
                <span className="min-w-0">General</span>
              </button>
              
              <button
                onClick={() => setSelectedTab("appearance")}
                className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg text-left transition touch-target text-sm sm:text-base ${
                  selectedTab === "appearance"
                    ? "bg-primary/20 text-primary"
                    : "text-gray-400 hover:text-white hover:bg-dark-lighter"
                }`}
              >
                <Palette className="h-4 w-4 flex-shrink-0" />
                <span className="min-w-0">Appearance</span>
              </button>
              
              <button
                onClick={() => setSelectedTab("notifications")}
                className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg text-left transition touch-target text-sm sm:text-base ${
                  selectedTab === "notifications"
                    ? "bg-primary/20 text-primary"
                    : "text-gray-400 hover:text-white hover:bg-dark-lighter"
                }`}
              >
                <Bell className="h-4 w-4 flex-shrink-0" />
                <span className="min-w-0 hidden sm:inline">Notifications</span>
                <span className="min-w-0 sm:hidden">Notify</span>
              </button>
              
              <button
                onClick={() => setSelectedTab("privacy")}
                className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg text-left transition touch-target text-sm sm:text-base ${
                  selectedTab === "privacy"
                    ? "bg-primary/20 text-primary"
                    : "text-gray-400 hover:text-white hover:bg-dark-lighter"
                }`}
              >
                <Shield className="h-4 w-4 flex-shrink-0" />
                <span className="min-w-0 hidden sm:inline">Privacy & Security</span>
                <span className="min-w-0 sm:hidden">Privacy</span>
              </button>
              
              <button
                onClick={() => setSelectedTab("gaming")}
                className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg text-left transition touch-target text-sm sm:text-base ${
                  selectedTab === "gaming"
                    ? "bg-primary/20 text-primary"
                    : "text-gray-400 hover:text-white hover:bg-dark-lighter"
                }`}
              >
                <Gamepad2 className="h-4 w-4 flex-shrink-0" />
                <span className="min-w-0">Gaming</span>
              </button>
              
              <button
                onClick={() => setSelectedTab("account")}
                className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg text-left transition touch-target text-sm sm:text-base ${
                  selectedTab === "account"
                    ? "bg-primary/20 text-primary"
                    : "text-gray-400 hover:text-white hover:bg-dark-lighter"
                }`}
              >
                <User className="h-4 w-4 flex-shrink-0" />
                <span className="min-w-0">Account</span>
              </button>
            </nav>
          </Card>
        </div>        {/* Settings Content */}
        <div className="lg:col-span-3">
          <Card className="bg-dark-card border-gray-800 p-4 sm:p-6">
            {/* General Settings */}
            {selectedTab === "general" && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-2">General Settings</h2>
                  <p className="text-gray-400 text-sm sm:text-base">
                    Configure your basic account preferences and regional settings.
                  </p>
                </div>

                <Form {...generalForm}>
                  <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-4 sm:space-y-6 form-mobile">
                    {/* Disable country field if already set (user cannot change after registration) */}
                    <FormField
                      control={generalForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!!userProfile?.country}>
                            <FormControl>
                              <SelectTrigger className="bg-dark-lighter border-gray-700 h-10 sm:h-12">
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {COUNTRIES.map((country) => (
                                <SelectItem key={country.code} value={country.name}>
                                  <div className="flex items-center gap-2">
                                    <span>{country.flag}</span>
                                    <span>{country.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Default Game Mode removed */}

                    {/* Language selection removed */}

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        className="bg-primary hover:bg-primary/90"
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}

            {/* Appearance Settings */}
            {selectedTab === "appearance" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Appearance</h2>
                  <p className="text-gray-400">
                    Customize the look and feel of your application interface.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-3 block">Theme</label>
                    <RadioGroup
                      value={userSettings.theme}
                      onValueChange={handleThemeChange}
                      className="grid grid-cols-3 gap-4"
                    >
                      <div>
                        <RadioGroupItem value="light" id="light" className="sr-only" />
                        <label
                          htmlFor="light"
                          className={`flex flex-col items-center justify-center gap-2 p-4 border rounded-lg cursor-pointer transition ${
                            userSettings.theme === "light"
                              ? "border-primary bg-primary/10"
                              : "border-gray-700 hover:border-gray-600"
                          }`}
                        >
                          <Sun className="h-6 w-6" />
                          <span className="text-sm">Light</span>
                        </label>
                      </div>

                      <div>
                        <RadioGroupItem value="dark" id="dark" className="sr-only" />
                        <label
                          htmlFor="dark"
                          className={`flex flex-col items-center justify-center gap-2 p-4 border rounded-lg cursor-pointer transition ${
                            userSettings.theme === "dark"
                              ? "border-primary bg-primary/10"
                              : "border-gray-700 hover:border-gray-600"
                          }`}
                        >
                          <Moon className="h-6 w-6" />
                          <span className="text-sm">Dark</span>
                        </label>
                      </div>

                      <div>
                        <RadioGroupItem value="system" id="system" className="sr-only" />
                        <label
                          htmlFor="system"
                          className={`flex flex-col items-center justify-center gap-2 p-4 border rounded-lg cursor-pointer transition ${
                            userSettings.theme === "system"
                              ? "border-primary bg-primary/10"
                              : "border-gray-700 hover:border-gray-600"
                          }`}
                        >
                          <Monitor className="h-6 w-6" />
                          <span className="text-sm">System</span>
                        </label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Separator className="bg-gray-800" />

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Sound Effects</label>
                      <p className="text-xs text-gray-400">
                        Enable sound effects for notifications and interactions
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {soundEnabled ? (
                        <Volume2 className="h-4 w-4 text-primary" />
                      ) : (
                        <VolumeX className="h-4 w-4 text-gray-400" />
                      )}
                      <Switch
                        checked={soundEnabled}
                        onCheckedChange={handleSoundToggle}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}            {/* Notification Settings */}
            {selectedTab === "notifications" && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-2">Notification Preferences</h2>
                  <p className="text-gray-400 text-sm sm:text-base">
                    Choose how and when you want to receive notifications.
                  </p>
                </div>

                <Form {...notificationForm}>
                  <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-4 sm:space-y-6 form-mobile">
                    <div className="space-y-3 sm:space-y-4">
                      <h3 className="text-base sm:text-lg font-medium">Communication Channels</h3>
                      
                      <FormField
                        control={notificationForm.control}
                        name="emailNotifications"
                        render={({ field }) => (                          <FormItem className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 p-3 sm:p-4 rounded-lg border border-gray-800">
                            <div className="min-w-0 flex-1">
                              <FormLabel className="text-sm sm:text-base">Email Notifications</FormLabel>
                              <FormDescription className="text-xs sm:text-sm">
                                Receive notifications via email
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="pushNotifications"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Push Notifications</FormLabel>
                              <FormDescription>
                                Receive browser push notifications
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="smsNotifications"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>SMS Notifications</FormLabel>
                              <FormDescription>
                                Receive notifications via SMS (premium feature)
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator className="bg-gray-800" />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Notification Types</h3>
                      
                      <FormField
                        control={notificationForm.control}
                        name="matchReminders"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Match Reminders</FormLabel>
                              <FormDescription>
                                Get notified before your matches start
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="tournamentUpdates"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Tournament Updates</FormLabel>
                              <FormDescription>
                                Updates about tournament results and rankings
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="promotionalEmails"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Promotional Emails</FormLabel>
                              <FormDescription>
                                Special offers, bonuses, and marketing content
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="weeklyDigest"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Weekly Digest</FormLabel>
                              <FormDescription>
                                Weekly summary of your gaming activity
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        className="bg-primary hover:bg-primary/90"
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Preferences"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}

            {/* Privacy & Security Settings */}
            {selectedTab === "privacy" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Privacy & Security</h2>
                  <p className="text-gray-400">
                    Control your privacy settings and account security.
                  </p>
                </div>                {/* Account Security Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium mb-4">Account Security</h3>
                  <Card className="bg-dark-lighter border-gray-700 p-4">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm">Email Verification</p>                        <div className={`px-2 py-1 rounded text-xs ${('emailVerified' in userProfile && userProfile.emailVerified) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {('emailVerified' in userProfile && userProfile.emailVerified) ? 'Verified' : 'Not Verified'}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Keep your account secure by maintaining a strong password and verifying your email.
                      </div>
                    </div>
                  </Card>
                </div>

                <Form {...privacyForm}>
                  <form onSubmit={privacyForm.handleSubmit(onPrivacySubmit)} className="space-y-6">
                    <FormField
                      control={privacyForm.control}
                      name="profileVisibility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Visibility</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="public" id="public" />
                                <label htmlFor="public" className="text-sm">
                                  <strong>Public</strong> - Anyone can view your profile
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="friends" id="friends" />
                                <label htmlFor="friends" className="text-sm">
                                  <strong>Friends Only</strong> - Only your friends can view your profile
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="private" id="private" />
                                <label htmlFor="private" className="text-sm">
                                  <strong>Private</strong> - Only you can view your profile
                                </label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator className="bg-gray-800" />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Data Sharing</h3>
                      
                    {/* Show Game Statistics removed */}

                      <FormField
                        control={privacyForm.control}
                        name="showWinnings"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Show Winnings</FormLabel>
                              <FormDescription>
                                Display your tournament winnings and earnings
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={privacyForm.control}
                        name="allowFriendRequests"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Allow Friend Requests</FormLabel>
                              <FormDescription>
                                Let other players send you friend requests
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={privacyForm.control}
                        name="showOnlineStatus"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Show Online Status</FormLabel>
                              <FormDescription>
                                Let others see when you're online
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={privacyForm.control}
                        name="dataCollection"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Analytics & Data Collection</FormLabel>
                              <FormDescription>
                                Help improve the platform by sharing usage data
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        className="bg-primary hover:bg-primary/90"
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Privacy Settings"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}

            {/* Gaming Settings */}
            {selectedTab === "gaming" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Gaming Preferences</h2>
                  <p className="text-gray-400">
                    Configure your gaming-specific settings and preferences.
                  </p>
                </div>

                <div className="space-y-4">
                  <Card className="bg-dark-lighter border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Current Game Mode</h3>
                        <p className="text-sm text-gray-400">
                          You're currently set to play {userProfile.gameMode || "PUBG"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Gamepad2 className="h-5 w-5 text-primary" />
                        <span className="font-medium text-primary">
                          {userProfile.gameMode || "PUBG"}
                        </span>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-dark-lighter border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Gaming Region</h3>
                        <p className="text-sm text-gray-400">
                          Based on your country selection: {currentCountry.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{currentCountry.flag}</span>
                        <span className="font-medium">{currentCountry.name}</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-dark-lighter border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Match Skill Level</h3>
                        <p className="text-sm text-gray-400">
                          Your skill level affects tournament matchmaking
                        </p>
                      </div>
                      <Select defaultValue="intermediate">
                        <SelectTrigger className="w-32 bg-dark border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="pro">Professional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </Card>

                  <div className="space-y-3">
                    <h3 className="text-lg font-medium">Gaming Preferences</h3>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Auto-join Similar Tournaments</label>
                        <p className="text-xs text-gray-400">
                          Automatically join tournaments matching your preferences
                        </p>
                      </div>
                      <Switch defaultChecked={false} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Squad Invitations</label>
                        <p className="text-xs text-gray-400">
                          Allow other players to invite you to their squads
                        </p>
                      </div>
                      <Switch defaultChecked={true} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Match Spectating</label>
                        <p className="text-xs text-gray-400">
                          Allow others to spectate your matches
                        </p>
                      </div>
                      <Switch defaultChecked={false} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Account Settings */}
            {selectedTab === "account" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Account Management</h2>
                  <p className="text-gray-400">
                    Manage your account data and security settings.
                  </p>
                </div>

                <div className="space-y-4">
                  <Card className="bg-dark-lighter border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Download Account Data</h3>
                        <p className="text-sm text-gray-400">
                          Export your profile data, settings, and activity history
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={handleDataExport}
                        className="border-gray-600"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export Data
                      </Button>
                    </div>
                  </Card>

                  <Card className="bg-dark-lighter border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Account Security</h3>
                        <p className="text-sm text-gray-400">
                          Last login: {new Date().toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="outline" className="border-gray-600">
                        <Lock className="mr-2 h-4 w-4" />
                        Change Password
                      </Button>
                    </div>
                  </Card>

                  <Card className="bg-dark-lighter border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-400">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Button variant="outline" className="border-gray-600">
                        <Shield className="mr-2 h-4 w-4" />
                        Enable 2FA
                      </Button>
                    </div>
                  </Card>

                  <Separator className="bg-gray-800" />

                  <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
                    <h3 className="font-medium text-red-400 mb-2">Danger Zone</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      These actions are permanent and cannot be undone.
                    </p>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-dark-card border-gray-800">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-red-400">
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-400">
                            This action cannot be undone. This will permanently delete your
                            account and remove your data from our servers. All your tournament
                            history, winnings, and settings will be lost.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-gray-600">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleAccountDeletion}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Yes, delete my account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
