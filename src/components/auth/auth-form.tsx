
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

// Base schema for login and common fields for signup
const baseSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

// Schema specifically for signup, extending base and adding new fields + password confirmation
const signupSchema = baseSchema.extend({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  confirmPassword: z.string().min(6, { message: "Confirm password must be at least 6 characters." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"], // Show error on confirmPassword field
});

// Type for form values submitted by this form.
// For login, only email/password are relevant. For signup, all are.
export type AuthFormSubmitValues = z.infer<typeof signupSchema>;
// For page-level handling, we can have more specific types if needed:
export type LoginValues = z.infer<typeof baseSchema>;
export type SignupValues = z.infer<typeof signupSchema>;


interface AuthFormProps {
  mode: 'login' | 'signup';
  onSubmit: (values: AuthFormSubmitValues) => Promise<any>;
  submitButtonText: string;
  isLoading?: boolean; 
}

export function AuthForm({ mode, onSubmit, submitButtonText, isLoading = false }: AuthFormProps) {
  const [error, setError] = useState<string | null>(null);

  // Determine the schema to use based on the mode
  const currentSchema = mode === 'signup' ? signupSchema : baseSchema;

  const form = useForm<AuthFormSubmitValues>({ // Use the most comprehensive type for form state
    resolver: zodResolver(currentSchema) as any, // Type assertion needed due to conditional schema
    defaultValues: {
      email: "",
      password: "",
      firstName: "", // Initialize all fields
      lastName: "",
      confirmPassword: "",
    },
  });

  async function handleSubmit(values: AuthFormSubmitValues) {
    setError(null);
    try {
      await onSubmit(values);
    } catch (err: unknown) {
      handleAuthError(err);
    }
  }

  function handleAuthError(err: unknown) {
    // Use the centralized error message utility for consistency
    const { getUserFriendlyErrorMessage } = require('@/types/errors');
    const errorMessage = getUserFriendlyErrorMessage(err);
    setError(errorMessage);
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {mode === 'signup' && (
            <>
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="your@email.com" {...field} type="email" disabled={isLoading} />
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
                  <Input placeholder="••••••••" {...field} type="password" disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {mode === 'signup' && (
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input placeholder="••••••••" {...field} type="password" disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
            {isLoading ? "Processing..." : submitButtonText}
          </Button>
        </form>
      </Form>
    </div>
  );
}
