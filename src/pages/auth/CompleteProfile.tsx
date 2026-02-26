import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useFirebase } from "@/contexts/FirebaseContext";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Gamepad2, Globe, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Form schema for profile completion
const profileCompletionSchema = z.object({
  displayName: z.string().min(1, {
    message: "Display name is required.",
  }),
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  phoneNumber: z.string().optional(),
  gameId: z.string().optional(),
  gameMode: z.enum(["PUBG", "BGMI", "FreeFire"]),
  country: z.string().min(1, "Please select a country"),
  currency: z.enum(["INR", "NGN", "USD"]),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions."
  }),
});

type ProfileCompletionValues = z.infer<typeof profileCompletionSchema>;

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userProfile, checkUsernameExists } = useAuth();
  const { completeGoogleProfile } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [incompleteUserData, setIncompleteUserData] = useState<{
    uid: string;
    email: string;
    displayName: string;
    photoURL: string;
  } | null>(null);

  // Get incomplete user data from session storage
  useEffect(() => {
    const incompleteUserStr = sessionStorage.getItem('incompleteGoogleUser');
    if (incompleteUserStr) {
      const userData = JSON.parse(incompleteUserStr);
      setIncompleteUserData(userData);
    } else {
      // If no incomplete user data, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  const form = useForm<ProfileCompletionValues>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: {
      displayName: "",
      username: "",
      phoneNumber: "",
      gameId: "",
      gameMode: "PUBG",
      country: "India",
      currency: "INR",
      termsAccepted: false,
    },
  });

  // Set default values when incomplete user data is loaded
  useEffect(() => {
    if (incompleteUserData) {
      form.setValue("displayName", incompleteUserData.displayName || "");
    }
  }, [incompleteUserData, form]);

  // Redirect if user profile is already complete
  useEffect(() => {
    // Only redirect if profile is complete and we are on the complete-profile page
    if (userProfile && userProfile.username && userProfile.country) {
      if (window.location.pathname === '/auth/complete-profile') {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [userProfile, navigate]);

  // Debounced username checking
  useEffect(() => {
    const username = form.watch('username');
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      checkUsernameAvailability(username);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [form.watch('username')]);

  // Set currency based on country
  const handleCountryChange = (value: string) => {
    let currency = "USD";
    if (value === "India") currency = "INR";
    if (value === "Nigeria") currency = "NGN";

    form.setValue("currency", currency as "INR" | "NGN" | "USD");
  };

  // Check username availability
  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    if (!checkUsernameExists) {
      console.error('checkUsernameExists function is not available');
      setUsernameAvailable(null);
      return;
    }

    setUsernameChecking(true);
    try {
      const exists = await checkUsernameExists(username);
      if (exists) {
        setUsernameAvailable(false);
      } else {
        setUsernameAvailable(true);
      }
    } catch (error) {
      setUsernameAvailable(null);
    } finally {
      setUsernameChecking(false);
    }
  };

  // Handle form submission
  const onSubmit = async (values: ProfileCompletionValues) => {
    setLoading(true);
    
    try {
      // Check username one more time before submission
      if (!usernameAvailable) {
        toast({
          variant: "destructive",
          title: "Username not available",
          description: "Please choose a different username.",
        });
        return;
      }

      // Use the complete Google profile function
      await completeGoogleProfile({
        displayName: values.displayName,
        username: values.username,
        phoneNumber: values.phoneNumber,
        gameId: values.gameId,
        gameMode: values.gameMode,
        country: values.country,
        currency: values.currency, // Currency is set by handleCountryChange
      });
      
      toast({
        title: "Profile completed successfully!",
        description: "Welcome to Netwin! Your profile has been set up.",
      });
      
      navigate("/dashboard");
    } catch (error) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Profile completion failed",
        description: err.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container min-h-screen py-10 flex items-center justify-center bg-dark">
      <Card className="w-full max-w-lg bg-dark-card border-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
            Complete Your Profile
          </CardTitle>
          <p className="text-gray-400">
            Please provide additional details to complete your account setup
          </p>
        </CardHeader>
        
        <CardContent>
          {/* Display email from Google */}
          {incompleteUserData && (
            <div className="mb-6 p-4 bg-dark-lighter border border-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Signing in as</p>
                  <p className="font-medium">{incompleteUserData.email}</p>
                </div>
              </div>
            </div>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Display Name */}
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Your display name"
                          className="pl-10 bg-dark-lighter border-gray-700"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Username */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Choose a unique username"
                          className="pl-10 bg-dark-lighter border-gray-700"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                    {usernameChecking && (
                      <p className="mt-2 text-sm text-gray-400">
                        Checking username availability...
                      </p>
                    )}
                    {usernameAvailable === true && (
                      <p className="mt-2 text-sm text-green-400">
                        ✓ Username is available
                      </p>
                    )}
                    {usernameAvailable === false && (
                      <p className="mt-2 text-sm text-red-400">
                        ✗ Username is already taken
                      </p>
                    )}
                  </FormItem>
                )}
              />

              {/* Phone Number */}
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Your phone number"
                          className="pl-10 bg-dark-lighter border-gray-700"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Game ID */}
              <FormField
                control={form.control}
                name="gameId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game ID (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Gamepad2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Your PUBG/BGMI ID"
                          className="pl-10 bg-dark-lighter border-gray-700"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Game Mode */}
              <FormField
                control={form.control}
                name="gameMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game Mode</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-dark-lighter border-gray-700">
                          <SelectValue placeholder="Select game mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PUBG">PUBG Mobile</SelectItem>
                        <SelectItem value="BGMI">BGMI</SelectItem>
                        <SelectItem value="FreeFire">Free Fire</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Country */}
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleCountryChange(value);
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-dark-lighter border-gray-700">
                          <Globe className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="India">🇮🇳 India</SelectItem>
                        <SelectItem value="Nigeria">🇳🇬 Nigeria</SelectItem>
                        <SelectItem value="United States">🇺🇸 United States</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Terms and Conditions */}
              <FormField
                control={form.control}
                name="termsAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm">
                        I agree to the{" "}
                        <Link to="/terms" className="text-primary hover:underline">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link to="/privacy" className="text-primary hover:underline">
                          Privacy Policy
                        </Link>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-secondary"
                disabled={loading || !usernameAvailable || !form.getValues('termsAccepted')}
              >
                {loading ? "Completing Profile..." : "Complete Profile"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
