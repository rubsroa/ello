import { NextResponse } from "next/server";
import { availabilityQuerySchema } from "@/lib/booking/validation";
import { getAvailableSlots } from "@/lib/booking/availability-service";
import { apiError } from "@/lib/http/response";
import { clientAddress, enforceRateLimit, hashIdentifier } from "@/lib/security/request";

export async function GET(request: Request) {
  try {
    enforceRateLimit(`availability:${hashIdentifier(clientAddress(request))}`, 60, 60_000);
    const url = new URL(request.url);
    const input = availabilityQuerySchema.parse({ serviceId: url.searchParams.get("serviceId"), staffId: url.searchParams.get("staffId") || undefined, date: url.searchParams.get("date") });
    const slots = await getAvailableSlots(input);
    return NextResponse.json({ slots });
  } catch (error) { return apiError(error); }
}
