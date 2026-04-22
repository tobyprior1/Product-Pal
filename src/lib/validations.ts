import { z } from "zod";

/**
 * Interview data validation schema
 * Enforces security limits on user inputs to prevent injection attacks and DoS
 */
export const interviewSchema = z.object({
  participantName: z
    .string()
    .trim()
    .max(100, { message: "Participant name must be less than 100 characters" })
    .optional()
    .or(z.literal("")),
  conductedAt: z
    .string()
    .optional()
    .or(z.literal("")),
  videoUrl: z
    .string()
    .trim()
    .max(500, { message: "Video URL must be less than 500 characters" })
    .refine(
      (url) => {
        if (!url) return true; // Optional field
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      },
      { message: "Please enter a valid URL (e.g., https://example.com)" }
    )
    .optional()
    .or(z.literal("")),
  transcript: z
    .string()
    .trim()
    .min(1, { message: "Transcript cannot be empty" })
    .max(50000, { message: "Transcript must be less than 50,000 characters (approximately 50KB)" }),
});

export type InterviewFormData = z.infer<typeof interviewSchema>;

/**
 * Authentication validation schemas
 * Enforces secure password requirements and input limits
 */
export const signUpSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(128, { message: "Password must be less than 128 characters" }),
  username: z
    .string()
    .trim()
    .min(2, { message: "Username must be at least 2 characters" })
    .max(50, { message: "Username must be less than 50 characters" })
    .regex(/^[a-zA-Z0-9_-]+$/, { 
      message: "Username can only contain letters, numbers, hyphens, and underscores" 
    }),
});

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .max(128, { message: "Password must be less than 128 characters" }),
});

export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
