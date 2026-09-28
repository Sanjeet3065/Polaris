import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Must be a valid email address")
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password exceeds maximum allowed length")
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: "Current password is required" })
    .min(8, "Current password must be at least 8 characters")
    .max(128, "Password too long"),
  newPassword: z
    .string({ required_error: "New password is required" })
    .min(8, "New password must be at least 8 characters")
    .max(128, "Password too long")
});

export const refreshSchema = z.object({
  refreshToken: z.string().optional()
});
