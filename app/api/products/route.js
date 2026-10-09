// app/api/products/route.js
import { NextResponse } from "next/server";
import { getProducts, createProduct, updateProduct, deleteProduct, getProductById } from "@/lib/db";
import { guardApi } from "@/lib/apiGuard";
import { recordAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await guardApi(request, 'products.create', { module: 'PRODUCTS' });
  if (!auth.allowed) return auth.response;

  try {
    const body = await request.json();
    const {
      id = `prod-${Date.now()}`,
      sku,
      name,
      brand = 'ASUS',
      category = 'gaming',
      price,
      cost_price = 0,
      costPrice,
      tax_rate = 0,
      taxRate,
      tax_type = 'none',
      taxType,
      originalPrice = price,
      discount = 0,
      stock = 0,
      status = 'active',
      specs = '',
      emoji = '💻',
      rating = '5.0',
      sold = 0,
      image_url,
      images = [],
    } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Nama produk dan harga wajib diisi' }, { status: 400 });
    }

    const finalCostPrice = costPrice !== undefined ? Number(costPrice) : Number(cost_price) || 0;
    const finalTaxRate = taxRate !== undefined ? Number(taxRate) : Number(tax_rate) || 0;
    const finalTaxType = taxType !== undefined ? taxType : tax_type || 'none';

    const newProduct = await createProduct({
      id,
      sku: sku || `SKU-${Date.now()}`,
      name,
      brand,
      category,
      price,
      cost_price: finalCostPrice,
      tax_rate: finalTaxRate,
      tax_type: finalTaxType,
      originalPrice,
      discount,
      stock,
      status,
      specs,
      emoji,
      rating,
      sold,
      image_url,
      images,
    });

    await recordAuditLog({
      request,
      user: auth.user,
      action: 'CREATE_PRODUCT',
      module: 'PRODUCTS',
      resourceType: 'PRODUCT',
      resourceId: id,
      newValue: { id, name, brand, category, price, stock },
      status: 'SUCCESS',
      details: `Menambahkan produk baru: ${name} (${brand})`,
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    console.error('POST /api/products error:', error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

export async function PUT(request) {
  const auth = await guardApi(request, 'products.update', { module: 'PRODUCTS' });
  if (!auth.allowed) return auth.response;

  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const existing = await getProductById(id);
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const updated = await updateProduct(id, updates);

    await recordAuditLog({
      request,
      user: auth.user,
      action: 'UPDATE_PRODUCT',
      module: 'PRODUCTS',
      resourceType: 'PRODUCT',
      resourceId: id,
      oldValue: { name: existing.name, price: existing.price, stock: existing.stock },
      newValue: updates,
      status: 'SUCCESS',
      details: `Pembaruan produk: ${existing.name}`,
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auth = await guardApi(request, 'products.delete', { module: 'PRODUCTS' });
  if (!auth.allowed) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const existing = await getProductById(id);
    await deleteProduct(id);

    await recordAuditLog({
      request,
      user: auth.user,
      action: 'DELETE_PRODUCT',
      module: 'PRODUCTS',
      resourceType: 'PRODUCT',
      resourceId: id,
      oldValue: existing ? { name: existing.name, brand: existing.brand } : null,
      status: 'SUCCESS',
      details: `Menghapus produk: ${existing ? existing.name : id}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
