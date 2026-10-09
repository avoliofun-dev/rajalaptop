"use client";

import { useState, useEffect } from "react";

export default function ThemeToggle({ className, style }) {
  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("rajalaptop_theme");
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
      const initial = prefersLight ? "light" : "dark";
      setTheme(initial);
      document.documentElement.setAttribute("data-theme", initial);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("rajalaptop_theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    window.dispatchEvent(new CustomEvent("themeChange", { detail: nextTheme }));
  };

  if (!mounted) {
    return (
      <div style={{ width: "38px", height: "38px" }} />
    );
  }

  const isLight = theme === "light";

  return (
    <button
      onClick={toggleTheme}
      className={className}
      aria-label={`Ganti ke mode ${isLight ? "gelap" : "terang"}`}
      title={`Mode ${isLight ? "Terang (Aktif) - Klik untuk Mode Gelap" : "Gelap (Aktif) - Klik untuk Mode Terang"}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "38px",
        height: "38px",
        borderRadius: "var(--radius-full)",
        background: isLight ? "hsl(215, 20%, 90%)" : "var(--glass-bg)",
        border: "1px solid var(--glass-border)",
        color: isLight ? "#f59e0b" : "#60a5fa",
        fontSize: "1.15rem",
        cursor: "pointer",
        transition: "all var(--t-fast)",
        position: "relative",
        boxShadow: isLight ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
        ...style
      }}
    >
      <span style={{
        transform: isLight ? "rotate(0deg) scale(1)" : "rotate(-15deg) scale(1)",
        transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
      }}>
        {isLight ? "☀️" : "🌙"}
      </span>
    </button>
  );
}
