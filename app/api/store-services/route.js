// app/api/store-services/route.js
import { NextResponse } from "next/server";
import { getStoreServices } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const services = await getStoreServices();
    return NextResponse.json(services || []);
  } catch (error) {
    console.error("GET /api/store-services error:", error);
    return NextResponse.json({ error: "Gagal memuat layanan toko" }, { status: 500 });
  }
}
