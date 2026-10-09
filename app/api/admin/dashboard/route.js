// app/api/admin/dashboard/route.js
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { guardApi } from "@/lib/apiGuard";

export async function GET(request) {
  const auth = await guardApi(request, 'dashboard.view', { module: 'DASHBOARD' });
  if (!auth.allowed) return auth.response;

  const user = auth.user;

  try {
    const role = user.role;
    let dashboardData = {
      role,
      roleName: user.roleName,
      userName: user.name,
      primaryStoreId: user.primaryStoreId,
      primaryAreaId: user.primaryAreaId,
      defaultScope: user.defaultScope,
    };

    // Ambil data dashboard real-time dari Supabase
    const { getDashboardData } = await import("@/lib/db");
    const supabaseData = await getDashboardData();

    if (supabaseData) {
      dashboardData = {
        ...dashboardData,
        metrics: supabaseData.metrics,
        recentOrders: supabaseData.recentOrders || [],
        lowStock: supabaseData.lowStock || [],
        recentServices: supabaseData.recentServices || [],
      };
    } else {
      dashboardData = {
        ...dashboardData,
        metrics: {
          total_sales: 0,
          pending_orders: 0,
          active_services: 0,
          total_products: 0,
          low_stock_products: 0,
          total_customers: 0,
          total_suppliers: 0
        },
        recentOrders: [],
        lowStock: [],
        recentServices: []
      };
    }

    return NextResponse.json({ success: true, ...dashboardData });
  } catch (error) {
    console.error("GET /api/admin/dashboard error:", error);
    return NextResponse.json({ error: "Gagal memuat data dashboard" }, { status: 500 });
  }
}
