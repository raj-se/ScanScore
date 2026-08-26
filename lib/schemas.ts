import { z } from "zod";

export const jobDescriptionSchema = z.object({
  jobDescription: z
    .string()
    .min(50, "Job description looks too short — paste the full listing.")
    .max(20000, "Job description is too long."),
});

export const unlockSchema = z.object({
  analysisId: z.string().min(1),
  lockedPayload: z.string().min(1),
});

export const jobsQuerySchema = z.object({
  role: z.string().min(1),
  location: z.string().optional(),
});
