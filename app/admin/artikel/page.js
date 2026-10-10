"use client";

import { useState, useEffect } from "react";

export default function AdminArtikelPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "Tips & Panduan",
    author: "Tim Editorial",
    readTime: "5 Menit",
    summary: "",
    content: "",
    imageUrl: "",
    is_published: true,
  });

  const loadArticles = async () => {
    try {
      setLoading(true);
      const authRes = await fetch("/api/auth/admin/me", { cache: "no-store" });
      if (authRes.ok) {
        const authData = await authRes.json();
        const user = authData.user;
        const canManage = Boolean(
          user?.isSuperAdmin ||
          user?.isOwner ||
          user?.role === "super_admin" ||
          user?.role === "owner" ||
          user?.role === "digital_marketing" ||
          user?.permissionSlugs?.includes("marketing.create") ||
          user?.permissionSlugs?.includes("marketing.update") ||
          user?.permissionSlugs?.includes("settings.manage")
        );
        setAuthorized(canManage);
        if (!canManage) {
          setLoading(false);
          return;
        }
      } else {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      const res = await fetch("/api/articles");
      if (res.ok) {
        const data = await res.json();
        setArticles(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Gagal memuat artikel:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const openCreateModal = () => {
    setEditingArticle(null);
    setFormData({
      title: "",
      category: "Tips & Panduan",
      author: "Tim Editorial RajaLaptop",
      readTime: "5 Menit",
      summary: "",
      content: "",
      imageUrl: "",
      is_published: true,
    });
    setShowModal(true);
  };

  const openEditModal = (art) => {
    setEditingArticle(art);
    setFormData({
      id: art.id,
      title: art.title || "",
      category: art.category || "Tips & Panduan",
      author: art.author || "Tim Editorial",
      readTime: art.readTime || "5 Menit",
      summary: art.summary || "",
      content: art.content || "",
      imageUrl: art.imageUrl || "",
      is_published: art.is_published !== undefined ? art.is_published : true,
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const body = new FormData();
      body.append("file", file);
      body.append("folder", "heroslider");

      const res = await fetch("/api/upload", {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah gambar artikel");

      setFormData((prev) => ({ ...prev, imageUrl: data.url }));
      alert("Gambar artikel berhasil diunggah!");
    } catch (err) {
      alert("Upload error: " + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const method = editingArticle ? "PUT" : "POST";
    const payload = editingArticle ? { ...formData, id: editingArticle.id } : formData;

    try {
      const res = await fetch("/api/articles", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan artikel");

      alert(`Artikel "${formData.title}" berhasil disimpan!`);
      setShowModal(false);
      await loadArticles();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (art) => {
    if (!confirm(`Hapus artikel "${art.title}"?`)) return;
    try {
      const res = await fetch(`/api/articles?id=${art.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus artikel");
      alert("Artikel berhasil dihapus.");
      await loadArticles();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  if (!authorized) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <h2 style={{ color: "var(--clr-danger)" }}>⛔ Akses Dibatasi</h2>
        <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
          Hanya <strong>Super Admin, Owner, dan Digital Marketing</strong> yang berwenang menulis & mengelola Artikel.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-contrast)" }}>
            📰 Kelola Artikel Edukasi & Review
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Publikasikan tips memilih laptop, panduan servis, dan ulasan gadget terbaru di website.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          style={{
            background: "var(--clr-primary)",
            color: "#fff",
            border: "none",
            padding: "0.65rem 1.25rem",
            borderRadius: "var(--radius-md)",
            fontSize: "0.85rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + Buat Artikel Baru
        </button>
      </div>

      {/* Grid Artikel */}
      {loading ? (
        <div style={{ padding: "2rem", color: "var(--text-muted)" }}>Memuat artikel...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
          {articles.map((art) => (
            <div
              key={art.id}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {art.imageUrl && (
                <div style={{ height: "160px", width: "100%", background: "var(--bg-card)", overflow: "hidden" }}>
                  <img
                    src={art.imageUrl}
                    alt={art.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              )}

              <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.65rem", flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: "4px",
                    background: "rgba(59, 130, 246, 0.15)",
                    color: "var(--clr-primary)",
                  }}>
                    {art.category || "Tips"}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    ⏱️ {art.readTime || "5 Menit"}
                  </span>
                </div>

                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-contrast)", lineHeight: 1.4 }}>
                  {art.title}
                </h3>

                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5, flex: 1 }}>
                  {art.summary}
                </p>

                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  Penulis: <strong>{art.author || "Admin"}</strong>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button
                    onClick={() => openEditModal(art)}
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--bg-card)",
                      border: "1px solid var(--glass-border)",
                      color: "var(--text-contrast)",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(art)}
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      borderRadius: "var(--radius-sm)",
                      background: "hsla(0, 80%, 58%, 0.12)",
                      border: "1px solid var(--clr-danger)",
                      color: "#ff8b8b",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    🗑️ Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-lg)",
              padding: "1.75rem",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "1rem", color: "var(--text-contrast)" }}>
              {editingArticle ? "✏️ Edit Artikel" : "➕ Tulis Artikel Baru"}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Judul Artikel *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: 5 Tips Merawat Laptop Agar Awet Bertahun-tahun"
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.8rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-contrast)",
                    fontSize: "0.85rem",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Kategori
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.8rem",
                      background: "var(--bg-card)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-contrast)",
                      fontSize: "0.85rem",
                    }}
                  >
                    <option value="Tips & Panduan">Tips & Panduan</option>
                    <option value="Review Laptop">Review Laptop</option>
                    <option value="Perawatan & Servis">Perawatan & Servis</option>
                    <option value="Berita Gadget">Berita Gadget</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Penulis
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.8rem",
                      background: "var(--bg-card)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-contrast)",
                      fontSize: "0.85rem",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Gambar Sampul / Banner
                </label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="URL gambar atau unggah file langsung"
                    style={{
                      flex: 1,
                      padding: "0.6rem 0.8rem",
                      background: "var(--bg-card)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-contrast)",
                      fontSize: "0.85rem",
                    }}
                  />
                  <label
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--glass-border)",
                      padding: "0.6rem 0.9rem",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      color: "var(--text-contrast)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {uploadingImage ? "Uploading..." : "📁 Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Ringkasan Singkat (Lead paragraph)
                </label>
                <textarea
                  rows={2}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Ringkasan 1-2 kalimat untuk kartu depan..."
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.8rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-contrast)",
                    fontSize: "0.85rem",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Isi Lengkap Artikel
                </label>
                <textarea
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Tulis artikel lengkap di sini..."
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.8rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-contrast)",
                    fontSize: "0.85rem",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: "0.65rem",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: "0.65rem",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--clr-primary)",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  {saving ? "Menyimpan..." : "Publikasikan Artikel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
