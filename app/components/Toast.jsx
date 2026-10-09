"use client";

import { useState, useEffect } from "react";

export default function Toast() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const text = e.detail;
      const id = Date.now() + Math.random();
      setMessages((prev) => [...prev, { id, text }]);

      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }, 3500);
    };

    window.addEventListener("showToast", handleToast);
    return () => window.removeEventListener("showToast", handleToast);
  }, []);

  if (messages.length === 0) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "90px",
      right: "24px",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      pointerEvents: "none"
    }}>
      {messages.map((m) => (
        <div
          key={m.id}
          style={{
            background: "hsl(220, 20%, 15%)",
            color: "#fff",
            border: "1px solid var(--clr-primary)",
            padding: "0.75rem 1.25rem",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-md)",
            fontSize: "0.85rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          {m.text}
        </div>
      ))}
    </div>
  );
}
