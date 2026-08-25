import { z } from "zod";

const normalizedPhone = z.string().trim().min(8).max(32).regex(/^\+?[0-9 ()-]+$/, "Numéro de téléphone invalide").transform((value) => {
  const compact = value.replace(/[ ()-]/g, "");
  return compact.startsWith("00") ? `+${compact.slice(2)}` : compact;
});

export const createBookingSchema = z.object({
  serviceId: z.string().cuid(),
  staffId: z.string().cuid().nullable(),
  startsAt: z.iso.datetime({ offset: true }),
  customer: z.object({
    firstName: z.string().trim().min(2).max(100),
    lastName: z.string().trim().min(2).max(100),
    email: z.email().max(191).transform((value) => value.toLowerCase()),
    phone: normalizedPhone,
    marketingConsent: z.boolean().default(false),
  }),
  notes: z.string().trim().max(1000).optional(),
  idempotencyKey: z.string().uuid(),
});

export const availabilityQuerySchema = z.object({
  serviceId: z.string().cuid(),
  staffId: z.string().cuid().optional(),
  date: z.iso.date(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
