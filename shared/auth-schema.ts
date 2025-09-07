
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  passwordHash: z.string(),
  wishlist: z.array(z.number()).default([]), // Array of product IDs
  createdAt: z.string(),
});

export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type User = z.infer<typeof userSchema>;
export type InsertUser = Omit<User, "id" | "createdAt">;
