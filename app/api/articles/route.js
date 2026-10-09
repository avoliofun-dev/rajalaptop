// app/api/articles/route.js
import { NextResponse } from "next/server";
import { getArticles } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const articles = await getArticles();
    return NextResponse.json(articles || []);
  } catch (error) {
    console.error("GET /api/articles error:", error);
    return NextResponse.json({ error: "Gagal memuat artikel" }, { status: 500 });
  }
}
