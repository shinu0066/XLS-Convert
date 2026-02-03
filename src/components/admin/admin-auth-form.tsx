
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
import LoadingSpinner from "@/components/core/loading-spinner";

const baseSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const signupFormSchema = baseSchema.extend({
  confirmPassword: z.string().min(6, { message: "Confirm Password must be at least 6 characters." })
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"], // Show error on confirmPassword field
});

const loginFormSchema = baseSchema;

// Unified type for form values, confirmPassword is optional
export type AuthFormValues = z.infer<typeof baseSchema> & {
  confirmPassword?: string;
};

interface AdminAuthFormProps {
  mode: 'login' | 'signup';
  onSubmit: (values: AuthFormValues) => Promise<any>;
  submitButtonText: string;
  isLoading?: boolean; 
}

export function AdminAuthForm({ mode, onSubmit, submitButtonText, isLoading = false }: AdminAuthFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentSchema = mode === 'signup' ? signupFormSchema : loginFormSchema;

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      email: "",
      password: "",
      ...(mode === 'signup' && { confirmPassword: "" }),
    },
  });

  async function handleSubmit(values: AuthFormValues) {
    setFormError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      // Success is handled by parent page (e.g., redirect)
    } catch (err: unknown) {
      handleAuthError(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAuthError(err: unknown) {
    // Use the centralized error message utility for consistency
    const { getUserFriendlyErrorMessage } = require('@/types/errors');
    const errorMessage = getUserFriendlyErrorMessage(err);
    setFormError(errorMessage);
  }

  const actualIsLoading = isLoading || isSubmitting;

  return (
    <div className="space-y-6">
      {formError && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="admin@example.com" {...field} type="email" disabled={actualIsLoading} />
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
                  <Input placeholder="••••••••" {...field} type="password" disabled={actualIsLoading} />
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
                    <Input placeholder="••••••••" {...field} type="password" disabled={actualIsLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={actualIsLoading}>
            {actualIsLoading ? <LoadingSpinner message="Processing..." /> : submitButtonText}
          </Button>
        </form>
      </Form>
    </div>
  );
}
