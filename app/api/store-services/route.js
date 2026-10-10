// app/api/store-services/route.js
import { NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { guardApi } from "@/lib/apiGuard";
import { recordAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

const DEFAULT_STORE_SERVICES = [
  {
    id: "srv-1",
    title: "Ganti Pasta & Pembersihan",
    badge: "Bisa Ditunggu",
    duration: "30-45 Menit",
    warranty: "1 Bulan",
    priceText: "Mulai Rp 75.000",
    desc: "Pembersihan kipas, heatsink, dan penggantian thermal paste berkualitas tinggi (Noctua / Grizzly) agar suhu laptop dingin dan tidak overheating.",
    features: "Thermal paste premium, Pembersihan debu total, Pengecekan temperatur",
    sort_order: 1,
    is_active: true
  },
  {
    id: "srv-2",
    title: "Upgrade RAM & SSD NVMe",
    badge: "Garansi Resmi",
    duration: "15-30 Menit",
    warranty: "1-3 Tahun",
    priceText: "Biaya Pasang Gratis",
    desc: "Percepat performa laptop untuk multitasking dan gaming. Kompatibilitas dijamin 100% dan migrasi data/Windows aman tanpa hilang file.",
    features: "SSD NVMe Gen3/Gen4, RAM DDR4/DDR5, Kloning OS & data aman",
    sort_order: 2,
    is_active: true
  },
  {
    id: "srv-3",
    title: "Servis Mesin & Motherboard",
    badge: "Teknisi Senior",
    duration: "1-3 Hari",
    warranty: "3 Bulan",
    priceText: "Cek Gratis",
    desc: "Perbaikan laptop mati total, kena air, korsleting, no display, atau kerusakan IC power. Pengecekan awal gratis tanpa biaya pembatalan.",
    features: "Peralatan osiloskop modern, Komponen original, Garansi perbaikan nyata",
    sort_order: 3,
    is_active: true
  },
  {
    id: "srv-4",
    title: "Ganti Baterai, Keyboard & LCD",
    badge: "Part Original",
    duration: "1-2 Jam",
    warranty: "6 Bulan",
    priceText: "Sesuai Tipe Laptop",
    desc: "Penggantian spare part layar pecah, garis-garis, tombol keyboard macet, atau baterai drop cepat habis dengan suku cadang bergaransi resmi.",
    features: "Layar IPS/OLED original, Baterai certified tahan lama, Keyboard empuk presisi",
    sort_order: 4,
    is_active: true
  }
];

export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from("store_services")
        .select("*")
        .order("sort_order", { ascending: true });

      if (!error && data && data.length > 0) {
        return NextResponse.json(data);
      }
    }
    return NextResponse.json(DEFAULT_STORE_SERVICES);
  } catch (error) {
    console.error("GET /api/store-services error:", error);
    return NextResponse.json(DEFAULT_STORE_SERVICES);
  }
}

export async function POST(request) {
  const auth = await guardApi(request, "marketing.create", { module: "CONTENT" });
  if (!auth.allowed) return auth.response;

  try {
    const body = await request.json();
    const { title, desc, badge, duration, warranty, priceText, features, sort_order = 0 } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Judul layanan wajib diisi" }, { status: 400 });
    }

    const newService = {
      id: `srv-${Date.now()}`,
      title: title.trim(),
      desc: desc || "",
      badge: badge || "Layanan Resmi",
      duration: duration || "1-2 Hari",
      warranty: warranty || "1 Bulan",
      priceText: priceText || "Hubungi Kami",
      features: features || "",
      sort_order: Number(sort_order) || 0,
      is_active: true,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      const { error } = await supabaseAdmin.from("store_services").insert([newService]);
      if (error) throw new Error(error.message);
    }

    await recordAuditLog({
      request,
      user: auth.user,
      action: "CREATE_STORE_SERVICE",
      module: "CONTENT",
      resourceType: "STORE_SERVICE",
      resourceId: newService.id,
      newValue: newService,
      status: "SUCCESS",
      details: `Menambah layanan baru: ${newService.title}`
    });

    return NextResponse.json({ success: true, service: newService });
  } catch (error) {
    console.error("POST /api/store-services error:", error);
    return NextResponse.json({ error: error.message || "Gagal menambah layanan" }, { status: 500 });
  }
}

export async function PUT(request) {
  const auth = await guardApi(request, "marketing.update", { module: "CONTENT" });
  if (!auth.allowed) return auth.response;

  try {
    const body = await request.json();
    const { id, title, desc, badge, duration, warranty, priceText, features, sort_order, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "ID layanan wajib disertakan" }, { status: 400 });
    }

    const updates = {
      title,
      desc,
      badge,
      duration,
      warranty,
      priceText,
      features,
      sort_order: sort_order !== undefined ? Number(sort_order) : undefined,
      is_active: is_active !== undefined ? Boolean(is_active) : undefined,
      updated_at: new Date().toISOString()
    };

    // Remove undefined
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);

    if (isSupabaseConfigured()) {
      const { error } = await supabaseAdmin.from("store_services").update(updates).eq("id", id);
      if (error) throw new Error(error.message);
    }

    await recordAuditLog({
      request,
      user: auth.user,
      action: "UPDATE_STORE_SERVICE",
      module: "CONTENT",
      resourceType: "STORE_SERVICE",
      resourceId: id,
      newValue: updates,
      status: "SUCCESS",
      details: `Memperbarui info layanan: ${title || id}`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/store-services error:", error);
    return NextResponse.json({ error: error.message || "Gagal memperbarui layanan" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auth = await guardApi(request, "marketing.update", { module: "CONTENT" });
  if (!auth.allowed) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID layanan wajib disertakan" }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      const { error } = await supabaseAdmin.from("store_services").delete().eq("id", id);
      if (error) throw new Error(error.message);
    }

    await recordAuditLog({
      request,
      user: auth.user,
      action: "DELETE_STORE_SERVICE",
      module: "CONTENT",
      resourceType: "STORE_SERVICE",
      resourceId: id,
      status: "SUCCESS",
      details: `Menghapus layanan: ${id}`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/store-services error:", error);
    return NextResponse.json({ error: error.message || "Gagal menghapus layanan" }, { status: 500 });
  }
}
