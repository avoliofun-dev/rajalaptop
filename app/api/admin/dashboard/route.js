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

    // 1. Common / Base queries
    const [[baseMetrics]] = await pool.query(`
      SELECT 
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status IN ('Sedang Dikirim', 'Perlu Dikemas', 'Selesai', 'Diproses')) AS total_sales,
        (SELECT COUNT(*) FROM orders WHERE status IN ('Perlu Dikemas', 'Menunggu Bayar', 'Diproses')) AS pending_orders,
        (SELECT COUNT(*) FROM services WHERE stage NOT IN ('Siap Diambil', 'Selesai')) AS active_services,
        (SELECT COUNT(*) FROM products) AS total_products,
        (SELECT COUNT(*) FROM products WHERE stock <= 3) AS low_stock_products,
        (SELECT COUNT(*) FROM approval_requests WHERE status = 'PENDING') AS pending_approvals
    `);

    // 2. Role-specific dashboard payloads
    switch (role) {
      case 'owner': {
        const [[stockVal]] = await pool.query('SELECT COALESCE(SUM(price * stock), 0) as total_stock_value FROM products');
        const [branchSales] = await pool.query(`
          SELECT s.id, s.name, COALESCE(SUM(o.total), 0) as sales_amount, COUNT(o.id) as orders_count
          FROM stores s
          LEFT JOIN orders o ON o.store_id = s.id
          GROUP BY s.id, s.name
        `);
        const [recentAudits] = await pool.query('SELECT id, user_name, role, action, module, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 5');
        const [recentApprovals] = await pool.query('SELECT id, request_type, reason, status, created_at FROM approval_requests ORDER BY created_at DESC LIMIT 5');

        const totalSales = Number(baseMetrics.total_sales);
        const estProfit = Math.round(totalSales * 0.175); // ~17.5% gross margin on laptops

        dashboardData = {
          ...dashboardData,
          metrics: {
            total_sales: totalSales,
            estimated_profit: estProfit,
            total_stock_value: Number(stockVal.total_stock_value),
            pending_approvals: baseMetrics.pending_approvals,
            total_products: baseMetrics.total_products,
            low_stock_products: baseMetrics.low_stock_products,
          },
          branchPerformance: branchSales,
          recentAudits,
          recentApprovals,
        };
        break;
      }

      case 'manajer_area': {
        const allowedStores = Array.from(new Set([...user.storeIds, ...user.areaStoreIds]));
        const storePlaceholder = allowedStores.length ? allowedStores : ['__none__'];

        const [[areaSalesRes]] = await pool.query(
          `SELECT COALESCE(SUM(total), 0) as area_sales, COUNT(*) as area_orders 
           FROM orders WHERE store_id IN (?)`,
          [storePlaceholder]
        );
        const [branchComparison] = await pool.query(
          `SELECT s.id, s.name, COALESCE(SUM(o.total), 0) as sales, COUNT(o.id) as orders
           FROM stores s
           LEFT JOIN orders o ON o.store_id = s.id
           WHERE s.id IN (?)
           GROUP BY s.id, s.name`,
          [storePlaceholder]
        );
        const [areaApprovals] = await pool.query(
          `SELECT ar.*, s.name as store_name FROM approval_requests ar 
           LEFT JOIN stores s ON s.id = ar.store_id 
           WHERE ar.store_id IN (?) AND ar.status = 'PENDING' LIMIT 5`,
          [storePlaceholder]
        );

        dashboardData = {
          ...dashboardData,
          metrics: {
            area_sales: Number(areaSalesRes.area_sales),
            area_orders: Number(areaSalesRes.area_orders),
            assigned_stores_count: allowedStores.length,
            pending_approvals: areaApprovals.length,
          },
          branchComparison,
          pendingApprovals: areaApprovals,
        };
        break;
      }

      case 'kepala_toko': {
        const storeId = user.primaryStoreId || 'store-pekalongan';
        const [[storeSalesRes]] = await pool.query(
          `SELECT COALESCE(SUM(total), 0) as store_sales, COUNT(*) as store_orders 
           FROM orders WHERE store_id = ?`,
          [storeId]
        );
        const [cashierPerformance] = await pool.query(
          `SELECT u.name as cashier_name, COUNT(o.id) as transactions_count, COALESCE(SUM(o.total), 0) as total_amount
           FROM orders o
           INNER JOIN admin_users u ON u.id = o.cashier_id
           WHERE o.store_id = ?
           GROUP BY u.name`,
          [storeId]
        );
        const [storeOrders] = await pool.query('SELECT * FROM orders WHERE store_id = ? ORDER BY created_at DESC LIMIT 5', [storeId]);
        const [storeApprovals] = await pool.query('SELECT * FROM approval_requests WHERE store_id = ? ORDER BY created_at DESC LIMIT 5', [storeId]);

        dashboardData = {
          ...dashboardData,
          storeId,
          metrics: {
            store_sales: Number(storeSalesRes.store_sales),
            store_orders: Number(storeSalesRes.store_orders),
            pending_approvals: storeApprovals.filter(a => a.status === 'PENDING').length,
          },
          cashierPerformance,
          recentOrders: storeOrders,
          storeApprovals,
        };
        break;
      }

      case 'kasir': {
        const storeFilter = user.primaryStoreId || (user.storeIds && user.storeIds[0]) || 'store-pekalongan';
        const [[ownSalesRes]] = await pool.query(
          `SELECT COALESCE(SUM(total), 0) as today_sales, COUNT(*) as today_transactions
           FROM orders 
           WHERE cashier_id = ? OR (cashier_id IS NULL AND store_id = ?)`,
          [user.id, storeFilter]
        );
        const [ownTransactions] = await pool.query(
          `SELECT id, customer, product, total, status, date FROM orders 
           WHERE cashier_id = ? OR (cashier_id IS NULL AND store_id = ?) OR store_id = ?
           ORDER BY created_at DESC LIMIT 10`,
          [user.id, storeFilter, storeFilter]
        );

        dashboardData = {
          ...dashboardData,
          metrics: {
            today_sales: Number(ownSalesRes.today_sales),
            today_transactions: Number(ownSalesRes.today_transactions),
          },
          recentTransactions: ownTransactions,
        };
        break;
      }

      case 'gudang': {
        const [lowStock] = await pool.query('SELECT id, name, brand, stock, price FROM products WHERE stock <= 3 ORDER BY stock ASC LIMIT 8');
        const [recentMovements] = await pool.query('SELECT * FROM stock_movements ORDER BY created_at DESC LIMIT 6');
        const [serialsInStock] = await pool.query(`
          SELECT ps.id, ps.serial_number, p.name as product_name, s.name as store_name
          FROM product_serials ps
          LEFT JOIN products p ON p.id = ps.product_id
          LEFT JOIN stores s ON s.id = ps.current_store_id
          WHERE ps.status = 'IN_STOCK'
          ORDER BY ps.created_at DESC LIMIT 6
        `);
        const [[totSerials]] = await pool.query("SELECT COUNT(*) as c FROM product_serials WHERE status = 'IN_STOCK'");

        dashboardData = {
          ...dashboardData,
          metrics: {
            total_products: baseMetrics.total_products,
            low_stock_products: baseMetrics.low_stock_products,
            serials_in_stock: totSerials.c,
          },
          lowStock,
          recentMovements,
          serialsInStock,
        };
        break;
      }

      case 'finance': {
        const [[expensesRes]] = await pool.query('SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses');
        const totalSales = Number(baseMetrics.total_sales);
        const totalExpenses = Number(expensesRes.total_expenses);
        const netCashFlow = totalSales - totalExpenses;

        const [recentExpenses] = await pool.query('SELECT * FROM expenses ORDER BY date DESC, id DESC LIMIT 5');
        const [purchaseOrders] = await pool.query('SELECT * FROM purchase_orders ORDER BY order_date DESC LIMIT 5');

        dashboardData = {
          ...dashboardData,
          metrics: {
            total_income: totalSales,
            total_expenses: totalExpenses,
            net_cash_flow: netCashFlow,
            pending_orders: baseMetrics.pending_orders,
          },
          recentExpenses,
          purchaseOrders,
        };
        break;
      }

      case 'digital_marketing': {
        const [topProducts] = await pool.query('SELECT id, name, brand, category, price, sold, rating FROM products ORDER BY sold DESC LIMIT 6');
        dashboardData = {
          ...dashboardData,
          metrics: {
            total_products: baseMetrics.total_products,
            total_sales_units: 645,
            campaign_clicks: 14280,
            conversion_rate: '4.8%',
          },
          topProducts,
        };
        break;
      }

      case 'audit': {
        const [recentLogs] = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10');
        const [failedLogs] = await pool.query("SELECT * FROM audit_logs WHERE status != 'SUCCESS' ORDER BY created_at DESC LIMIT 5");
        const [[logCounts]] = await pool.query("SELECT COUNT(*) as total_logs FROM audit_logs");

        dashboardData = {
          ...dashboardData,
          metrics: {
            total_audit_logs: logCounts.total_logs,
            failed_attempts: failedLogs.length,
            pending_approvals: baseMetrics.pending_approvals,
          },
          recentLogs,
          failedLogs,
        };
        break;
      }

      default: {
        // Super Admin default
        const [recentOrders] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC, id DESC LIMIT 5');
        const [lowStock] = await pool.query('SELECT * FROM products WHERE stock <= 3 ORDER BY stock ASC LIMIT 5');
        const [recentServices] = await pool.query('SELECT * FROM services ORDER BY created_at DESC, id DESC LIMIT 5');

        dashboardData = {
          ...dashboardData,
          metrics: baseMetrics,
          recentOrders,
          lowStock,
          recentServices,
        };
        break;
      }
    }

    return NextResponse.json({ success: true, ...dashboardData });
  } catch (error) {
    console.error("GET /api/admin/dashboard error:", error);
    return NextResponse.json({ error: "Gagal memuat data dashboard" }, { status: 500 });
  }
}
