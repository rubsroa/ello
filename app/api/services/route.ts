import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { apiError } from "@/lib/http/response";
import { getBookingPolicy } from "@/lib/booking/policy";

export async function GET() {
  try {
    const [categories, policy] = await Promise.all([db.serviceCategory.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        services: {
          where: { active: true, onlineBookable: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          include: { staff: { include: { staff: { select: { id: true, firstName: true, lastName: true, title: true, portraitUrl: true } } } } },
        },
      },
    }), getBookingPolicy()]);
    return NextResponse.json({ categories, bookingPolicy: { maximumAdvanceDays: policy.maximumAdvanceDays } }, { headers: { "Cache-Control": "private, max-age=0, must-revalidate" } });
  } catch (error) { return apiError(error); }
}
