import { z } from "zod";

export const serviceAdminSchema = z.object({
  categoryId: z.string().cuid(),
  name: z.string().trim().min(2).max(140),
  description: z.string().trim().max(3000).nullable().optional(),
  durationMinutes: z.number().int().min(15).max(480),
  bufferAfterMinutes: z.number().int().min(0).max(120).default(0),
  priceCents: z.number().int().min(0).max(1_000_000),
  depositMode: z.enum(["NONE", "FIXED", "PERCENTAGE", "FULL"]).default("NONE"),
  depositValue: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
  onlineBookable: z.boolean().default(true),
});
