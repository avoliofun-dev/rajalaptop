// app/api/brands/route.js
import { NextResponse } from "next/server";
import { getBrands } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const brands = await getBrands();
    return NextResponse.json(brands || []);
  } catch (error) {
    console.error("GET /api/brands error:", error);
    return NextResponse.json({ error: "Gagal memuat brands" }, { status: 500 });
  }
}
