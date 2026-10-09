// app/api/branches/route.js
import { NextResponse } from "next/server";
import { getBranches } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const branches = await getBranches();
    return NextResponse.json(branches || []);
  } catch (error) {
    console.error("GET /api/branches error:", error);
    return NextResponse.json({ error: "Gagal memuat data cabang" }, { status: 500 });
  }
}
