import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/authorization";
import { apiError } from "@/lib/http/response";
import { assertSameOrigin } from "@/lib/security/request";

const schema = z.object({ status: z.enum(["NEW", "IN_PROGRESS", "CLOSED"]) });

export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/contact-requests/[id]">) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(["ADMIN"]);
    const { id } = await params;
    const { status } = schema.parse(await request.json());
    const contactRequest = await db.contactRequest.update({ where: { id }, data: { status } });
    await db.auditLog.create({ data: { userId: user.id, action: "STATUS_UPDATED", entityType: "ContactRequest", entityId: id, metadata: { status } } });
    return NextResponse.json({ contactRequest });
  } catch (error) {
    return apiError(error);
  }
}
