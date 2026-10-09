// app/api/services/route.js
import { NextResponse } from "next/server";
import { getServices, updateService } from "@/lib/db";
import { guardApi } from "@/lib/apiGuard";
import { recordAuditLog } from "@/lib/audit";

export async function GET(request) {
  const auth = await guardApi(request, 'service.view', { module: 'SERVICE' });
  if (!auth.allowed) return auth.response;

  try {
    const services = await getServices();
    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}

export async function PUT(request) {
  const auth = await guardApi(request, 'service.manage', { module: 'SERVICE' });
  if (!auth.allowed) return auth.response;

  try {
    const body = await request.json();
    const { id, ...updates } = body;
    const updated = await updateService(id, updates);

    await recordAuditLog({
      request,
      user: auth.user,
      action: 'UPDATE_SERVICE_TICKET',
      module: 'SERVICE',
      resourceType: 'SERVICE_TICKET',
      resourceId: id,
      newValue: updates,
      status: 'SUCCESS',
      details: `Pembaruan tiket servis #${id}`,
    });

    return NextResponse.json({ success: true, service: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
  }
}
