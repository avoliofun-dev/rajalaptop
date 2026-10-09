"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./ProductCard.module.css";

export default function ProductCard({ product }) {
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);

  // Initialize wishlist status from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("rajalaptop_wishlist") || "[]");
      if (stored.some((item) => item.id === product.id)) {
        setWishlisted(true);
      }
    } catch {}
  }, [product.id]);

  const toggleWishlist = () => {
    let nextState = !wishlisted;
    setWishlisted(nextState);
    try {
      let stored = JSON.parse(localStorage.getItem("rajalaptop_wishlist") || "[]");
      if (nextState) {
        if (!stored.some((it) => it.id === product.id)) {
          stored.push({
            id: product.id,
            name: product.name,
            brand: product.brand,
            price: Number(product.price) || 0,
            specs: product.specs || product.specification || "",
            emoji: product.emoji || "💻"
          });
        }
      } else {
        stored = stored.filter((it) => it.id !== product.id);
      }
      localStorage.setItem("rajalaptop_wishlist", JSON.stringify(stored));
      window.dispatchEvent(new CustomEvent("wishlistUpdate", { detail: stored.length }));
    } catch {}

    const msg = nextState
      ? `❤️ Ditambahkan ke Wishlist: ${product.name}`
      : `💔 Dihapus dari Wishlist: ${product.name}`;
    window.dispatchEvent(new CustomEvent("showToast", { detail: msg }));
  };

  const addToCart = async () => {
    try {
      const res = await fetch("/api/auth/customer/me");
      if (!res.ok) {
        window.dispatchEvent(
          new CustomEvent("showToast", {
            detail: "🔒 Silakan masuk akun terlebih dahulu untuk menggunakan keranjang!",
          })
        );
        router.push(`/login?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/produk")}`);
        return;
      }
    } catch {
      router.push("/login");
      return;
    }

    try {
      const existing = JSON.parse(localStorage.getItem("rajalaptop_cart") || "[]");
      const idx = existing.findIndex((item) => item.id === product.id || item.productId === product.id);
      if (idx >= 0) {
        existing[idx].qty = (existing[idx].qty || 1) + 1;
      } else {
        existing.push({
          id: `item-${Date.now()}`,
          productId: product.id,
          name: product.name,
          brand: product.brand,
          emoji: product.emoji || "💻",
          package: "Unit Standar",
          price: Number(product.price) || 0,
          qty: 1,
        });
      }
      localStorage.setItem("rajalaptop_cart", JSON.stringify(existing));
      const total = existing.reduce((acc, it) => acc + (it.qty || 1), 0);
      window.dispatchEvent(new CustomEvent("cartUpdate", { detail: total }));
    } catch {}

    window.dispatchEvent(
      new CustomEvent("showToast", {
        detail: `🛒 ${product.name} dimasukkan ke keranjang!`
      })
    );
  };

  const formatMoney = (val) => {
    if (val === undefined || val === null || val === "") return "Rp 0";
    if (typeof val === "string" && val.trim().startsWith("Rp")) return val;
    const num = Number(String(val).replace(/[^0-9.-]+/g, ""));
    if (isNaN(num)) return typeof val === "string" ? val : "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const specsArray = Array.isArray(product.specs)
    ? product.specs
    : (typeof product.specs === "string" ? product.specs.split(", ") : []);

  return (
    <div className={styles.card}>
      {product.discount > 0 && (
        <span className={styles.discountBadge}>-{product.discount}%</span>
      )}
      {product.isNew && (
        <span className={styles.newBadge}>BARU</span>
      )}
      
      <button
        className={`${styles.wishlistBtn} ${wishlisted ? styles.active : ""}`}
        onClick={toggleWishlist}
        aria-label="Wishlist"
      >
        ♥
      </button>

      <Link href={`/produk/${product.id}`} className={styles.imageBox}>
        {product.image_url || (Array.isArray(product.images) && product.images[0]) ? (
          <img
            src={product.image_url || product.images[0]}
            alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "contain", padding: "0.5rem" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const emojiSpan = e.currentTarget.parentElement?.querySelector(`.${styles.deviceEmoji}`);
              if (emojiSpan) emojiSpan.style.display = "block";
            }}
          />
        ) : null}
        <span
          className={styles.deviceEmoji}
          style={{ display: product.image_url || (Array.isArray(product.images) && product.images[0]) ? "none" : "block" }}
        >
          {product.emoji || "💻"}
        </span>
        <div className={styles.specChips}>
          {specsArray.slice(0, 2).map((s, i) => (
            <span key={i} className={styles.chip}>{s}</span>
          ))}
        </div>
      </Link>

      <div className={styles.cardBody}>
        <div className={styles.brandRow}>
          <span className={styles.brandName}>{product.brand}</span>
          <div className={styles.rating}>
            ⭐ <span>{product.rating || "4.9"}</span>
            <span className={styles.sold}>({product.sold || "120+"} terjual)</span>
          </div>
        </div>

        <Link href={`/produk/${product.id}`} style={{ textDecoration: 'none' }}>
          <h3 className={styles.productName} title={product.name}>
            {product.name}
          </h3>
        </Link>

        <div className={styles.specsList}>
          {specsArray.map((s, idx) => (
            <span key={idx} className={styles.specItem}>• {s}</span>
          ))}
        </div>

        <div className={styles.priceRow}>
          <div>
            <div className={styles.price} suppressHydrationWarning>{formatMoney(product.price)}</div>
            {product.originalPrice && (
              <div className={styles.originalPrice} suppressHydrationWarning>{formatMoney(product.originalPrice)}</div>
            )}
          </div>
          <button className={styles.cartBtn} onClick={addToCart} title="Beli / Tambah">
            + Keranjang
          </button>
        </div>
      </div>
    </div>
  );
}
