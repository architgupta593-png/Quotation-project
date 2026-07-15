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

// ─── Sign Up ──────────────────────────────────────────────────────────────────
export const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Name must be at least 2 characters long." })
      .trim(),
    email: z.email({ message: "Please enter a valid email address." }).trim(),
    password: passwordSchema,
    confirmPassword: z.string(),
    role: z.enum(["admin", "teammate"], {
      message: "Please select a valid role.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
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

