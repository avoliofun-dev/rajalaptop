// app/api/settings/route.js
import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/db";
import { guardApi } from "@/lib/apiGuard";
import { recordAuditLog } from "@/lib/audit";

const DEFAULT_SETTINGS = {
  storeName: "RajaLaptop",
  tagline: "Pusat Komputer & Laptop Terpercaya",
  metaDescription: "",
  promoBarActive: true,
  promoBarText: "📦 Gratis Ongkir untuk pembelian di atas Rp 500.000!",
  whatsappNumber: "6281234567890",
  phoneOffice: "(0274) 556789",
  supportEmail: "support@rajalaptop.com",
  openingHours: "Senin – Minggu: 09.00 – 21.00 WIB",
  mainAddress: "Jl. Gejayan No. 45B, Yogyakarta",
  maintenanceMode: false,
  logoUrl: "",
  faviconUrl: "",
  instagramUrl: "https://instagram.com/rajalaptop",
  youtubeUrl: "https://youtube.com/@rajalaptop",
  tiktokUrl: "https://tiktok.com/@rajalaptop",
  facebookUrl: "https://facebook.com/rajalaptop",
  footerPopularProducts: "Laptop Gaming RTX 40\nUltrabook Intel Evo\nApple MacBook Series\nPC Custom High-End\nMonitor 144Hz & 240Hz",
  footerServices: "Service Center Express\nCek Status Garansi\nKonsultasi Spesifikasi Laptop\nPanduan Belanja Online\nBlog & Review Gadget",
  footerPaymentNote: "BCA, Mandiri, BNI, BRI, QRIS, GoPay, OVO, ShopeePay, Kredivo, Akulaku, serta Cicilan 0% Kartu Kredit hingga 24 Bulan.",
  footerPaymentBadges: "💳 BCA, 💳 Mandiri, 📱 QRIS, ⚡ Cicilan 0%",
  footerCopyrightText: "Hak Cipta Dilindungi Undang-Undang.",
  footerPrivacyText: "Kebijakan Privasi",
  footerTermsText: "Syarat & Ketentuan",
  heroSlides: [],
};

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({ ...DEFAULT_SETTINGS, ...(settings || {}) });
  } catch (error) {
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

export async function POST(request) {
  const auth = await guardApi(request, 'settings.manage', { module: 'SETTINGS' });
  if (!auth.allowed) return auth.response;

  try {
    const body = await request.json();
    const oldSettings = await getSettings();
    const updated = await updateSettings(body);

    await recordAuditLog({
      request,
      user: auth.user,
      action: 'UPDATE_SETTINGS',
      module: 'SETTINGS',
      resourceType: 'SYSTEM_SETTINGS',
      oldValue: oldSettings,
      newValue: body,
      status: 'SUCCESS',
      details: 'Pembaruan pengaturan sistem & web oleh Super Admin',
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error('POST /api/settings error:', error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
