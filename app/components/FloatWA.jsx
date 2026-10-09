"use client";

import { useSettings } from "@/app/context/SettingsContext";

export default function FloatWA() {
  const { settings } = useSettings();
  const whatsappLink = `https://wa.me/${settings.whatsappNumber}?text=Halo%20RajaLaptop,%20saya%20tertarik%20dengan%20produk%20Anda`;
  return (
    <aside aria-label="Quick Actions">
      <a
        href={whatsappLink}
        target="_blank"
        rel="noreferrer"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          background: "var(--clr-wa)",
          color: "#fff",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.75rem",
          boxShadow: "0 6px 24px rgba(0,0,0,0.5)",
          zIndex: 999,
          transition: "transform 0.2s ease",
          textDecoration: "none"
        }}
        title="Chat WhatsApp"
      >
        💬
      </a>
    </aside>
  );
}
