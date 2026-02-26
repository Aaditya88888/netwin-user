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
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { emailValidationSchema } from "@/lib/emailValidation";
import { useToast } from "@/hooks/use-toast";

const passwordLoginSchema = z.object({
  email: emailValidationSchema,
  password: z.string().min(1, "Password is required"),
});

type PasswordLoginValues = z.infer<typeof passwordLoginSchema>;

interface LoginFormProps {
  onForgotPassword?: () => void;
}

export default function LoginForm({ onForgotPassword }: LoginFormProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const { signInWithEmail, signInWithGoogle } = useFirebase();
  const { toast } = useToast();

  const form = useForm<PasswordLoginValues>({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: PasswordLoginValues) => {
    try {
      setLoading(true);

      // Sign in with email/password
      await signInWithEmail(data.email, data.password);      toast({
        title: "Success",
        description: "Logged in successfully",
      });

      navigate("/");
    } catch (error) {
      const err = error as { code?: string; message?: string };
      let errorMessage = "Failed to sign in";
      if (err.code === "auth/wrong-password") {
        errorMessage = "Invalid password";
      } else if (err.code === "auth/user-not-found") {
        errorMessage = "No account found with this email";
      }
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: err.message || errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      navigate("/");
    } catch (error) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: err.message || "An error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access your account
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    {...field}
                  />
                </FormControl>
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
          />          <div className="flex items-center justify-between">
            <div></div>
            {onForgotPassword ? (
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-primary hover:text-primary/80 font-medium underline underline-offset-4"
              >
                Forgot password?
              </button>
            ) : (
              <Link
                to="/auth/forgot-password"
                className="text-sm text-primary hover:text-primary/80 font-medium underline underline-offset-4"
              >
                Forgot password?
              </Link>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </div>
            ) : (
              "Sign in"
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

      <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn}>
        <Mail className="mr-2 h-4 w-4" />
        Google
      </Button>

      <p className="px-8 text-center text-sm text-muted-foreground">
        <span className="text-gray-400">Don&apos;t have an account?</span>{" "}
        <Link to="/auth/register" className="underline underline-offset-4 hover:text-primary">
          Sign up
        </Link>
      </p>
    </div>
  );
}
