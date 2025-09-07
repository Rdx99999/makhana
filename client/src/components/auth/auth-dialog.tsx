
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { registerSchema, loginSchema, type RegisterData, type LoginData } from "@shared/auth-schema";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (user: any, sessionId: string) => void;
}

export function AuthDialog({ open, onOpenChange, onSuccess }: AuthDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  });

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const handleRegister = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      const result = await response.json();
      toast({
        title: "Registration Successful",
        description: "Welcome! You can now place orders.",
      });
      
      onSuccess(result.user, result.sessionId);
      onOpenChange(false);
      registerForm.reset();
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (data: LoginData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      const result = await response.json();
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      
      onSuccess(result.user, result.sessionId);
      onOpenChange(false);
      loginForm.reset();
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[95vw] p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg sm:text-xl">Authentication Required</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-8 sm:h-10">
            <TabsTrigger value="login" className="text-xs sm:text-sm">Login</TabsTrigger>
            <TabsTrigger value="register" className="text-xs sm:text-sm">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-3">
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-3 sm:space-y-4">
              <div className="space-y-1">
                <Label htmlFor="login-email" className="text-xs sm:text-sm">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  {...loginForm.register("email")}
                  placeholder="Enter your email"
                  className="h-8 sm:h-10 text-sm"
                />
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-red-500 mt-0.5">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="login-password" className="text-xs sm:text-sm">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  {...loginForm.register("password")}
                  placeholder="Enter your password"
                  className="h-8 sm:h-10 text-sm"
                />
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-red-500 mt-0.5">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              
              <Button type="submit" className="w-full h-8 sm:h-10 text-sm" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="register" className="mt-3">
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-3 sm:space-y-4">
              <div className="space-y-1">
                <Label htmlFor="register-name" className="text-xs sm:text-sm">Full Name</Label>
                <Input
                  id="register-name"
                  {...registerForm.register("name")}
                  placeholder="Enter your full name"
                  className="h-8 sm:h-10 text-sm"
                />
                {registerForm.formState.errors.name && (
                  <p className="text-xs text-red-500 mt-0.5">
                    {registerForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="register-email" className="text-xs sm:text-sm">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  {...registerForm.register("email")}
                  placeholder="Enter your email"
                  className="h-8 sm:h-10 text-sm"
                />
                {registerForm.formState.errors.email && (
                  <p className="text-xs text-red-500 mt-0.5">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="register-password" className="text-xs sm:text-sm">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  {...registerForm.register("password")}
                  placeholder="Enter your password"
                  className="h-8 sm:h-10 text-sm"
                />
                {registerForm.formState.errors.password && (
                  <p className="text-xs text-red-500 mt-0.5">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="register-confirm" className="text-xs sm:text-sm">Confirm Password</Label>
                <Input
                  id="register-confirm"
                  type="password"
                  {...registerForm.register("confirmPassword")}
                  placeholder="Confirm your password"
                  className="h-8 sm:h-10 text-sm"
                />
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-0.5">
                    {registerForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
              
              <Button type="submit" className="w-full h-8 sm:h-10 text-sm" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
