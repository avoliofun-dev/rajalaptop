import { notFound } from "next/navigation";
import { getProductById, getRelatedProducts, getProducts, getSettings } from "@/lib/db";

import Footer from "@/app/components/Footer";
import FloatWA from "@/app/components/FloatWA";
import Toast from "@/app/components/Toast";
import ProductDetailClient from "./ProductDetailClient";

async function resolveProduct(id) {
  const product = await getProductById(id);
  return product;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await resolveProduct(id);
  if (!product) {
    return { title: "Produk Tidak Ditemukan - RajaLaptop" };
  }
  return {
    title: `${product.name} | RajaLaptop Official Store`,
    description: `Beli ${product.name} garansi resmi harga terbaik. ${product.specs}. Kunjungi RajaLaptop pusat komputer terpercaya.`,
  };
}

export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  const product = await resolveProduct(id);

  if (!product) {
    notFound();
  }

  let relatedProducts = await getRelatedProducts(product.category, product.id, 4);
  if (!relatedProducts || relatedProducts.length === 0) {
    // If no related products with same category, get any other products
    const all = await getProducts();
    relatedProducts = (all || []).filter((p) => p.id !== product.id).slice(0, 4);
  }

  const settings = await getSettings();

  return (
    <>

      <main style={{ minHeight: "80vh", padding: "1.5rem 1rem 4rem" }}>
        <ProductDetailClient
          product={product}
          relatedProducts={relatedProducts}
          storeSettings={settings}
        />
      </main>
      <Footer />
      <FloatWA />
      <Toast />
    </>
  );
}
