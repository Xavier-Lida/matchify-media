import { z } from "zod";

import { isSafeImageUrl } from "@/lib/api/safe-image-url";

const hexColor = z
  .string()
  .regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, "Invalid hex color");

const nullableImageUrl = z
  .string()
  .nullable()
  .refine(isSafeImageUrl, "Image URL must be data:image/*, a relative path, or HTTPS public URL");

const brandingSchema = z.object({
  leagueName: z.string().min(1).max(120),
  primaryColor: hexColor,
  secondaryColor: hexColor,
  logoDataUrl: nullableImageUrl,
});

const teamSchema = z.object({
  logo: nullableImageUrl,
});

const scorerSchema = z.object({
  name: z.string().min(1).max(80),
  goals: z.number().int().min(1).max(20).default(1),
});

const fullTimeDataSchema = z.object({
  heroPhoto: nullableImageUrl,
  date: z.string().min(1).max(40),
  fieldName: z.string().min(1).max(120),
  matchday: z.string().min(1).max(40),
  season: z.string().min(1).max(40),
  teamA: teamSchema,
  teamB: teamSchema,
  scoreA: z.number().int().min(0).max(99),
  scoreB: z.number().int().min(0).max(99),
  scorersA: z.array(scorerSchema).max(20),
  scorersB: z.array(scorerSchema).max(20),
});

export const fullTimeRenderRequestSchema = z.object({
  branding: brandingSchema,
  data: fullTimeDataSchema,
});

export type FullTimeRenderRequest = z.infer<typeof fullTimeRenderRequestSchema>;
