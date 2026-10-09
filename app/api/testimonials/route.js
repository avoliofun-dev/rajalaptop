// app/api/testimonials/route.js
import { NextResponse } from "next/server";
import { getTestimonials } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const testimonials = await getTestimonials();
    return NextResponse.json(testimonials || []);
  } catch (error) {
    console.error("GET /api/testimonials error:", error);
    return NextResponse.json({ error: "Gagal memuat testimoni" }, { status: 500 });
  }
}
