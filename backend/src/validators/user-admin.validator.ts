import { z } from "zod";
import { UserRole } from "@prisma/client";

export const createUserSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Must be a valid email address")
    .transform((val) => val.toLowerCase().trim()),
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name exceeds maximum length"),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password exceeds maximum length"),
  role: z.nativeEnum(UserRole).default(UserRole.VIEWER),
  isActive: z.boolean().default(true)
});

export const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  email: z.string().email("Must be a valid email address").optional()
});

export const changeRoleSchema = z.object({
  role: z.nativeEnum(UserRole, { required_error: "Role is required" })
});

export const changeStatusSchema = z.object({
  isActive: z.boolean({ required_error: "isActive status boolean is required" })
});

export const resetPasswordSchema = z.object({
  newPassword: z
    .string({ required_error: "New password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password exceeds maximum length")
});

export const userQuerySchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  isActive: z
    .preprocess((val) => {
      if (val === "true" || val === true) return true;
      if (val === "false" || val === false) return false;
      return undefined;
    }, z.boolean().optional())
    .optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const authEventQuerySchema = z.object({
  userId: z.string().uuid("Invalid user ID").optional(),
  eventType: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid("Invalid user ID format (must be UUID)")
});
