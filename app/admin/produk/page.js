"use client";

import { useState, useEffect, useMemo, useRef } from "react";

const INITIAL_PRODUCTS = [
  {
    id: "prod-1",
    name: "ASUS ROG Zephyrus G16 (2025)",
    brand: "ASUS",
    category: "gaming",
    price: 26999000,
    originalPrice: 31999000,
    discount: 15,
    stock: 8,
    status: "active",
    specs: "Core Ultra 9, RTX 4070 8GB, 32GB RAM, 1TB SSD",
    emoji: "💻"
  },
  {
    id: "prod-2",
    name: "Lenovo Legion Pro 5i Gen 9",
    brand: "Lenovo",
    category: "gaming",
    price: 21499000,
    originalPrice: 24999000,
    discount: 14,
    stock: 12,
    status: "active",
    specs: "Core i7-14700HX, RTX 4060 8GB, 16GB RAM, 1TB SSD",
    emoji: "⚡"
  },
  {
    id: "prod-3",
    name: "MacBook Air M3 15-inch",
    brand: "Apple",
    category: "ultrabook",
    price: 18799000,
    originalPrice: 20999000,
    discount: 10,
    stock: 5,
    status: "active",
    specs: "Apple M3 8-Core CPU, 16GB RAM, 512GB SSD",
    emoji: "🍏"
  },
  {
    id: "prod-4",
    name: "MSI Raider GE78 HX Smart Touch",
    brand: "MSI",
    category: "gaming",
    price: 38999000,
    originalPrice: 42000000,
    discount: 7,
    stock: 2, // Low stock
    status: "active",
    specs: "Core i9-14900HX, RTX 4080 12GB, 32GB RAM, 2TB SSD",
    emoji: "🐲"
  },
  {
    id: "prod-5",
    name: "Lenovo ThinkPad X1 Carbon Gen 12",
    brand: "Lenovo",
    category: "kerja",
    price: 24500000,
    originalPrice: 24500000,
    discount: 0,
    stock: 1, // Critical
    status: "active",
    specs: "Core Ultra 7 155H, 32GB RAM, 1TB SSD",
    emoji: "💼"
  },
  {
    id: "prod-6",
    name: "Logitech G PRO X Superlight 2 Wireless",
    brand: "Logitech",
    category: "aksesoris",
    price: 21500000,
    originalPrice: 21500000,
    discount: 0,
    stock: 3,
    status: "active",
    specs: "HERO 2 32K DPI, LIGHTSPEED, 60g, 95h Battery",
    emoji: "🖱️"
  }
];

