"use client";

import { createContext, useContext, useState, useEffect } from "react";

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  storeName: "RajaLaptop",
  tagline: "Pusat Komputer & Laptop Terpercaya Jawa Tengah & DIY",
  metaDescription: "Toko resmi laptop gaming, ultrabook, PC rakitan, dan service center bergaransi resmi.",
  promoBarActive: true,
  promoBarText: "📦 Gratis Ongkir untuk pembelian di atas Rp 500.000 ke seluruh Jawa Tengah & DIY!",
  whatsappNumber: "6281234567890",
  phoneOffice: "(0274) 556789",
  supportEmail: "support@rajalaptop.com",
  openingHours: "Senin – Minggu: 09.00 – 21.00 WIB",
  mainAddress: "Jl. Gejayan (Affandi) No. 45B, Caturtunggal, Depok, Sleman, Yogyakarta",
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

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const loadSettings = async () => {
    // 1. Cek local storage cache terlebih dahulu untuk instan update
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("rajalaptop_web_settings");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === "object") {
            setSettings((prev) => ({ ...prev, ...parsed }));
          }
        }
      } catch (e) {}
    }

    // 2. Fetch fresh dari server
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === "object") {
          setSettings((prev) => ({ ...prev, ...data }));
          if (typeof window !== "undefined") {
            localStorage.setItem("rajalaptop_web_settings", JSON.stringify(data));
          }
        }
      }
    } catch (e) {
      console.error("Gagal mengambil data settings:", e);
    }
  };

  useEffect(() => {
    loadSettings();
    window.addEventListener("settingsUpdated", loadSettings);
    window.addEventListener("storage", loadSettings);
    return () => {
      window.removeEventListener("settingsUpdated", loadSettings);
      window.removeEventListener("storage", loadSettings);
    };
  }, []);

  // Sinkronkan nama store ke document.title jika berubah dari default
  useEffect(() => {
    if (typeof document !== "undefined" && settings?.storeName) {
      const curTitle = document.title;
      if (curTitle && curTitle.includes("RajaLaptop") && settings.storeName !== "RajaLaptop") {
        document.title = curTitle.replaceAll("RajaLaptop", settings.storeName);
      }
    }
  }, [settings?.storeName]);

  // Sinkronkan favicon browser tab jika diset di pengaturan
  useEffect(() => {
    if (typeof document !== "undefined" && settings?.faviconUrl) {
      let link = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "shortcut icon";
        document.getElementsByTagName("head")[0].appendChild(link);
      }
      link.href = settings.faviconUrl;
    }
  }, [settings?.faviconUrl]);

  return (
    <SettingsContext.Provider value={{ settings, reloadSettings: loadSettings }}>
      {settings.maintenanceMode && (
        <div style={{
          background: "linear-gradient(90deg, #b91c1c, #dc2626)",
          color: "#fff",
          textAlign: "center",
          padding: "0.6rem 1rem",
          fontSize: "0.85rem",
          fontWeight: 700,
          position: "sticky",
          top: 0,
          zIndex: 99999,
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)"
        }}>
          ⚠️ Mode Pemeliharaan Aktif: Sistem sedang dalam pembaruan database. Pembelian sementara ditangguhkan.
        </div>
      )}
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    return {
      settings: DEFAULT_SETTINGS,
      reloadSettings: () => {}
    };
  }
  return context;
}
