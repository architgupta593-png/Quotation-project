import { z } from "zod";

// ─── Password rules (shared between signup schema and standalone checks) ──────
const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long." })
  .regex(/[a-zA-Z]/, { message: "Password must contain at least one letter." })
  .regex(/[0-9]/, { message: "Password must contain at least one number." })
  .regex(/[^a-zA-Z0-9]/, {
    message: "Password must contain at least one special character.",
  });

// ─── Login ────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.email({ message: "Please enter a valid email address." }).trim(),
  password: z.string().min(1, { message: "Password is required." }),
});

// ─── Public Sign Up (always creates a "member") ──────────────────────────────
export const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Name must be at least 2 characters long." })
      .trim(),
    email: z.email({ message: "Please enter a valid email address." }).trim(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

// ─── Create User (superuser-only, full role selection) ────────────────────────
export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long." })
    .trim(),
  email: z.email({ message: "Please enter a valid email address." }).trim(),
  password: passwordSchema,
  role: z.enum(["superuser", "admin", "member"], {
    message: "Please select a valid role.",
  }),
});

// ─── Update User (superuser-only) ─────────────────────────────────────────────
export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long." })
    .trim()
    .optional(),
  email: z
    .email({ message: "Please enter a valid email address." })
    .trim()
    .optional(),
  role: z
    .enum(["superuser", "admin", "member"], {
      message: "Please select a valid role.",
    })
    .optional(),
  isActive: z.boolean().optional(),
});

// ─── Profile Update ───────────────────────────────────────────────────────────
export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long." })
    .trim()
    .optional(),
  email: z
    .email({ message: "Please enter a valid email address." })
    .trim()
    .optional(),
});


