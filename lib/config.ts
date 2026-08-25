import { z } from "zod";

const optionalBoolean = z.string().optional().transform((value) => value === "true");

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  APP_URL: z.string().url().default("http://localhost:3000"),
  AUTH_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32),
  STRIPE_ENABLED: optionalBoolean,
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
  BOOKING_MIN_NOTICE_MINUTES: z.coerce.number().int().nonnegative().default(120),
  BOOKING_MAX_ADVANCE_DAYS: z.coerce.number().int().positive().default(90),
  BOOKING_HOLD_MINUTES: z.coerce.number().int().min(31).default(31),
  BOOKING_SLOT_MINUTES: z.coerce.number().int().positive().default(15),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(5_242_880),
});

export type ServerConfig = z.infer<typeof serverEnvSchema>;

let parsedConfig: ServerConfig | undefined;

export function getServerConfig(): ServerConfig {
  if (parsedConfig) return parsedConfig;
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Configuration serveur invalide: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
  }
  parsedConfig = result.data;
  return parsedConfig;
}
