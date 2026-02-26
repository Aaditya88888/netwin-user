import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useGoogleSignInRedirect } from "@/hooks/useGoogleSignInRedirect";
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
import { Eye, EyeOff, AtSign, Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useFirebase } from "@/contexts/FirebaseContext";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";

const loginWithEmailSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

type LoginWithEmailValues = z.infer<typeof loginWithEmailSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { signInWithEmail, signInWithGoogle, loading: authLoading } = useAuth();
  const { user, isEmailVerified, sendEmailVerification } = useFirebase();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Use the Google sign-in redirect logic
  useGoogleSignInRedirect();

  const emailForm = useForm<LoginWithEmailValues>({
    resolver: zodResolver(loginWithEmailSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleEmailSubmit = async (values: LoginWithEmailValues) => {
    try {
      setLoginError(null); // Clear any previous errors
      await signInWithEmail(values.email, values.password);
      toast({
        title: "Success",
        description: "You have been signed in successfully.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sign in";
      setLoginError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast({
        title: "Success",
        description: "You have been signed in with Google successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sign in with Google",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="container min-h-screen py-10 flex items-center justify-center bg-dark">
      <div className="flex flex-col w-full max-w-lg space-y-8 p-6 sm:p-8 bg-dark-card rounded-xl border border-gray-800">
        {/* Email verification banner */}
        {user && !isEmailVerified && (
          <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-lg p-4 flex flex-col items-center mb-2">
            <p className="text-yellow-300 font-medium mb-2">Your email is not verified.</p>
            <Button
              size="sm"
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
              disabled={sendingVerification}
              onClick={async () => {
                setSendingVerification(true);
                try {
                  await sendEmailVerification();
                  toast({
                    title: "Verification Email Sent",
                    description: "Check your inbox for a verification link.",
                  });
                } catch (err) {
                  toast({
                    title: "Error",
                    description: "Failed to send verification email.",
                    variant: "destructive",
                  });
                } finally {
                  setSendingVerification(false);
                }
              }}
            >
              {sendingVerification ? "Sending..." : "Resend Verification Email"}
            </Button>
          </div>
        )}

        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/netwin-logo.png" alt="NetWin" className="h-16 w-16" />
          </div>
          <h1 className="text-3xl font-bold font-poppins bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Sign in to your account
          </p>
        </div>

        <Form {...emailForm}>
          <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
            <FormField
              control={emailForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Enter your email"
                        className="pl-10 bg-dark-lighter border-gray-700"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setLoginError(null); // Clear error when user types
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={emailForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="pr-10 bg-dark-lighter border-gray-700"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setLoginError(null); // Clear error when user types
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Forgot password link */}
            <div className="flex justify-end mb-2">
              <button
                type="button"
                className="text-sm text-primary hover:text-primary/80 font-medium underline underline-offset-4"
                onClick={() => setShowForgotPasswordModal(true)}
              >
                Forgot password?
              </button>
            </div>

            {/* Login error display */}
            {loginError && (
              <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-3 mb-4">
                <p className="text-red-300 text-sm font-medium">{loginError}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={authLoading}
            >
              {authLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </Form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-dark-card px-2 text-gray-400">Or</span>          </div>
        </div>

        {/* Google Sign In */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-dark-card px-2 text-gray-400">Or continue with</span>
          </div>
        </div>
        
        <Button
          type="button"
          variant="outline"
          className="w-full bg-dark-lighter border-gray-700 hover:bg-dark-lighter/80"
          onClick={handleGoogleSignIn}
          disabled={authLoading}
        >
          <FcGoogle className="mr-2 h-5 w-5" />
          Google
        </Button>

        <div className="text-center text-sm">
          <span className="text-gray-400">Don&apos;t have an account?</span>{" "}
          <Button
            variant="link"
            className="text-primary hover:text-primary/90 p-0"
            onClick={() => navigate("/signup")}
          >
            Sign up
          </Button>        </div>
      </div>
      
      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        open={showForgotPasswordModal} 
        onOpenChange={setShowForgotPasswordModal} 
      />
    </div>
    </>
  );
}
