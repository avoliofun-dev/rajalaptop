// app/api/brands/route.js
import { NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { guardApi } from "@/lib/apiGuard";
import { recordAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

const DEFAULT_BRANDS = [
  { id: 1, name: "ASUS", icon: "💻", desc: "Official Partner" },
  { id: 2, name: "Lenovo", icon: "⚡", desc: "Authorized Dealer" },
  { id: 3, name: "Apple", icon: "🍏", desc: "Official Reseller" },
  { id: 4, name: "MSI", icon: "🐲", desc: "Gaming Partner" },
  { id: 5, name: "HP", icon: "💼", desc: "Authorized Partner" },
  { id: 6, name: "Acer", icon: "🔥", desc: "Official Partner" },
  { id: 7, name: "Dell", icon: "🏢", desc: "Enterprise Dealer" },
  { id: 8, name: "Axioo", icon: "🇮🇩", desc: "Lokal Partner" }
];

export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from("brands")
        .select("*")
        .order("id", { ascending: true });

      if (!error && data && data.length > 0) {
        return NextResponse.json(data);
      }
    }
    return NextResponse.json(DEFAULT_BRANDS);
  } catch (error) {
    console.error("GET /api/brands error:", error);
    return NextResponse.json(DEFAULT_BRANDS);
  }
}

export async function POST(request) {
  const auth = await guardApi(request, "settings.manage", { module: "SETTINGS" });
  if (!auth.allowed) return auth.response;

  try {
    const body = await request.json();
    const { name, icon = "💻", desc = "Official Partner" } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nama brand wajib diisi" }, { status: 400 });
    }

    const newBrand = {
      name: name.trim(),
      icon: icon.trim() || "💻",
      desc: desc ? desc.trim() : "Official Partner",
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from("brands").insert([newBrand]).select().single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ success: true, brand: data });
    }

    return NextResponse.json({ success: true, brand: { id: Date.now(), ...newBrand } });
  } catch (error) {
    console.error("POST /api/brands error:", error);
    return NextResponse.json({ error: error.message || "Gagal menambah brand" }, { status: 500 });
  }
}

export async function PUT(request) {
  const auth = await guardApi(request, "settings.manage", { module: "SETTINGS" });
  if (!auth.allowed) return auth.response;

  try {
    const body = await request.json();
    const { id, name, icon, desc } = body;

    if (!id) {
      return NextResponse.json({ error: "ID brand wajib disertakan" }, { status: 400 });
    }

    const updates = {
      name: name ? name.trim() : undefined,
      icon: icon !== undefined ? icon.trim() : undefined,
      desc: desc !== undefined ? desc.trim() : undefined,
    };

    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

    if (isSupabaseConfigured()) {
      // Coba update by id
      const { data: updatedRows, error } = await supabaseAdmin
        .from("brands")
        .update(updates)
        .eq("id", id)
        .select();

      if (error) {
        console.warn("Update by ID failed, trying by name:", error.message);
      }

      // Jika ID tidak cocok (misal database baru di-seed dengan ID berbeda), coba update by name atau insert
      if (!updatedRows || updatedRows.length === 0) {
        if (name) {
          const { error: upsertErr } = await supabaseAdmin
            .from("brands")
            .upsert({ name, icon: updates.icon, "desc": updates.desc || "Official Partner" }, { onConflict: "name" });
          if (upsertErr) throw new Error(upsertErr.message);
        }
      }
    }


    await recordAuditLog({
      request,
      user: auth.user,
      action: "UPDATE_BRAND_ICON",
      module: "SETTINGS",
      resourceType: "BRAND",
      resourceId: String(id),
      newValue: updates,
      status: "SUCCESS",
      details: `Mengubah ikon brand: ${name || id}`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/brands error:", error);
    return NextResponse.json({ error: error.message || "Gagal memperbarui ikon brand" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auth = await guardApi(request, "settings.manage", { module: "SETTINGS" });
  if (!auth.allowed) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID brand wajib disertakan" }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      const { error } = await supabaseAdmin.from("brands").delete().eq("id", id);
      if (error) throw new Error(error.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/brands error:", error);
    return NextResponse.json({ error: error.message || "Gagal menghapus brand" }, { status: 500 });
  }
}