export default function AdminProdukPage() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [ramFilter, setRamFilter] = useState("all");
  const [ssdFilter, setSsdFilter] = useState("all");
  const [processorFilter, setProcessorFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [toast, setToast] = useState("");

  // Multiple Images State for Add Product
  const [addImages, setAddImages] = useState([]);
  const [addUrlInput, setAddUrlInput] = useState("");
  const [uploadingAdd, setUploadingAdd] = useState(false);

  // Multiple Images State for Edit Product
  const [editImages, setEditImages] = useState([]);
  const [editUrlInput, setEditUrlInput] = useState("");
  const [uploadingEdit, setUploadingEdit] = useState(false);

  // New Product Form State
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    brand: "ASUS",
    category: "gaming",
    price: "",
    cost_price: "",
    tax_option: "ppn11", // 'none' | 'ppn11' | 'ppn12' | 'manual'
    tax_rate: "11",
    tax_type: "inclusive", // 'inclusive' | 'exclusive'
    discount: "0",
    stock: "10",
    specs: "",
    emoji: "💻"
  });

  // RBAC User Info
  const [currentUser, setCurrentUser] = useState(null);

  // Scanner Modal & Hardware Scanner State
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scanInputVal, setScanInputVal] = useState("");
  const [scannerMode, setScannerMode] = useState("hardware"); // "hardware" | "camera"
  const [cameraActive, setCameraActive] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [lastScannedCode, setLastScannedCode] = useState("");
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  
  const scanInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Audio Beep Feedback for Barcode Scan
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {
      // AudioContext fallback
    }
  };

  // Fetch Current Admin Role
  const loadCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/admin/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user || data.admin);
      }
    } catch (e) {
      console.warn("Failed to fetch admin user context:", e);
    }
  };

  // Load from real Database via API
  const loadProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error("Failed to load products from database:", e);
    }
  };

  // Load initial data on mount
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [prodRes, userRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/auth/admin/me")
        ]);
        if (active && prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(prodData);
        }
        if (active && userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser(userData.user || userData.admin);
        }
      } catch (err) {
        console.warn("Failed to load initial data:", err);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // Camera Barcode Scanner Controls
  useEffect(() => {
    let isMounted = true;
    if (showScannerModal && scannerMode === "camera") {
      navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          if (!isMounted) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
          setCameraActive(true);
        })
        .catch((err) => {
          console.warn("Webcam error:", err);
          if (isMounted) setCameraActive(false);
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    }

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [showScannerModal, scannerMode]);

  // Focus scan input when hardware modal opens
  useEffect(() => {
    if (showScannerModal && scannerMode === "hardware") {
      const timer = setTimeout(() => {
        scanInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [showScannerModal, scannerMode]);

  const showToastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  // Handle scanned barcode (from USB/Bluetooth Scanner or Camera/Manual)
  const handleApplyBarcode = (code) => {
    const cleanCode = (code || "").trim();
    if (!cleanCode) return;

    playBeep();
    setLastScannedCode(cleanCode);
    setScanHistory((prev) => [cleanCode, ...prev.filter((c) => c !== cleanCode)].slice(0, 5));

    // Cek apakah barcode sudah ada di database produk katalog
    const existing = products.find(
      (p) =>
        (p.sku && p.sku.toLowerCase() === cleanCode.toLowerCase()) ||
        (p.id && p.id.toLowerCase() === cleanCode.toLowerCase())
    );

    if (existing) {
      showToastMsg(`🔍 Barcode cocok dengan produk: "${existing.name}"! Membuka editor...`);
      startEditProduct(existing);
      setShowScannerModal(false);
    } else {
      // Produk baru - buka modal tambah produk dan isi otomatis SKU/Barcode
      setFormData((prev) => ({
        ...prev,
        sku: cleanCode,
        name: prev.name ? prev.name : `Unit (${cleanCode})`,
      }));
      setShowScannerModal(false);
      setShowAddModal(true);
      showToastMsg(`✅ Barcode "${cleanCode}" berhasil dipindai! Silakan lengkapi info produk.`);
    }
    setScanInputVal("");
  };

  // Upload multiple files via /api/upload
  const handleUploadFiles = async (files, setImagesList, setUploading) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      for (let i = 0; i < files.length; i++) {
        fd.append("files", files[i]);
      }
      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.urls) {
        setImagesList((prev) => [...prev, ...data.urls]);
        showToastMsg(`📸 Berhasil mengunggah ${data.urls.length} gambar!`);
      } else {
        alert(data.error || "Gagal mengunggah gambar");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Terjadi kesalahan saat mengunggah file gambar: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSetCover = (index, setImagesList) => {
    setImagesList((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
    showToastMsg("⭐ Gambar sampul utama berhasil diperbarui!");
  };

  const handleRemoveImg = (index, setImagesList) => {
    setImagesList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveImg = (index, direction, setImagesList) => {
    setImagesList((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  const startEditProduct = (p) => {
    let taxOpt = "none";
    const tRate = p.tax_rate !== null && p.tax_rate !== undefined ? Number(p.tax_rate) : 0;
    if (tRate === 11) taxOpt = "ppn11";
    else if (tRate === 12) taxOpt = "ppn12";
    else if (tRate > 0) taxOpt = "manual";

    setEditProduct({
      ...p,
      cost_price: p.cost_price !== undefined && p.cost_price !== null ? p.cost_price : "",
      tax_option: taxOpt,
      tax_rate: tRate > 0 ? String(tRate) : "0",
      tax_type: p.tax_type || "inclusive",
    });
    let imgs = [];
    if (Array.isArray(p.images) && p.images.length > 0) {
      imgs = [...p.images];
    } else if (p.image_url) {
      imgs = [p.image_url];
    }
    setEditImages(imgs);
    setEditUrlInput("");
  };

  // Add Product to Database
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      alert("Harap isi nama dan harga produk.");
      return;
    }

    const priceNum = parseInt(formData.price, 10) || 0;
    const costPriceNum = parseInt(formData.cost_price, 10) || 0;
    const discountNum = parseInt(formData.discount, 10) || 0;
    const stockNum = parseInt(formData.stock, 10) || 0;
    const taxRateNum = formData.tax_option === "none" ? 0 : (parseFloat(formData.tax_rate) || 0);
    const taxTypeVal = formData.tax_option === "none" ? "none" : (formData.tax_type || "inclusive");

    const payload = {
      sku: formData.sku?.trim() || undefined,
      name: formData.name,
      brand: formData.brand,
      category: formData.category,
      price: priceNum,
      cost_price: costPriceNum,
      tax_rate: taxRateNum,
      tax_type: taxTypeVal,
      originalPrice: discountNum > 0 ? Math.round(priceNum / (1 - discountNum / 100)) : priceNum,
      discount: discountNum,
      stock: stockNum,
      status: "active",
      specs: formData.specs || "Spesifikasi Resmi Distributor",
      emoji: formData.emoji || "💻",
      image_url: addImages[0] || null,
      images: addImages
    };

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await loadProducts();
        setShowAddModal(false);
        setAddImages([]);
        setAddUrlInput("");
        setFormData({
          sku: "",
          name: "",
          brand: "ASUS",
          category: "gaming",
          price: "",
          cost_price: "",
          tax_option: "ppn11",
          tax_rate: "11",
          tax_type: "inclusive",
          discount: "0",
          stock: "10",
          specs: "",
          emoji: "💻"
        });
        showToastMsg(`✅ Produk "${payload.name}" berhasil disimpan ke database!`);
      } else {
        alert(data.error || "Gagal menambahkan produk ke database.");
      }
    } catch (err) {
      console.error("Error creating product:", err);
      alert("Error membuat produk: " + err.message);
    }
  };

  // Available Brands extracted dynamically from products
  const availableBrands = useMemo(() => {
    const defaultBrands = ["ASUS", "Lenovo", "Apple", "MSI", "HP", "Acer", "Dell", "Axioo", "Advan", "Zyrex", "Logitech", "Keychron"];
    const set = new Set(defaultBrands);
    products.forEach((p) => {
      if (p.brand && p.brand.trim()) set.add(p.brand.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  // Update Product in Database
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editProduct) return;

    const priceNum = Number(editProduct.price) || 0;
    const costPriceNum = Number(editProduct.cost_price) || 0;
    const taxRateNum = editProduct.tax_option === "none" ? 0 : (parseFloat(editProduct.tax_rate) || 0);
    const taxTypeVal = editProduct.tax_option === "none" ? "none" : (editProduct.tax_type || "inclusive");

    try {
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editProduct.id,
          name: editProduct.name,
          brand: editProduct.brand,
          category: editProduct.category,
          price: priceNum,
          cost_price: costPriceNum,
          tax_rate: taxRateNum,
          tax_type: taxTypeVal,
          stock: Number(editProduct.stock),
          discount: Number(editProduct.discount),
          specs: editProduct.specs || "",
          image_url: editImages[0] || null,
          images: editImages
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await loadProducts();
        setEditProduct(null);
        setEditImages([]);
        showToastMsg(`💾 Data produk "${editProduct.name}" berhasil diperbarui di database!`);
      } else {
        alert(data.error || "Gagal memperbarui produk di database.");
      }
    } catch (err) {
      console.error("Error updating product:", err);
      alert("Error memperbarui produk: " + err.message);
    }
  };

  // Delete Product from Database
  const handleDeleteProduct = async (id, name) => {
    if (confirm(`Yakin ingin menghapus produk "${name}" dari database katalog?`)) {
      try {
        const res = await fetch(`/api/products?id=${id}`, {
          method: "DELETE"
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          await loadProducts();
          showToastMsg(`🗑️ Produk "${name}" berhasil dihapus dari database.`);
        } else {
          alert(data.error || "Gagal menghapus produk dari database.");
        }
      } catch (err) {
        console.error("Error deleting product:", err);
        alert("Error menghapus produk: " + err.message);
      }
    }
  };

  // Toggle Product Status (Active / Non-Active)
  const toggleStatus = async (id) => {
    const current = products.find((p) => p.id === id);
    if (!current) return;
    const nextStatus = current.status === "active" ? "draft" : "active";

    try {
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus })
      });
      if (res.ok) {
        await loadProducts();
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // Filtered List with Brand, RAM, SSD, and Processor
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (p.name || "").toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q) ||
        (p.specs || "").toLowerCase().includes(q);

      const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;

      const matchesBrand =
        brandFilter === "all" || (p.brand || "").toLowerCase() === brandFilter.toLowerCase();

      // Combined text for specs matching
      const fullText = `${p.name || ""} ${p.specs || ""}`.toLowerCase();

      // RAM Filter
      let matchesRam = true;
      if (ramFilter === "8GB") matchesRam = /\b8\s*gb\b/i.test(fullText);
      else if (ramFilter === "16GB") matchesRam = /\b16\s*gb\b/i.test(fullText);
      else if (ramFilter === "32GB") matchesRam = /\b32\s*gb\b/i.test(fullText);
      else if (ramFilter === "64GB") matchesRam = /\b64\s*gb\b/i.test(fullText);

      // SSD Filter
      let matchesSsd = true;
      if (ssdFilter === "256GB") matchesSsd = /\b256\s*gb\b/i.test(fullText);
      else if (ssdFilter === "512GB") matchesSsd = /\b512\s*gb\b/i.test(fullText);
      else if (ssdFilter === "1TB") matchesSsd = /\b1\s*tb\b|\b1024\s*gb\b/i.test(fullText);
      else if (ssdFilter === "2TB") matchesSsd = /\b2\s*tb\b|\b2048\s*gb\b/i.test(fullText);

      // Processor Filter
      let matchesProc = true;
      if (processorFilter === "intel_ultra") {
        matchesProc = /ultra/i.test(fullText);
      } else if (processorFilter === "intel_core") {
        matchesProc = /\b(core\s*i[3579]|i[3579]-|intel\s*core\s*i)/i.test(fullText);
      } else if (processorFilter === "amd_ryzen") {
        matchesProc = /\b(ryzen|amd)/i.test(fullText);
      } else if (processorFilter === "apple_m") {
        matchesProc = /\b(apple\s*m|m[1234]\b)/i.test(fullText);
      }

      return matchesSearch && matchesCategory && matchesBrand && matchesRam && matchesSsd && matchesProc;
    });
  }, [products, search, categoryFilter, brandFilter, ramFilter, ssdFilter, processorFilter]);

  const activeFilterCount =
    (categoryFilter !== "all" ? 1 : 0) +
    (brandFilter !== "all" ? 1 : 0) +
    (ramFilter !== "all" ? 1 : 0) +
    (ssdFilter !== "all" ? 1 : 0) +
    (processorFilter !== "all" ? 1 : 0) +
    (search.trim() ? 1 : 0);

  const resetAllFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setBrandFilter("all");
    setRamFilter("all");
    setSsdFilter("all");
    setProcessorFilter("all");
  };

  const formatRupiah = (val) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  const formatRupiahInput = (val) => {
    if (val === null || val === undefined || val === "") return "";
    const num = typeof val === "string" ? parseInt(val.replace(/\D/g, ""), 10) : val;
    if (isNaN(num)) return "";
    return new Intl.NumberFormat("id-ID").format(num);
  };

  const calculateMargin = (priceVal, costVal, taxRateVal, taxTypeVal) => {
    const P = Number(priceVal) || 0;
    const C = Number(costVal) || 0;
    const T = Number(taxRateVal) || 0;
    const type = taxTypeVal || "none";

    let netPrice = P;
    let taxAmount = 0;

    if (type === "inclusive" && T > 0) {
      netPrice = Math.round(P / (1 + T / 100));
      taxAmount = P - netPrice;
    } else if (type === "exclusive" && T > 0) {
      netPrice = P;
      taxAmount = Math.round(P * (T / 100));
    }

    const profit = C > 0 ? (netPrice - C) : 0;
    const marginPercent = netPrice > 0 && C > 0 ? ((profit / netPrice) * 100) : 0;

    return {
      netPrice,
      taxAmount,
      profit,
      marginPercent,
      isLoss: C > 0 && profit < 0,
      hasCost: C > 0,
    };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: "fixed",
          top: "80px",
          right: "2rem",
          background: "var(--clr-primary)",
          color: "#fff",
          padding: "0.85rem 1.5rem",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-lg)",
          zIndex: 9999,
          fontWeight: 700,
          fontSize: "0.9rem"
        }}>
          {toast}
        </div>
      )}

      {/* Top Header with Action */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-contrast)" }}>
            Atur Produk & Inventori Katalog
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Tambah laptop baru, ubah harga promo, atur kuota stok unit, dan pantau barang menipis.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          {/* Tombol Alat Scan Barcode */}
          <button
            onClick={() => {
              setScannerMode("hardware");
              setShowScannerModal(true);
            }}
            type="button"
            className="btn-outline"
            style={{
              padding: "0.65rem 1.25rem",
              fontSize: "0.9rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "hsla(220, 90%, 56%, 0.08)",
              borderColor: "var(--clr-primary)",
              color: "var(--clr-primary)",
              fontWeight: 700,
            }}
            title="Scan barcode dari alat scan handheld / kamera untuk tambah produk instan"
          >
            <span style={{ fontSize: "1.1rem" }}>📷</span>
            <span>Input via Alat Scan / Barcode</span>
          </button>

          {/* Tombol Tambah Produk Biasa */}
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
            style={{ padding: "0.65rem 1.4rem", fontSize: "0.9rem", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
          >
            <span>+</span>
            <span>Tambah Produk Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--glass-border)",
        borderRadius: "var(--radius-lg)",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem"
      }}>
        {/* Row 1: Search & Category */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: "260px" }}>
            <input
              type="text"
              placeholder="🔍 Cari nama laptop, PC, brand, atau spesifikasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "0.65rem 1rem",
                background: "var(--bg-card)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-contrast)",
                fontSize: "0.85rem",
                outline: "none"
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Kategori:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: "0.65rem 0.9rem",
                background: "var(--bg-card)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-contrast)",
                fontSize: "0.85rem",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="all">Semua Kategori</option>
              <option value="gaming">Laptop Gaming</option>
              <option value="kerja">Kerja & Bisnis</option>
              <option value="ultrabook">Ultrabook Tipis</option>
              <option value="pc">PC & Desktop</option>
              <option value="aksesoris">Aksesoris</option>
            </select>
          </div>
        </div>

        {/* Row 2: Merek, RAM, SSD, Prosesor */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "0.75rem",
          alignItems: "center"
        }}>
          {/* Merek (Brand) */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 600 }}>
              🏷️ Merek (Brand)
            </label>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "0.6rem 0.8rem",
                background: "var(--bg-card)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-contrast)",
                fontSize: "0.85rem",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="all">Semua Merek</option>
              {availableBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* RAM */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 600 }}>
              ⚡ Kapasitas RAM
            </label>
            <select
              value={ramFilter}
              onChange={(e) => setRamFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "0.6rem 0.8rem",
                background: "var(--bg-card)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-contrast)",
                fontSize: "0.85rem",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="all">Semua RAM</option>
              <option value="8GB">8 GB RAM</option>
              <option value="16GB">16 GB RAM</option>
              <option value="32GB">32 GB RAM</option>
              <option value="64GB">64 GB RAM</option>
            </select>
          </div>

          {/* SSD */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 600 }}>
              💾 Storage / SSD
            </label>
            <select
              value={ssdFilter}
              onChange={(e) => setSsdFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "0.6rem 0.8rem",
                background: "var(--bg-card)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-contrast)",
                fontSize: "0.85rem",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="all">Semua SSD</option>
              <option value="256GB">256 GB</option>
              <option value="512GB">512 GB</option>
              <option value="1TB">1 TB</option>
              <option value="2TB">2 TB</option>
            </select>
          </div>

          {/* Prosesor */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 600 }}>
              🧠 Tipe Prosesor
            </label>
            <select
              value={processorFilter}
              onChange={(e) => setProcessorFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "0.6rem 0.8rem",
                background: "var(--bg-card)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-contrast)",
                fontSize: "0.85rem",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="all">Semua Prosesor</option>
              <option value="intel_core">Intel Core (i3/i5/i7/i9)</option>
              <option value="intel_ultra">Intel Core Ultra</option>
              <option value="amd_ryzen">AMD Ryzen Series</option>
              <option value="apple_m">Apple Silicon (M-Series)</option>
            </select>
          </div>
        </div>

        {/* Row 3: Filter Info & Reset Button */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
          paddingTop: "0.5rem",
          borderTop: "1px solid var(--glass-border)",
          fontSize: "0.8rem",
          color: "var(--text-muted)"
        }}>
          <div>
            Menampilkan <strong style={{ color: "var(--text-contrast)" }}>{filtered.length}</strong> dari {products.length} produk katalog
            {activeFilterCount > 0 && (
              <span style={{ marginLeft: "0.5rem", color: "var(--clr-primary)", fontWeight: 600 }}>
                ({activeFilterCount} filter aktif)
              </span>
            )}
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={resetAllFilters}
              style={{
                background: "transparent",
                border: "1px solid var(--glass-border)",
                color: "var(--clr-danger)",
                padding: "4px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              ✕ Reset Semua Filter
            </button>
          )}
        </div>
      </div>

      {/* Products Table Card */}
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--glass-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden"
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--glass-border)", color: "var(--text-secondary)" }}>
                <th style={{ padding: "0.9rem 1.25rem" }}>Produk</th>
                <th style={{ padding: "0.9rem 1rem" }}>Kategori</th>
                <th style={{ padding: "0.9rem 1rem" }}>Harga Jual</th>
                <th style={{ padding: "0.9rem 1rem" }}>Diskon</th>
                <th style={{ padding: "0.9rem 1rem" }}>Sisa Stok</th>
                <th style={{ padding: "0.9rem 1rem" }}>Status</th>
                <th style={{ padding: "0.9rem 1.25rem", textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isLow = p.stock <= 3;
                const isOut = p.stock === 0;
                const coverImg = p.image_url || (Array.isArray(p.images) && p.images[0]) || null;
                const photoCount = Array.isArray(p.images) ? p.images.length : (p.image_url ? 1 : 0);

                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                    <td style={{ padding: "1rem 1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                        <div style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "var(--radius-md)",
                          overflow: "hidden",
                          background: "var(--bg-card-inner)",
                          border: "1px solid var(--glass-border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          position: "relative"
                        }}>
                          {coverImg ? (
                            <img
                              src={coverImg}
                              alt={p.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: "1.6rem" }}>{p.emoji || "💻"}</span>
                          )}
                          {photoCount > 1 && (
                            <span style={{
                              position: "absolute",
                              bottom: "2px",
                              right: "2px",
                              background: "rgba(0,0,0,0.8)",
                              color: "#fff",
                              fontSize: "0.58rem",
                              fontWeight: 700,
                              padding: "1px 4px",
                              borderRadius: "4px"
                            }}>
                              📷 {photoCount}
                            </span>
                          )}
                        </div>
                        <div>
                          <strong style={{ display: "block", color: "var(--text-contrast)", fontSize: "0.9rem" }}>
                            {p.name}
                          </strong>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {p.brand} • {p.specs}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "1rem", textTransform: "capitalize", color: "var(--text-secondary)" }}>
                      {p.category}
                    </td>

                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 700, color: "var(--text-contrast)" }}>
                        {formatRupiah(p.price)}
                      </div>
                      {p.cost_price > 0 && (
                        <div style={{ fontSize: "0.72rem", color: "#10b981", marginTop: "2px", fontWeight: 600 }} title="Harga Modal Toko (HPP)">
                          Modal: {formatRupiah(p.cost_price)}
                        </div>
                      )}
                      {p.tax_rate > 0 && (
                        <span style={{
                          display: "inline-block",
                          marginTop: "2px",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          padding: "1px 5px",
                          borderRadius: "4px",
                          background: "rgba(59, 130, 246, 0.12)",
                          color: "#3b82f6"
                        }}>
                          PPN {p.tax_rate}% {p.tax_type === "inclusive" ? "(Inc)" : "(Exc)"}
                        </span>
                      )}
                    </td>

                    <td style={{ padding: "1rem" }}>
                      {p.discount > 0 ? (
                        <span style={{
                          background: "hsla(0, 80%, 58%, 0.15)",
                          color: "var(--clr-danger)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontWeight: 700,
                          fontSize: "0.75rem"
                        }}>
                          -{p.discount}%
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>-</span>
                      )}
                    </td>

                    <td style={{ padding: "1rem" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "3px 8px",
                        borderRadius: "var(--radius-full)",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        background: isOut ? "hsla(0, 80%, 58%, 0.15)" : isLow ? "hsla(35, 100%, 55%, 0.15)" : "hsla(145, 60%, 45%, 0.15)",
                        color: isOut ? "var(--clr-danger)" : isLow ? "var(--clr-accent)" : "var(--clr-success)"
                      }}>
                        {isOut ? "Habis (0)" : isLow ? `⚠️ Menipis (${p.stock})` : `Ready (${p.stock})`}
                      </span>
                    </td>

                    <td style={{ padding: "1rem" }}>
                      <button
                        onClick={() => toggleStatus(p.id)}
                        style={{
                          background: p.status === "active" ? "hsla(145, 60%, 45%, 0.15)" : "var(--bg-card)",
                          color: p.status === "active" ? "var(--clr-success)" : "var(--text-muted)",
                          border: "1px solid",
                          borderColor: p.status === "active" ? "var(--clr-success)" : "var(--glass-border)",
                          padding: "2px 8px",
                          borderRadius: "var(--radius-full)",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        {p.status === "active" ? "Aktif" : "Draft (Hidden)"}
                      </button>
                    </td>

                    <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => startEditProduct(p)}
                          style={{
                            background: "var(--bg-card)",
                            border: "1px solid var(--glass-border)",
                            color: "var(--clr-primary)",
                            padding: "4px 10px",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                            fontWeight: 600
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          style={{
                            background: "hsla(0, 80%, 58%, 0.1)",
                            border: "1px solid var(--clr-danger)",
                            color: "#ff8b8b",
                            padding: "4px 10px",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                            fontWeight: 600
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: TAMBAH PRODUK BARU ── */}
      {showAddModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          zIndex: 999
        }}>
          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-xl)",
            width: "100%",
            maxWidth: "880px",
            maxHeight: "92vh",
            overflowY: "auto",
            padding: "2rem",
            boxShadow: "var(--shadow-lg)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-contrast)" }}>
                Tambah Produk Baru ke Katalog
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProduct} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Barcode / SKU dengan Alat Scan Terintegrasi */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-contrast)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span>🏷️</span>
                    <span>Barcode / SKU Unit (Bisa dari Alat Scan)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setScannerMode("hardware");
                      setShowScannerModal(true);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--clr-primary)",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem"
                    }}
                  >
                    <span>📷</span>
                    <span>Buka Scanner Kamera / Alat Scan</span>
                  </button>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    placeholder="Scan atau ketik SKU/Barcode (misal: 8806091234567 atau SKU-ASUS-01)"
                    value={formData.sku || ""}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    style={{
                      flex: 1,
                      padding: "0.65rem 0.9rem",
                      background: "var(--bg-card)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-contrast)",
                      fontFamily: "monospace",
                      fontWeight: 600,
                      outline: "none",
                      fontSize: "0.85rem"
                    }}
                  />
                  {formData.sku && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, sku: "" })}
                      className="btn-outline"
                      style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem" }}
                      title="Reset Barcode"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  💡 Arahkan barcode scanner USB/Bluetooth ke barcode dus laptop atau tekan tombol scanner kamera di kanan atas.
                </p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                  Nama Perangkat / Laptop
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Acer Nitro 16 AMD Ryzen 7"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.9rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-contrast)",
                    outline: "none",
                    fontSize: "0.85rem"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Brand Resmi
                  </label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.9rem",
                      background: "var(--bg-card)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-contrast)",
                      outline: "none",
                      fontSize: "0.85rem"
                    }}
                  >
                    {availableBrands.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Kategori Katalog
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.9rem",
                      background: "var(--bg-card)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-contrast)",
                      outline: "none",
                      fontSize: "0.85rem"
                    }}
                  >
                    <option value="gaming">Laptop Gaming</option>
                    <option value="kerja">Kerja & Bisnis</option>
                    <option value="ultrabook">Ultrabook Tipis</option>
                    <option value="pc">PC & Desktop</option>
                    <option value="aksesoris">Aksesoris</option>
                  </select>
                </div>
              </div>

              {/* ── FINANSIAL: HARGA JUAL, HARGA MODAL, DISKON, STOK ── */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "1rem" }}>
                {/* Harga Jual */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-contrast)", marginBottom: "0.3rem" }}>
                    Harga Jual (Rp) <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <span style={{
                      position: "absolute",
                      left: "0.75rem",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "var(--clr-primary)",
                      pointerEvents: "none"
                    }}>
                      Rp
                    </span>
                    <input
                      type="text"
                      placeholder="15.000.000"
                      value={formatRupiahInput(formData.price)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        setFormData({ ...formData, price: raw ? parseInt(raw, 10) : "" });
                      }}
                      required
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.9rem 0.65rem 2.5rem",
                        background: "var(--bg-card)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--text-contrast)",
                        outline: "none",
                        fontSize: "0.85rem",
                        fontWeight: 700
                      }}
                    />
                  </div>
                  {formData.price > 0 && (
                    <div style={{ fontSize: "0.72rem", color: "var(--clr-primary)", marginTop: "3px", fontWeight: 600 }}>
                      {formatRupiah(formData.price)}
                    </div>
                  )}
                </div>

                {/* Harga Modal / HPP */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-contrast)", marginBottom: "0.3rem" }}>
                    Harga Modal / HPP (Rp)
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <span style={{
                      position: "absolute",
                      left: "0.75rem",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "#10b981",
                      pointerEvents: "none"
                    }}>
                      Rp
                    </span>
                    <input
                      type="text"
                      placeholder="Misal: 12.000.000"
                      value={formatRupiahInput(formData.cost_price)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        setFormData({ ...formData, cost_price: raw ? parseInt(raw, 10) : "" });
                      }}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.9rem 0.65rem 2.5rem",
                        background: "var(--bg-card)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--text-contrast)",
                        outline: "none",
                        fontSize: "0.85rem",
                        fontWeight: 700
                      }}
                    />
                  </div>
                  {formData.cost_price > 0 && (
                    <div style={{ fontSize: "0.72rem", color: "#10b981", marginTop: "3px", fontWeight: 600 }}>
                      {formatRupiah(formData.cost_price)}
                    </div>
                  )}
                </div>

                {/* Diskon */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Diskon (%)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.9rem",
                      background: "var(--bg-card)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-contrast)",
                      outline: "none",
                      fontSize: "0.85rem"
                    }}
                  />
                </div>

                {/* Stok Unit */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Stok Unit
                  </label>
                  <input
                    type="number"
                    placeholder="10"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.9rem",
                      background: "var(--bg-card)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-contrast)",
                      outline: "none",
                      fontSize: "0.85rem"
                    }}
                  />
                </div>
              </div>

              {/* ── PENGATURAN PAJAK (PPN) ── OPSI / MANUAL ── */}
              <div style={{
                background: "rgba(59, 130, 246, 0.04)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                borderRadius: "var(--radius-md)",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-contrast)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span>🏛️</span>
                    <span>Pajak Produk (PPN)</span>
                  </label>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    Pilih opsi standar atau ketik manual persentase tarif pajak
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", alignItems: "flex-end" }}>
                  {/* Dropdown Opsi Pajak */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                      Opsi / Pilihan Pajak:
                    </label>
                    <select
                      value={formData.tax_option}
                      onChange={(e) => {
                        const opt = e.target.value;
                        let rate = formData.tax_rate;
                        if (opt === "none") rate = "0";
                        else if (opt === "ppn11") rate = "11";
                        else if (opt === "ppn12") rate = "12";
                        else if (opt === "manual" && (rate === "0" || rate === "11" || rate === "12")) rate = "10";
                        setFormData({ ...formData, tax_option: opt, tax_rate: rate });
                      }}
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.8rem",
                        background: "var(--bg-card)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--text-contrast)",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        outline: "none",
                        cursor: "pointer"
                      }}
                    >
                      <option value="none">🚫 Bebas Pajak / Non-PPN (0%)</option>
                      <option value="ppn11">⭐ PPN 11% (Standar Nasional)</option>
                      <option value="ppn12">📈 PPN 12% (Tarif UU HPP)</option>
                      <option value="manual">✏️ Input Manual (%)</option>
                    </select>
                  </div>

                  {/* Input Manual Kolom (Muncul jika manual dipilih) */}
                  {formData.tax_option === "manual" && (
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                        Tarif Pajak Manual (%):
                      </label>
                      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          placeholder="10"
                          value={formData.tax_rate}
                          onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "0.6rem 2rem 0.6rem 0.8rem",
                            background: "var(--bg-card)",
                            border: "1px solid var(--clr-primary)",
                            borderRadius: "var(--radius-md)",
                            color: "var(--text-contrast)",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            outline: "none"
                          }}
                        />
                        <span style={{ position: "absolute", right: "0.75rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)" }}>
                          %
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Perlakuan Pajak (Inclusive vs Exclusive) */}
                  {formData.tax_option !== "none" && (
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                        Perlakuan Pembebanan:
                      </label>
                      <select
                        value={formData.tax_type}
                        onChange={(e) => setFormData({ ...formData, tax_type: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "0.6rem 0.8rem",
                          background: "var(--bg-card)",
                          border: "1px solid var(--glass-border)",
                          borderRadius: "var(--radius-md)",
                          color: "var(--text-contrast)",
                          fontSize: "0.82rem",
                          outline: "none",
                          cursor: "pointer"
                        }}
                      >
                        <option value="inclusive">Sudah Termasuk Pajak (Inclusive)</option>
                        <option value="exclusive">Ditambahkan di Atas Harga (Exclusive)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Live Margin & Profit Preview Box */}
                {(formData.price > 0 || formData.cost_price > 0) && (() => {
                  const m = calculateMargin(formData.price, formData.cost_price, formData.tax_rate, formData.tax_type);
                  return (
                    <div style={{
                      background: m.isLoss ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.08)",
                      border: `1px solid ${m.isLoss ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
                      borderRadius: "var(--radius-md)",
                      padding: "0.75rem 1rem",
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      marginTop: "0.35rem"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                        <div>
                          <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.7rem" }}>Harga Jual Bersih:</span>
                          <strong style={{ color: "var(--text-contrast)", fontSize: "0.85rem" }}>{formatRupiah(m.netPrice)}</strong>
                        </div>
                        {m.taxAmount > 0 && (
                          <div>
                            <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.7rem" }}>
                              Pajak ({formData.tax_rate}% {formData.tax_type === "inclusive" ? "Inc" : "Exc"}):
                            </span>
                            <strong style={{ color: "#f59e0b", fontSize: "0.85rem" }}>+{formatRupiah(m.taxAmount)}</strong>
                          </div>
                        )}
                        {m.hasCost && (
                          <div>
                            <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.7rem" }}>Harga Modal (HPP):</span>
                            <strong style={{ color: "#64748b", fontSize: "0.85rem" }}>{formatRupiah(formData.cost_price)}</strong>
                          </div>
                        )}
                      </div>

                      {m.hasCost && (
                        <div style={{ textAlign: "right" }}>
                          <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.7rem" }}>
                            {m.isLoss ? "⚠️ Estimasi Rugi:" : "💰 Estimasi Laba Bersih:"}
                          </span>
                          <strong style={{ color: m.isLoss ? "#ef4444" : "#10b981", fontSize: "0.95rem" }}>
                            {m.profit >= 0 ? "+" : ""}{formatRupiah(m.profit)} ({m.marginPercent.toFixed(1)}%)
                          </strong>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                  Ringkasan Spesifikasi (CPU, GPU, RAM, Storage)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Ryzen 7 7840HS, RTX 4060 8GB, 16GB DDR5, 1TB SSD"
                  value={formData.specs}
                  onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.9rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-contrast)",
                    outline: "none",
                    fontSize: "0.85rem"
                  }}
                />
              </div>

              {/* ── FITUR UNGGAH BEBERAPA GAMBAR (ADD) ── */}
              <div style={{
                background: "var(--bg-card)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-md)",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-contrast)" }}>
                    📸 Galeri Gambar Produk ({addImages.length} Foto)
                  </label>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Foto #1 otomatis jadi Sampul
                  </span>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <label style={{
                    flex: 1,
                    minWidth: "200px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1rem",
                    background: "hsla(220, 90%, 56%, 0.1)",
                    border: "1px dashed var(--clr-primary)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--clr-primary)",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: uploadingAdd ? "not-allowed" : "pointer"
                  }}>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      disabled={uploadingAdd}
                      style={{ display: "none" }}
                      onChange={(e) => {
                        if (e.target.files) {
                          handleUploadFiles(e.target.files, setAddImages, setUploadingAdd);
                          e.target.value = "";
                        }
                      }}
                    />
                    <span>{uploadingAdd ? "⏳ Sedang mengunggah foto..." : "📁 Pilih Foto dari Laptop (Bisa Sekaligus Banyak)"}</span>
                  </label>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="url"
                    placeholder="Atau masukkan link gambar web (https://...)"
                    value={addUrlInput}
                    onChange={(e) => setAddUrlInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "0.5rem 0.75rem",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-contrast)",
                      fontSize: "0.8rem",
                      outline: "none"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (addUrlInput.trim()) {
                        setAddImages((prev) => [...prev, addUrlInput.trim()]);
                        setAddUrlInput("");
                      }
                    }}
                    style={{
                      padding: "0.5rem 0.9rem",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--glass-border)",
                      color: "var(--text-contrast)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    + Tambah URL
                  </button>
                </div>

                {addImages.length > 0 && (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                    gap: "0.6rem",
                    marginTop: "0.5rem"
                  }}>
                    {addImages.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: "relative",
                          background: "var(--bg-surface)",
                          border: idx === 0 ? "2px solid var(--clr-primary)" : "1px solid var(--glass-border)",
                          borderRadius: "var(--radius-md)",
                          overflow: "hidden"
                        }}
                      >
                        {idx === 0 && (
                          <span style={{
                            position: "absolute",
                            top: "4px",
                            left: "4px",
                            background: "var(--clr-primary)",
                            color: "#fff",
                            fontSize: "0.62rem",
                            fontWeight: 800,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            zIndex: 2
                          }}>
                            ⭐ SAMPUL
                          </span>
                        )}

                        <img
                          src={imgUrl}
                          alt={`Foto ${idx + 1}`}
                          style={{
                            width: "100%",
                            height: "80px",
                            objectFit: "cover",
                            display: "block"
                          }}
                        />

                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "4px 6px",
                          background: "rgba(0,0,0,0.65)"
                        }}>
                          <div style={{ display: "flex", gap: "2px" }}>
                            {idx > 0 && (
                              <button
                                type="button"
                                title="Jadikan Sampul"
                                onClick={() => handleSetCover(idx, setAddImages)}
                                style={{ background: "transparent", border: "none", color: "#facc15", fontSize: "0.75rem", cursor: "pointer", padding: "2px" }}
                              >
                                ⭐
                              </button>
                            )}
                            {idx > 0 && (
                              <button
                                type="button"
                                title="Pindah ke Kiri"
                                onClick={() => handleMoveImg(idx, -1, setAddImages)}
                                style={{ background: "transparent", border: "none", color: "#fff", fontSize: "0.7rem", cursor: "pointer", padding: "2px" }}
                              >
                                ◀
                              </button>
                            )}
                            {idx < addImages.length - 1 && (
                              <button
                                type="button"
                                title="Pindah ke Kanan"
                                onClick={() => handleMoveImg(idx, 1, setAddImages)}
                                style={{ background: "transparent", border: "none", color: "#fff", fontSize: "0.7rem", cursor: "pointer", padding: "2px" }}
                              >
                                ▶
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            title="Hapus Foto"
                            onClick={() => handleRemoveImg(idx, setAddImages)}
                            style={{ background: "transparent", border: "none", color: "#ff6b6b", fontSize: "0.8rem", cursor: "pointer", padding: "2px" }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: "0.75rem" }}>
                  Simpan & Tayangkan Produk
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-outline"
                  style={{ padding: "0.75rem 1.25rem" }}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT PRODUK ── */}
      {editProduct && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          zIndex: 999
        }}>
          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-xl)",
            width: "100%",
            maxWidth: "880px",
            maxHeight: "92vh",
            overflowY: "auto",
            padding: "2rem",
            boxShadow: "var(--shadow-lg)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-contrast)" }}>
                  Edit Data Produk Katalog
                </h2>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  ID: <span style={{ fontFamily: "monospace" }}>{editProduct.id}</span>
                </p>
              </div>
              <button
                onClick={() => setEditProduct(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                  Nama Perangkat / Laptop
                </label>
                <input
                  type="text"
                  value={editProduct.name || ""}
                  onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.9rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-contrast)",
                    outline: "none",
                    fontSize: "0.85rem"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Brand Resmi
                  </label>
                  <select
                    value={editProduct.brand || "ASUS"}
                    onChange={(e) => setEditProduct({ ...editProduct, brand: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.9rem",
                      background: "var(--bg-card)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-contrast)",
                      outline: "none",
                      fontSize: "0.85rem"
                    }}
                  >
                    {availableBrands.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Kategori Katalog
                  </label>
                  <select
                    value={editProduct.category || "gaming"}
                    onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.9rem",
                      background: "var(--bg-card)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-contrast)",
                      outline: "none",
                      fontSize: "0.85rem"
                    }}
                  >
                    <option value="gaming">Laptop Gaming</option>
                    <option value="kerja">Kerja & Bisnis</option>
                    <option value="ultrabook">Ultrabook Tipis</option>
                    <option value="pc">PC & Desktop</option>
                    <option value="aksesoris">Aksesoris</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "1rem" }}>
                {/* Harga Jual */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Harga Jual (Rp) *
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <span style={{
                      position: "absolute",
                      left: "0.75rem",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "var(--clr-primary)",
                      pointerEvents: "none"
                    }}>
                      Rp
                    </span>
                    <input
                      type="text"
                      placeholder="15.000.000"
                      value={formatRupiahInput(editProduct.price)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        setEditProduct({ ...editProduct, price: raw ? parseInt(raw, 10) : 0 });
                      }}
                      required
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.9rem 0.65rem 2.5rem",
                        background: "var(--bg-card)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--text-contrast)",
                        outline: "none",
                        fontSize: "0.85rem",
                        fontWeight: 700
                      }}
                    />
                  </div>
                  {editProduct.price > 0 && (
                    <div style={{ fontSize: "0.72rem", color: "var(--clr-primary)", marginTop: "3px", fontWeight: 600 }}>
                      {formatRupiah(editProduct.price)}
                    </div>
                  )}
                </div>

                {/* Harga Modal / HPP */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Harga Modal / HPP (Rp)
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <span style={{
                      position: "absolute",
                      left: "0.75rem",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "#10b981",
                      pointerEvents: "none"
                    }}>
                      Rp
                    </span>
                    <input
                      type="text"
                      placeholder="Misal: 12.000.000"
                      value={formatRupiahInput(editProduct.cost_price)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        setEditProduct({ ...editProduct, cost_price: raw ? parseInt(raw, 10) : "" });
                      }}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.9rem 0.65rem 2.5rem",
                        background: "var(--bg-card)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--text-contrast)",
                        outline: "none",
                        fontSize: "0.85rem",
                        fontWeight: 700
                      }}
                    />
                  </div>
                  {editProduct.cost_price > 0 && (
                    <div style={{ fontSize: "0.72rem", color: "#10b981", marginTop: "3px", fontWeight: 600 }}>
                      {formatRupiah(editProduct.cost_price)}
                    </div>
                  )}
                </div>

                {/* Diskon */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Diskon (%)
                  </label>
                  <input
                    type="number"
                    value={editProduct.discount !== undefined ? editProduct.discount : 0}
                    onChange={(e) => setEditProduct({ ...editProduct, discount: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.9rem",
                      background: "var(--bg-card)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-contrast)",
                      outline: "none",
                      fontSize: "0.85rem"
                    }}
                  />
                </div>

                {/* Stok Unit */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Stok Unit
                  </label>
                  <input
                    type="number"
                    value={editProduct.stock !== undefined ? editProduct.stock : 0}
                    onChange={(e) => setEditProduct({ ...editProduct, stock: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.9rem",
                      background: "var(--bg-card)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-contrast)",
                      outline: "none",
                      fontSize: "0.85rem"
                    }}
                  />
                </div>
              </div>

              {/* ── PENGATURAN PAJAK (PPN) ── OPSI / MANUAL (EDIT) ── */}
              <div style={{
                background: "rgba(59, 130, 246, 0.04)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                borderRadius: "var(--radius-md)",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-contrast)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span>🏛️</span>
                    <span>Pajak Produk (PPN)</span>
                  </label>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    Pilih opsi standar atau ketik manual persentase tarif pajak
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", alignItems: "flex-end" }}>
                  {/* Dropdown Opsi Pajak */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                      Opsi / Pilihan Pajak:
                    </label>
                    <select
                      value={editProduct.tax_option || "none"}
                      onChange={(e) => {
                        const opt = e.target.value;
                        let rate = editProduct.tax_rate;
                        if (opt === "none") rate = "0";
                        else if (opt === "ppn11") rate = "11";
                        else if (opt === "ppn12") rate = "12";
                        else if (opt === "manual" && (rate === "0" || rate === "11" || rate === "12")) rate = "10";
                        setEditProduct({ ...editProduct, tax_option: opt, tax_rate: rate });
                      }}
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.8rem",
                        background: "var(--bg-card)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--text-contrast)",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        outline: "none",
                        cursor: "pointer"
                      }}
                    >
                      <option value="none">🚫 Bebas Pajak / Non-PPN (0%)</option>
                      <option value="ppn11">⭐ PPN 11% (Standar Nasional)</option>
                      <option value="ppn12">📈 PPN 12% (Tarif UU HPP)</option>
                      <option value="manual">✏️ Input Manual (%)</option>
                    </select>
                  </div>

                  {/* Input Manual Kolom (Muncul jika manual dipilih) */}
                  {editProduct.tax_option === "manual" && (
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                        Tarif Pajak Manual (%):
                      </label>
                      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          placeholder="10"
                          value={editProduct.tax_rate || ""}
                          onChange={(e) => setEditProduct({ ...editProduct, tax_rate: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "0.6rem 2rem 0.6rem 0.8rem",
                            background: "var(--bg-card)",
                            border: "1px solid var(--clr-primary)",
                            borderRadius: "var(--radius-md)",
                            color: "var(--text-contrast)",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            outline: "none"
                          }}
                        />
                        <span style={{ position: "absolute", right: "0.75rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)" }}>
                          %
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Perlakuan Pajak (Inclusive vs Exclusive) */}
                  {editProduct.tax_option !== "none" && (
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                        Perlakuan Pembebanan:
                      </label>
                      <select
                        value={editProduct.tax_type || "inclusive"}
                        onChange={(e) => setEditProduct({ ...editProduct, tax_type: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "0.6rem 0.8rem",
                          background: "var(--bg-card)",
                          border: "1px solid var(--glass-border)",
                          borderRadius: "var(--radius-md)",
                          color: "var(--text-contrast)",
                          fontSize: "0.82rem",
                          outline: "none",
                          cursor: "pointer"
                        }}
                      >
                        <option value="inclusive">Sudah Termasuk Pajak (Inclusive)</option>
                        <option value="exclusive">Ditambahkan di Atas Harga (Exclusive)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Live Margin & Profit Preview Box */}
                {(editProduct.price > 0 || editProduct.cost_price > 0) && (() => {
                  const m = calculateMargin(editProduct.price, editProduct.cost_price, editProduct.tax_rate, editProduct.tax_type);
                  return (
                    <div style={{
                      background: m.isLoss ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.08)",
                      border: `1px solid ${m.isLoss ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
                      borderRadius: "var(--radius-md)",
                      padding: "0.75rem 1rem",
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      marginTop: "0.35rem"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                        <div>
                          <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.7rem" }}>Harga Jual Bersih:</span>
                          <strong style={{ color: "var(--text-contrast)", fontSize: "0.85rem" }}>{formatRupiah(m.netPrice)}</strong>
                        </div>
                        {m.taxAmount > 0 && (
                          <div>
                            <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.7rem" }}>
                              Pajak ({editProduct.tax_rate}% {editProduct.tax_type === "inclusive" ? "Inc" : "Exc"}):
                            </span>
                            <strong style={{ color: "#f59e0b", fontSize: "0.85rem" }}>+{formatRupiah(m.taxAmount)}</strong>
                          </div>
                        )}
                        {m.hasCost && (
                          <div>
                            <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.7rem" }}>Harga Modal (HPP):</span>
                            <strong style={{ color: "#64748b", fontSize: "0.85rem" }}>{formatRupiah(editProduct.cost_price)}</strong>
                          </div>
                        )}
                      </div>

                      {m.hasCost && (
                        <div style={{ textAlign: "right" }}>
                          <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.7rem" }}>
                            {m.isLoss ? "⚠️ Estimasi Rugi:" : "💰 Estimasi Laba Bersih:"}
                          </span>
                          <strong style={{ color: m.isLoss ? "#ef4444" : "#10b981", fontSize: "0.95rem" }}>
                            {m.profit >= 0 ? "+" : ""}{formatRupiah(m.profit)} ({m.marginPercent.toFixed(1)}%)
                          </strong>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                  Ringkasan Spesifikasi (CPU, GPU, RAM, Storage)
                </label>
                <input
                  type="text"
                  value={editProduct.specs || ""}
                  onChange={(e) => setEditProduct({ ...editProduct, specs: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.9rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-contrast)",
                    outline: "none",
                    fontSize: "0.85rem"
                  }}
                />
              </div>

              {/* ── FITUR UNGGAH & EDIT BEBERAPA GAMBAR (EDIT) ── */}
              <div style={{
                background: "var(--bg-card)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-md)",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-contrast)" }}>
                    📸 Galeri Gambar Produk ({editImages.length} Foto)
                  </label>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Foto #1 otomatis jadi Sampul
                  </span>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <label style={{
                    flex: 1,
                    minWidth: "200px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1rem",
                    background: "hsla(220, 90%, 56%, 0.1)",
                    border: "1px dashed var(--clr-primary)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--clr-primary)",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: uploadingEdit ? "not-allowed" : "pointer"
                  }}>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      disabled={uploadingEdit}
                      style={{ display: "none" }}
                      onChange={(e) => {
                        if (e.target.files) {
                          handleUploadFiles(e.target.files, setEditImages, setUploadingEdit);
                          e.target.value = "";
                        }
                      }}
                    />
                    <span>{uploadingEdit ? "⏳ Sedang mengunggah foto..." : "📁 Tambah Foto Baru dari Laptop (Multi-file)"}</span>
                  </label>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="url"
                    placeholder="Atau masukkan URL gambar web (https://...)"
                    value={editUrlInput}
                    onChange={(e) => setEditUrlInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "0.5rem 0.75rem",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-contrast)",
                      fontSize: "0.8rem",
                      outline: "none"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (editUrlInput.trim()) {
                        setEditImages((prev) => [...prev, editUrlInput.trim()]);
                        setEditUrlInput("");
                      }
                    }}
                    style={{
                      padding: "0.5rem 0.9rem",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--glass-border)",
                      color: "var(--text-contrast)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    + Tambah URL
                  </button>
                </div>

                {editImages.length > 0 && (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                    gap: "0.6rem",
                    marginTop: "0.5rem"
                  }}>
                    {editImages.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: "relative",
                          background: "var(--bg-surface)",
                          border: idx === 0 ? "2px solid var(--clr-primary)" : "1px solid var(--glass-border)",
                          borderRadius: "var(--radius-md)",
                          overflow: "hidden"
                        }}
                      >
                        {idx === 0 && (
                          <span style={{
                            position: "absolute",
                            top: "4px",
                            left: "4px",
                            background: "var(--clr-primary)",
                            color: "#fff",
                            fontSize: "0.62rem",
                            fontWeight: 800,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            zIndex: 2
                          }}>
                            ⭐ SAMPUL
                          </span>
                        )}

                        <img
                          src={imgUrl}
                          alt={`Foto ${idx + 1}`}
                          style={{
                            width: "100%",
                            height: "80px",
                            objectFit: "cover",
                            display: "block"
                          }}
                        />

                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "4px 6px",
                          background: "rgba(0,0,0,0.65)"
                        }}>
                          <div style={{ display: "flex", gap: "2px" }}>
                            {idx > 0 && (
                              <button
                                type="button"
                                title="Jadikan Sampul"
                                onClick={() => handleSetCover(idx, setEditImages)}
                                style={{ background: "transparent", border: "none", color: "#facc15", fontSize: "0.75rem", cursor: "pointer", padding: "2px" }}
                              >
                                ⭐
                              </button>
                            )}
                            {idx > 0 && (
                              <button
                                type="button"
                                title="Pindah ke Kiri"
                                onClick={() => handleMoveImg(idx, -1, setEditImages)}
                                style={{ background: "transparent", border: "none", color: "#fff", fontSize: "0.7rem", cursor: "pointer", padding: "2px" }}
                              >
                                ◀
                              </button>
                            )}
                            {idx < editImages.length - 1 && (
                              <button
                                type="button"
                                title="Pindah ke Kanan"
                                onClick={() => handleMoveImg(idx, 1, setEditImages)}
                                style={{ background: "transparent", border: "none", color: "#fff", fontSize: "0.7rem", cursor: "pointer", padding: "2px" }}
                              >
                                ▶
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            title="Hapus Foto"
                            onClick={() => handleRemoveImg(idx, setEditImages)}
                            style={{ background: "transparent", border: "none", color: "#ff6b6b", fontSize: "0.8rem", cursor: "pointer", padding: "2px" }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: "0.75rem" }}>
                  Simpan Perubahan
                </button>
                <button
                  type="button"
                  onClick={() => setEditProduct(null)}
                  className="btn-outline"
                  style={{ padding: "0.75rem 1.25rem" }}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL ALAT SCAN BARCODE & KAMERA SCANNER ── */}
      {showScannerModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          zIndex: 1000
        }}>
          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-xl)",
            width: "100%",
            maxWidth: "600px",
            maxHeight: "92vh",
            overflowY: "auto",
            padding: "1.75rem",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            position: "relative"
          }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "1.3rem" }}>📷</span>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-contrast)" }}>
                    Alat Scan Barcode / QR Produk
                  </h2>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Gunakan barcode scanner genggam (USB/Bluetooth HID) atau kamera perangkat untuk upload & lookup produk.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowScannerModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.3rem", cursor: "pointer", padding: "0.2rem" }}
              >
                ✕
              </button>
            </div>

            {/* Banner Otorisasi / Siapa yang boleh Upload Produk */}
            <div style={{
              background: "hsla(220, 90%, 56%, 0.08)",
              border: "1px solid hsla(220, 90%, 56%, 0.25)",
              borderRadius: "var(--radius-md)",
              padding: "0.75rem 1rem",
              marginBottom: "1.25rem",
              display: "flex",
              gap: "0.65rem",
              alignItems: "flex-start"
            }}>
              <span style={{ fontSize: "1.1rem" }}>🛡️</span>
              <div style={{ fontSize: "0.78rem", lineHeight: 1.45, color: "var(--text-secondary)" }}>
                <strong style={{ color: "var(--clr-primary)" }}>Hak Akses Upload Produk (RBAC Policy):</strong>
                <ul style={{ margin: "4px 0 0 1rem", padding: 0 }}>
                  <li><strong>Super Admin & Owner:</strong> Memiliki wewenang penuh membuat produk baru ke katalog (<code>products.create</code>).</li>
                  <li><strong>Staf Gudang:</strong> Berwenang memindai serial/nomor seri unit & penerimaan barang (<code>serials.manage</code>).</li>
                  <li><strong>Kasir & Pelanggan:</strong> Tidak memiliki izin menambah/upload produk ke inventori toko.</li>
                </ul>
                {currentUser && (
                  <div style={{ marginTop: "4px", fontSize: "0.74rem" }}>
                    Status Akun Login: <strong>{currentUser.name}</strong> ({currentUser.roleName || currentUser.role}) - {
                      (currentUser.isSuperAdmin || currentUser.isOwner || currentUser.permissionSlugs?.includes('products.create'))
                        ? <span style={{ color: "#10b981", fontWeight: 700 }}>✅ Berwenang Upload Produk</span>
                        : <span style={{ color: "#f59e0b", fontWeight: 700 }}>⚠️ Terbatas / Hanya Baca</span>
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Mode Switch: Hardware Scanner vs Kamera */}
            <div style={{
              display: "flex",
              background: "var(--bg-card)",
              padding: "4px",
              borderRadius: "var(--radius-md)",
              marginBottom: "1.25rem",
              border: "1px solid var(--glass-border)"
            }}>
              <button
                type="button"
                onClick={() => setScannerMode("hardware")}
                style={{
                  flex: 1,
                  padding: "0.55rem",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  border: "none",
                  borderRadius: "calc(var(--radius-md) - 2px)",
                  background: scannerMode === "hardware" ? "var(--clr-primary)" : "transparent",
                  color: scannerMode === "hardware" ? "#fff" : "var(--text-secondary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem"
                }}
              >
                <span>🔫</span>
                <span>Alat Scan Fisik (USB / BT)</span>
              </button>
              <button
                type="button"
                onClick={() => setScannerMode("camera")}
                style={{
                  flex: 1,
                  padding: "0.55rem",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  border: "none",
                  borderRadius: "calc(var(--radius-md) - 2px)",
                  background: scannerMode === "camera" ? "var(--clr-primary)" : "transparent",
                  color: scannerMode === "camera" ? "#fff" : "var(--text-secondary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem"
                }}
              >
                <span>📱</span>
                <span>Kamera Webcam Browser</span>
              </button>
            </div>

            {/* MODE 1: Hardware Barcode Scanner (USB / Bluetooth Handheld) */}
            {scannerMode === "hardware" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{
                  padding: "1rem",
                  background: "var(--bg-card)",
                  border: "2px dashed var(--clr-primary)",
                  borderRadius: "var(--radius-lg)",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚡</div>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-contrast)" }}>
                    Siap Menerima Input dari Alat Scan
                  </h3>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", maxWidth: "420px", margin: "0.3rem auto 1rem" }}>
                    Arahkan scanner barcode fisik Anda ke kode barcode dus laptop / label unit. Alat scan akan otomatis menembak dan menekan Enter.
                  </p>

                  <div style={{ maxWidth: "380px", margin: "0 auto" }}>
                    <input
                      ref={scanInputRef}
                      type="text"
                      autoFocus
                      placeholder="Fokus aktif! Tembak barcode di sini..."
                      value={scanInputVal}
                      onChange={(e) => setScanInputVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyBarcode(scanInputVal);
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        background: "var(--bg-surface)",
                        border: "2px solid var(--clr-primary)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--text-contrast)",
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        fontFamily: "monospace",
                        textAlign: "center",
                        boxShadow: "0 0 0 3px hsla(220, 90%, 56%, 0.2)",
                        outline: "none"
                      }}
                    />
                  </div>

                  <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => handleApplyBarcode(scanInputVal)}
                      disabled={!scanInputVal.trim()}
                      className="btn-primary"
                      style={{ padding: "0.6rem 1.5rem", fontSize: "0.85rem", opacity: scanInputVal.trim() ? 1 : 0.5 }}
                    >
                      Proses Kode Barcode
                    </button>
                    {scanInputVal && (
                      <button
                        type="button"
                        onClick={() => setScanInputVal("")}
                        className="btn-outline"
                        style={{ padding: "0.6rem 1rem", fontSize: "0.85rem" }}
                      >
                        Bersihkan
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* MODE 2: Camera Scanner */}
            {scannerMode === "camera" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "4/3",
                  background: "#000",
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />

                  {/* Laser Scan Animation Line */}
                  <div style={{
                    position: "absolute",
                    inset: "15%",
                    border: "2px solid rgba(59, 130, 246, 0.8)",
                    borderRadius: "8px",
                    boxShadow: "0 0 20px rgba(59, 130, 246, 0.4)",
                    pointerEvents: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <div style={{
                      width: "100%",
                      height: "2px",
                      background: "#ef4444",
                      boxShadow: "0 0 8px #ef4444",
                      animation: "scanPulse 1.8s infinite ease-in-out"
                    }} />
                  </div>

                  {!cameraActive && (
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.85)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "1rem",
                      textAlign: "center"
                    }}>
                      <span style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📷</span>
                      <p style={{ fontSize: "0.85rem", color: "#fff", fontWeight: 600 }}>
                        Mengakses kamera webcam...
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                        Izinkan browser mengakses kamera jika muncul notifikasi izin.
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    placeholder="Atau ketik hasil scan manual di sini..."
                    value={scanInputVal}
                    onChange={(e) => setScanInputVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApplyBarcode(scanInputVal);
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: "0.65rem 0.9rem",
                      background: "var(--bg-card)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-contrast)",
                      fontSize: "0.85rem",
                      fontFamily: "monospace"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyBarcode(scanInputVal)}
                    disabled={!scanInputVal.trim()}
                    className="btn-primary"
                    style={{ padding: "0.65rem 1.25rem", fontSize: "0.85rem" }}
                  >
                    Simpan Scan
                  </button>
                </div>
              </div>
            )}

            {/* Riwayat Scan Terakhir */}
            {scanHistory.length > 0 && (
              <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--glass-border)" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                  🕒 Riwayat Scan Sesi Ini:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {scanHistory.map((code, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyBarcode(code)}
                      style={{
                        padding: "3px 8px",
                        fontSize: "0.72rem",
                        fontFamily: "monospace",
                        background: "var(--bg-card)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "4px",
                        color: "var(--text-contrast)",
                        cursor: "pointer"
                      }}
                      title="Klik untuk gunakan kode ini"
                    >
                      🏷️ {code}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
