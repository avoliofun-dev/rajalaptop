// app/api/upload/route.js
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files");
    const singleFile = formData.get("file");
    const allFiles = files.length > 0 ? files : (singleFile ? [singleFile] : []);

    if (allFiles.length === 0) {
      return NextResponse.json({ error: "Tidak ada file yang diunggah" }, { status: 400 });
    }

    const folderParam = formData.get("folder");
    const allowedFolders = ["avatars", "logo", "favicon", "topbar", "settings", "products", "heroslider"];
    const targetFolder = allowedFolders.includes(folderParam) ? folderParam : "products";
    const uploadDir = path.join(process.cwd(), "public", "uploads", targetFolder);
    await fs.mkdir(uploadDir, { recursive: true });

    const savedUrls = [];

    for (const file of allFiles) {
      if (typeof file === "string" || !file.name) continue;
      
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = path.extname(file.name) || ".jpg";
      const cleanBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
      const filename = `${Date.now()}-${Math.floor(Math.random() * 1000)}-${cleanBase}${ext}`;
      const filePath = path.join(uploadDir, filename);

      await fs.writeFile(filePath, buffer);
      savedUrls.push(`/uploads/${targetFolder}/${filename}`);
    }

    if (savedUrls.length === 0) {
      return NextResponse.json({ error: "Gagal memproses file unggahan" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      urls: savedUrls,
      url: savedUrls[0],
    });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json({ error: "Gagal mengunggah file: " + error.message }, { status: 500 });
  }
}
