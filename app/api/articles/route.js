// app/api/articles/route.js
import { NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { guardApi } from "@/lib/apiGuard";
import { recordAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

const DEFAULT_ARTICLES = [
  {
    id: "art-1",
    title: "Panduan Memilih Laptop Gaming 2026: RTX 4050 vs RTX 4060",
    slug: "panduan-laptop-gaming-2026",
    category: "Tips & Panduan",
    author: "Tim Tekno Raja",
    readTime: "5 Menit",
    summary: "Simak perbandingan performa FPS, efisiensi daya, dan rekomendasi laptop gaming terbaik untuk budget 12-20 jutaan.",
    content: "Di tahun 2026, kartu grafis arsitektur Ada Lovelace masih menjadi standar emas gaming 1080p dan 1440p. Memilih antara RTX 4050 dan 4060 sangat bergantung pada resolusi target dan VRAM 6GB vs 8GB...",
    imageUrl: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=80",
    is_published: true,
    created_at: new Date().toISOString()
  },
  {
    id: "art-2",
    title: "5 Tanda Laptop Perlu Repasta Thermal & Pembersihan Total",
    slug: "tanda-laptop-perlu-repasta",
    category: "Perawatan & Servis",
    author: "Master Teknisi",
    readTime: "4 Menit",
    summary: "Suhu tembus 90°C saat idle? Kipas mendesing keras? Ketahui bahaya thermal throttling sebelum merusak chipset prosesor.",
    content: "Thermal paste memiliki masa pakai efektif 12 hingga 18 bulan. Jika laptop sering dipakai render atau gaming berat, pasta pendingin akan mengering dan mengeras...",
    imageUrl: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&auto=format&fit=crop&q=80",
    is_published: true,
    created_at: new Date().toISOString()
  },
  {
    id: "art-3",
    title: "Review Lengkap ASUS ROG Zephyrus G16 OLED: Bodi Tipis, Performa Monster",
    slug: "review-rog-zephyrus-g16",
    category: "Review Laptop",
    author: "Redaksi RajaLaptop",
    readTime: "6 Menit",
    summary: "Laptop gaming impian konten kreator dengan layar ROG Nebula OLED 240Hz, sasis aluminium CNC, dan speaker paling bertenaga di kelasnya.",
    content: "ASUS berhasil membuktikan bahwa laptop gaming bertenaga tinggi tidak harus tebal dan berat. Zephyrus G16 hadir dengan ketebalan di bawah 1.5 cm...",
    imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80",
    is_published: true,
    created_at: new Date().toISOString()
  }
];

export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return NextResponse.json(data);
      }
    }
    return NextResponse.json(DEFAULT_ARTICLES);
  } catch (error) {
    console.error("GET /api/articles error:", error);
    return NextResponse.json(DEFAULT_ARTICLES);
  }
}

export async function POST(request) {
  const auth = await guardApi(request, "marketing.create", { module: "CONTENT" });
  if (!auth.allowed) return auth.response;

  try {
    const body = await request.json();
    const { title, category, author, readTime, summary, content, imageUrl, is_published = true } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Judul artikel wajib diisi" }, { status: 400 });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const newArticle = {
      id: `art-${Date.now()}`,
      title: title.trim(),
      slug: `${slug}-${Math.floor(Math.random() * 1000)}`,
      category: category || "Tips & Info",
      author: author || auth.user.name || "Admin",
      readTime: readTime || "4 Menit",
      summary: summary || "",
      content: content || "",
      imageUrl: imageUrl || null,
      is_published: Boolean(is_published),
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      const { error } = await supabaseAdmin.from("articles").insert([newArticle]);
      if (error) throw new Error(error.message);
    }

    await recordAuditLog({
      request,
      user: auth.user,
      action: "CREATE_ARTICLE",
      module: "CONTENT",
      resourceType: "ARTICLE",
      resourceId: newArticle.id,
      newValue: newArticle,
      status: "SUCCESS",
      details: `Membuat artikel baru: ${newArticle.title}`
    });

    return NextResponse.json({ success: true, article: newArticle });
  } catch (error) {
    console.error("POST /api/articles error:", error);
    return NextResponse.json({ error: error.message || "Gagal membuat artikel" }, { status: 500 });
  }
}

export async function PUT(request) {
  const auth = await guardApi(request, "marketing.update", { module: "CONTENT" });
  if (!auth.allowed) return auth.response;

  try {
    const body = await request.json();
    const { id, title, category, author, readTime, summary, content, imageUrl, is_published } = body;

    if (!id) {
      return NextResponse.json({ error: "ID artikel wajib disertakan" }, { status: 400 });
    }

    const updates = {
      title,
      category,
      author,
      readTime,
      summary,
      content,
      imageUrl,
      is_published: is_published !== undefined ? Boolean(is_published) : undefined,
      updated_at: new Date().toISOString()
    };

    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);

    if (isSupabaseConfigured()) {
      const { error } = await supabaseAdmin.from("articles").update(updates).eq("id", id);
      if (error) throw new Error(error.message);
    }

    await recordAuditLog({
      request,
      user: auth.user,
      action: "UPDATE_ARTICLE",
      module: "CONTENT",
      resourceType: "ARTICLE",
      resourceId: id,
      newValue: updates,
      status: "SUCCESS",
      details: `Memperbarui artikel: ${title || id}`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/articles error:", error);
    return NextResponse.json({ error: error.message || "Gagal memperbarui artikel" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auth = await guardApi(request, "marketing.update", { module: "CONTENT" });
  if (!auth.allowed) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID artikel wajib disertakan" }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      const { error } = await supabaseAdmin.from("articles").delete().eq("id", id);
      if (error) throw new Error(error.message);
    }

    await recordAuditLog({
      request,
      user: auth.user,
      action: "DELETE_ARTICLE",
      module: "CONTENT",
      resourceType: "ARTICLE",
      resourceId: id,
      status: "SUCCESS",
      details: `Menghapus artikel: ${id}`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/articles error:", error);
    return NextResponse.json({ error: error.message || "Gagal menghapus artikel" }, { status: 500 });
  }
}
