import React from "react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFirebase } from "@/contexts/FirebaseContext";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, CheckCircle, AlertCircle, Loader2, Mail } from 'lucide-react';
import { EmailValidationService, emailValidationSchema } from "@/lib/emailValidation";
import { useToast } from "@/hooks/use-toast";
import { COUNTRIES } from "@/utils/constants";

const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username cannot exceed 20 characters"),
  email: emailValidationSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
  gameId: z.string().min(6, "Game ID is required"),
  gameMode: z.enum(["PUBG", "BGMI"], { required_error: "Please select a game mode" }),
  country: z.enum(["India", "Nigeria", "USA"], { required_error: "Please select your country" })
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupForm() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailValidationState, setEmailValidationState] = useState<{
    isValidating: boolean;
    isValid: boolean;
    message: string;
    suggestions: string[];
  }>({
    isValidating: false,
    isValid: false,
    message: '',
    suggestions: []
  });

  const navigate = useNavigate();
  const { signUpWithEmail, signInWithGoogle } = useFirebase();
  const { toast } = useToast();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      gameId: "",
      gameMode: "BGMI",
      country: "India"
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    try {
      setLoading(true);

      // Create user profile data
      const userProfileData = {
        username: data.username,
        gameId: data.gameId,
        gameMode: data.gameMode,
        country: data.country
      };

      // Save profile data to local storage for completion after email verification
      localStorage.setItem('pendingUserData', JSON.stringify(userProfileData));
      localStorage.setItem('emailForSignIn', data.email);

      // Create user account
      await signUpWithEmail(data.email, data.password);

      // Show success message
      toast({
        title: "Success",
        description: "Account created successfully. Please verify your email to continue.",
        variant: "default",
      });

      // Navigate to email verification page
      navigate('/auth/verify?action=register');
    } catch (error: unknown) {
      console.error('Profile creation error:', error);
      toast({
        title: "Error",
        description: (error as Error).message || 'Failed to create profile',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = async (email: string) => {
    try {
      setEmailValidationState(prev => ({ ...prev, isValidating: true }));
      const result = await EmailValidationService.validateEmail(email);
      setEmailValidationState({
        isValidating: false,
        isValid: result.isValid,
        message: result.isValid ? 'Valid email address' : 'Invalid email address',
        suggestions: result.suggestions || []
      });
    } catch (error) {
      setEmailValidationState({
        isValidating: false,
        isValid: false,
        message: 'Email validation failed',
        suggestions: []
      });
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: (error as Error).message || 'Failed to sign up with Google',
        variant: "destructive",
      });
    }
  };

  const handleEmailBlur = (email: string) => {
    if (email && !emailValidationState.isValidating) {
      validateEmail(email);
    }
  };

  return (
    <div className="max-w-md w-full space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Enter your details below to create your account
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email"                    {...field}
                    onBlur={() => {
                      field.onBlur();
                      handleEmailBlur(field.value);
                    }}
                  />
                </FormControl>
                {emailValidationState.message && (
                  <div className="flex items-center gap-2 mt-1 text-sm">
                    {emailValidationState.isValid ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className={emailValidationState.isValid ? "text-green-600" : "text-yellow-600"}>
                      {emailValidationState.message}
                    </span>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gameId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Game ID</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your game ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gameMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Game Mode</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select game mode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="BGMI">BGMI</SelectItem>
                    <SelectItem value="PUBG">PUBG</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COUNTRIES.filter(c => ["India", "Nigeria", "USA"].includes(c.country)).map((country) => (
                      <SelectItem key={country.country} value={country.country}>
                        <span className="mr-2">{country.flag}</span>{country.country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Account...
              </div>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </Form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignUp}>
        <Mail className="mr-2 h-4 w-4" />
        Google
      </Button>

      <p className="px-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/auth/login" className="underline underline-offset-4 hover:text-primary">
          Sign in
        </Link>
      </p>
    </div>
  );
}
