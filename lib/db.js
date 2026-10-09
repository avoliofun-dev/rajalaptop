// lib/db.js – Supabase Data Layer & Helpers
const { supabaseAdmin, supabase, isSupabaseConfigured } = require('./supabase');
const bcrypt = require('bcryptjs');

// Helper to format product row
function formatProductRow(row) {
  if (!row) return null;
  let images = [];
  if (row.images) {
    if (Array.isArray(row.images)) {
      images = row.images;
    } else if (typeof row.images === 'string') {
      try {
        const parsed = JSON.parse(row.images);
        if (Array.isArray(parsed)) images = parsed;
        else if (typeof parsed === 'string' && parsed.trim()) images = [parsed.trim()];
      } catch {
        if (row.images.trim()) images = [row.images.trim()];
      }
    }
  }
  if (images.length === 0 && row.image_url) {
    images = [row.image_url];
  }
  const imageUrl = row.image_url || (images.length > 0 ? images[0] : null);

  return {
    ...row,
    price: Number(row.price) || 0,
    original_price: Number(row.original_price || row.originalPrice) || Number(row.price) || 0,
    originalPrice: Number(row.originalPrice || row.original_price) || Number(row.price) || 0,
    discount: Number(row.discount) || 0,
    stock: Number(row.stock) || 0,
    sold: Number(row.sold) || 0,
    cost_price: row.cost_price !== null && row.cost_price !== undefined ? Number(row.cost_price) : 0,
    tax_rate: row.tax_rate !== null && row.tax_rate !== undefined ? Number(row.tax_rate) : 0,
    tax_type: row.tax_type || 'none',
    image_url: imageUrl,
    images: images,
  };
}

// ==========================================
// 1. SETTINGS HELPERS (Supabase)
// ==========================================
async function getSettings() {
  try {
    const { data, error } = await supabaseAdmin.from('settings').select('*');
    if (error || !data || data.length === 0) return null;

    // Check if key-value store
    if (data[0].key !== undefined && data[0].value !== undefined) {
      const obj = {};
      for (const r of data) {
        let val = r.value;
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
          try {
            val = JSON.parse(val);
          } catch {}
        }
        obj[r.key] = val;
      }
      return obj;
    }

    const row = data[0];
    return {
      ...row,
      promoBarActive: Boolean(row.promoBarActive),
      maintenanceMode: Boolean(row.maintenanceMode),
    };
  } catch (error) {
    console.error('getSettings Supabase error:', error.message);
    return null;
  }
}

async function updateSettings(newSettings) {
  try {
    const current = (await getSettings()) || {};
    const updated = { ...current, ...newSettings };

    for (const [k, v] of Object.entries(updated)) {
      const valStr =
        typeof v === 'boolean'
          ? v
            ? 'true'
            : 'false'
          : typeof v === 'object' && v !== null
          ? JSON.stringify(v)
          : String(v ?? '');

      await supabaseAdmin.from('settings').upsert(
        { key: k, value: valStr },
        { onConflict: 'key' }
      );
    }
    return await getSettings();
  } catch (error) {
    console.error('updateSettings Supabase error:', error.message);
    return newSettings;
  }
}

// ==========================================
// 2. PRODUCTS HELPERS (Supabase)
// ==========================================
async function getProducts() {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('sold', { ascending: false });

    if (error) {
      console.error('getProducts Supabase error:', error.message);
      return [];
    }
    return (data || []).map(formatProductRow);
  } catch (error) {
    console.error('getProducts error:', error.message);
    return [];
  }
}

async function getProductById(id) {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('getProductById Supabase error:', error.message);
      return null;
    }
    return formatProductRow(data);
  } catch (error) {
    console.error('getProductById error:', error.message);
    return null;
  }
}

async function getRelatedProducts(category, excludeId, limit = 4) {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('category', category)
      .neq('id', excludeId)
      .limit(limit);

    if (error) {
      console.error('getRelatedProducts Supabase error:', error.message);
      return [];
    }
    return (data || []).map(formatProductRow);
  } catch (error) {
    console.error('getRelatedProducts error:', error.message);
    return [];
  }
}

async function createProduct(productData) {
  const id = productData.id || `prod-${Date.now()}`;
  const price = Number(productData.price) || 0;
  const costPrice = Number(productData.cost_price) || Number(productData.costPrice) || 0;
  const taxRate = Number(productData.tax_rate) || Number(productData.taxRate) || 0;
  const taxType = productData.tax_type || productData.taxType || 'none';
  const originalPrice = Number(productData.originalPrice) || Number(productData.original_price) || price;

  let imagesArr = [];
  if (Array.isArray(productData.images)) {
    imagesArr = productData.images.filter(Boolean);
  } else if (typeof productData.images === 'string' && productData.images.trim()) {
    try {
      const parsed = JSON.parse(productData.images);
      if (Array.isArray(parsed)) imagesArr = parsed;
      else imagesArr = [productData.images.trim()];
    } catch {
      imagesArr = [productData.images.trim()];
    }
  }
  if (imagesArr.length === 0 && productData.image_url) {
    imagesArr = [productData.image_url];
  }
  const imageUrl = productData.image_url || (imagesArr.length > 0 ? imagesArr[0] : null);
  const imagesJson = imagesArr.length > 0 ? JSON.stringify(imagesArr) : null;

  const payload = {
    id,
    sku: productData.sku || `SKU-${Date.now()}`,
    name: productData.name || '',
    brand: productData.brand || 'ASUS',
    category: productData.category || 'gaming',
    price,
    cost_price: costPrice,
    tax_rate: taxRate,
    tax_type: taxType,
    original_price: originalPrice,
    originalPrice: originalPrice,
    discount: Number(productData.discount) || 0,
    stock: Number(productData.stock) || 0,
    status: productData.status || 'active',
    specs: productData.specs || '',
    emoji: productData.emoji || '💻',
    rating: productData.rating || '5.0',
    sold: Number(productData.sold) || 0,
    image_url: imageUrl,
    images: imagesJson,
  };

  const { error } = await supabaseAdmin.from('products').insert([payload]);
  if (error) {
    console.error('createProduct Supabase error:', error.message);
    throw error;
  }
  return getProductById(id);
}

async function updateProduct(id, updates) {
  const existing = await getProductById(id);
  if (!existing) return null;

  let imagesArr = undefined;
  if (updates.images !== undefined) {
    if (Array.isArray(updates.images)) {
      imagesArr = updates.images.filter(Boolean);
    } else if (typeof updates.images === 'string' && updates.images.trim()) {
      try {
        const parsed = JSON.parse(updates.images);
        if (Array.isArray(parsed)) imagesArr = parsed;
        else imagesArr = [updates.images.trim()];
      } catch {
        imagesArr = [updates.images.trim()];
      }
    } else {
      imagesArr = [];
    }
  }

  const finalImages = imagesArr !== undefined ? imagesArr : (existing.images || []);
  const finalImageUrl =
    updates.image_url !== undefined
      ? updates.image_url
      : finalImages.length > 0
      ? finalImages[0]
      : existing.image_url;
  const imagesJson = finalImages.length > 0 ? JSON.stringify(finalImages) : null;

  const costPrice =
    updates.cost_price !== undefined
      ? Number(updates.cost_price)
      : updates.costPrice !== undefined
      ? Number(updates.costPrice)
      : existing.cost_price || 0;
  const taxRate =
    updates.tax_rate !== undefined
      ? Number(updates.tax_rate)
      : updates.taxRate !== undefined
      ? Number(updates.taxRate)
      : existing.tax_rate || 0;
  const taxType =
    updates.tax_type !== undefined
      ? updates.tax_type
      : updates.taxType !== undefined
      ? updates.taxType
      : existing.tax_type || 'none';

  const payload = {
    name: updates.name !== undefined ? updates.name : existing.name,
    brand: updates.brand !== undefined ? updates.brand : existing.brand,
    category: updates.category !== undefined ? updates.category : existing.category,
    price: updates.price !== undefined ? Number(updates.price) : existing.price,
    cost_price: costPrice,
    tax_rate: taxRate,
    tax_type: taxType,
    original_price:
      updates.originalPrice !== undefined
        ? Number(updates.originalPrice)
        : existing.originalPrice || existing.price,
    originalPrice:
      updates.originalPrice !== undefined
        ? Number(updates.originalPrice)
        : existing.originalPrice || existing.price,
    discount: updates.discount !== undefined ? Number(updates.discount) : existing.discount,
    stock: updates.stock !== undefined ? Number(updates.stock) : existing.stock,
    status: updates.status !== undefined ? updates.status : existing.status,
    specs: updates.specs !== undefined ? updates.specs : existing.specs,
    emoji: updates.emoji !== undefined ? updates.emoji : existing.emoji,
    rating: updates.rating !== undefined ? updates.rating : existing.rating,
    sold: updates.sold !== undefined ? Number(updates.sold) : existing.sold,
    image_url: finalImageUrl,
    images: imagesJson,
  };

  const { error } = await supabaseAdmin.from('products').update(payload).eq('id', id);
  if (error) {
    console.error('updateProduct Supabase error:', error.message);
    throw error;
  }
  return getProductById(id);
}

async function deleteProduct(id) {
  const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
  if (error) {
    console.error('deleteProduct Supabase error:', error.message);
    return false;
  }
  return true;
}

async function updateProductStock(id, stock) {
  try {
    await supabaseAdmin.from('products').update({ stock: Number(stock) }).eq('id', id);
    return getProductById(id);
  } catch (error) {
    console.error('updateProductStock error:', error.message);
    return null;
  }
}

// ==========================================
// 3. ORDERS HELPERS (Supabase)
// ==========================================
async function getOrders() {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getOrders Supabase error:', error.message);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('getOrders error:', error.message);
    return [];
  }
}

async function createOrder(orderData) {
  const id = orderData.id || `RL-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateStr =
    orderData.date ||
    new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date()) + ' WIB';

  const payload = {
    id,
    customer: orderData.customer || 'Pelanggan',
    phone: orderData.phone || '',
    email: orderData.email || '',
    product: orderData.product || '',
    total: Number(orderData.total) || 0,
    status: orderData.status || 'Diproses',
    kurir: orderData.kurir || 'Ambil di Toko',
    resi: orderData.resi || '-',
    date: dateStr,
  };

  const { data, error } = await supabaseAdmin.from('orders').insert([payload]).select().single();
  if (error) {
    console.error('createOrder Supabase error:', error.message);
    throw error;
  }
  return data;
}

async function updateOrder(id, updates) {
  const { data, error } = await supabaseAdmin.from('orders').update(updates).eq('id', id).select().single();
  if (error) {
    console.error('updateOrder Supabase error:', error.message);
    return null;
  }
  return data;
}

// ==========================================
// 4. SERVICES HELPERS (Supabase)
// ==========================================
async function getServices() {
  try {
    const { data, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getServices Supabase error:', error.message);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('getServices error:', error.message);
    return [];
  }
}

async function updateService(id, updates) {
  const { data, error } = await supabaseAdmin.from('services').update(updates).eq('id', id).select().single();
  if (error) {
    console.error('updateService Supabase error:', error.message);
    return null;
  }
  return data;
}

// ==========================================
// 5. CUSTOMERS HELPERS (Supabase)
// ==========================================
async function getCustomerByEmail(email) {
  try {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (error) return null;
    return data;
  } catch (error) {
    return null;
  }
}

async function getCustomerById(id) {
  try {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) return null;
    return data;
  } catch (error) {
    return null;
  }
}

async function createCustomer({ name, email, phone, passwordHash }) {
  const id = `cust-${Date.now()}`;
  const cleanEmail = String(email || '').trim().toLowerCase();
  const payload = {
    id,
    name: name || '',
    email: cleanEmail,
    phone: phone || '',
    password_hash: passwordHash,
    tier: 'Member',
    points: 0,
  };
  const { data, error } = await supabaseAdmin.from('customers').insert([payload]).select().single();
  if (error) throw error;
  return data;
}

async function getCustomers() {
  try {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getCustomers Supabase error:', error.message);
      return [];
    }
    return (data || []).map(sanitizeCustomer);
  } catch (error) {
    console.error('getCustomers error:', error.message);
    return [];
  }
}

async function deleteCustomer(id) {
  try {
    const { error } = await supabaseAdmin
      .from('customers')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('deleteCustomer error:', error.message);
    return false;
  }
}

function sanitizeCustomer(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    address: row.address || '',
    tier: row.tier || 'Member',
    points: Number(row.points) || 0,
    created_at: row.created_at || null,
  };
}

async function updateCustomerProfile(id, { name, phone, address }) {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .update({ name: name || '', phone: phone || '', address: address || '' })
    .eq('id', id)
    .select()
    .single();

  if (error) return null;
  return data;
}

async function updateCustomerPassword(id, passwordHash) {
  const { error } = await supabaseAdmin
    .from('customers')
    .update({ password_hash: passwordHash })
    .eq('id', id);

  return !error;
}

// ==========================================
// 6. ADMIN USERS HELPERS (Supabase)
// ==========================================
async function getAdminByEmail(email) {
  try {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (error) return null;
    return data;
  } catch (error) {
    return null;
  }
}

async function getAdminById(id) {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) return null;
    return data;
  } catch (error) {
    return null;
  }
}

async function getAdmins() {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('id, name, email, role, status, phone, avatar, created_at')
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  } catch (error) {
    return [];
  }
}

async function createAdmin({ name, email, password, role, status = 'active' }) {
  const id = `admin-${Date.now()}`;
  const passwordHash = await bcrypt.hash(password, 10);
  const allowedRoles = [
    'super_admin',
    'kasir',
    'finance',
    'manajer_area',
    'gudang',
    'audit',
    'digital_marketing',
    'owner',
    'kepala_toko',
  ];
  const roleToSave = allowedRoles.includes(role) ? role : 'kasir';
  const statusToSave = status === 'inactive' || status === 'nonaktif' ? 'inactive' : 'active';
  const payload = {
    id,
    name: name || '',
    email: String(email || '').trim().toLowerCase(),
    password_hash: passwordHash,
    role: roleToSave,
    status: statusToSave,
  };
  const { data, error } = await supabaseAdmin.from('admin_users').insert([payload]).select().single();
  if (error) throw error;
  return data;
}

async function updateAdmin(id, { name, email, role, password, status }) {
  const updates = {};
  if (name !== undefined) updates.name = String(name).trim();
  if (email !== undefined) updates.email = String(email).trim().toLowerCase();
  if (role !== undefined) updates.role = role;
  if (password && String(password).trim().length > 0) {
    updates.password_hash = await bcrypt.hash(String(password).trim(), 10);
  }
  if (status !== undefined) {
    const s = String(status).toLowerCase();
    updates.status = s === 'inactive' || s === 'nonaktif' ? 'inactive' : 'active';
  }
  const { error } = await supabaseAdmin.from('admin_users').update(updates).eq('id', id);
  if (error) throw error;
  return true;
}

async function updateAdminRole(id, newRole) {
  return updateAdmin(id, { role: newRole });
}

async function deleteAdmin(id) {
  const { error } = await supabaseAdmin.from('admin_users').delete().eq('id', id);
  return !error;
}

function sanitizeAdmin(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    phone: row.phone || '',
    avatar: row.avatar || null,
    status: row.status || 'active',
  };
}

// ==========================================
// 7. DASHBOARD METRICS (Supabase)
// ==========================================
async function getDashboardData() {
  try {
    const [ordersRes, productsRes, servicesRes, customersRes] = await Promise.all([
      supabaseAdmin.from('orders').select('*'),
      supabaseAdmin.from('products').select('*'),
      supabaseAdmin.from('services').select('*'),
      supabaseAdmin.from('customers').select('id', { count: 'exact' }),
    ]);

    const orders = ordersRes.data || [];
    const products = productsRes.data || [];
    const services = servicesRes.data || [];

    const totalSales = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const pendingOrders = orders.filter((o) =>
      ['Perlu Dikemas', 'Menunggu Bayar', 'Diproses'].includes(o.status)
    ).length;
    const activeServices = services.filter((s) => !['Siap Diambil', 'Selesai'].includes(s.stage)).length;
    const lowStock = products.filter((p) => Number(p.stock) <= 3);

    return {
      metrics: {
        total_sales: totalSales,
        pending_orders: pendingOrders,
        active_services: activeServices,
        total_products: products.length,
        low_stock_products: lowStock.length,
        total_customers: customersRes.count || 0,
        total_suppliers: 0,
      },
      recentOrders: orders.slice(0, 5),
      lowStock: lowStock.slice(0, 5),
      recentServices: services.slice(0, 5),
    };
  } catch (error) {
    console.error('getDashboardData Supabase error:', error.message);
    return null;
  }
}

// ==========================================
// 8. DYNAMIC WEB SECTIONS HELPERS (Supabase)
// ==========================================
async function getBrands() {
  try {
    const { data, error } = await supabaseAdmin
      .from('brands')
      .select('*')
      .order('id', { ascending: true });

    if (!error && data && data.length > 0) return data;

    // Fallback: extract distinct brands from active products in Supabase
    const { data: prodBrands } = await supabaseAdmin
      .from('products')
      .select('brand')
      .neq('status', 'draft');

    if (prodBrands && prodBrands.length > 0) {
      const unique = Array.from(new Set(prodBrands.map((p) => p.brand).filter(Boolean)));
      return unique.map((name, i) => ({
        id: i + 1,
        name,
        icon: '💻',
        desc: 'Official Dealer',
      }));
    }
    return [];
  } catch (error) {
    return [];
  }
}

async function getArticles() {
  try {
    const { data, error } = await supabaseAdmin
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) return data;
    return [];
  } catch (error) {
    return [];
  }
}

async function getTestimonials() {
  try {
    const { data, error } = await supabaseAdmin
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) return data;
    return [];
  } catch (error) {
    return [];
  }
}

async function getStoreServices() {
  try {
    const { data, error } = await supabaseAdmin
      .from('store_services')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && data && data.length > 0) return data;
    return [];
  } catch (error) {
    return [];
  }
}

async function getBranches() {
  try {
    const { data, error } = await supabaseAdmin
      .from('branches')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && data && data.length > 0) return data;
    return [];
  } catch (error) {
    return [];
  }
}

// ==========================================
// 9. BACKWARD COMPATIBILITY POOL
// ==========================================
// For any legacy route queries that directly invoke pool.query()
let mysqlPool = null;
try {
  const mysql = require('mysql2');
  if (process.env.MYSQL_DATABASE && process.env.MYSQL_HOST) {
    mysqlPool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'rajalaptop',
      port: Number(process.env.MYSQL_PORT) || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    }).promise();
  }
} catch (e) {}

const pool = mysqlPool || {
  query: async () => [[]],
};

module.exports = {
  supabase,
  supabaseAdmin,
  isSupabaseConfigured,
  pool,
  getSettings,
  updateSettings,
  getProducts,
  getProductById,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  getOrders,
  createOrder,
  updateOrder,
  getServices,
  updateService,
  getCustomerByEmail,
  getCustomerById,
  getCustomers,
  deleteCustomer,
  createCustomer,
  updateCustomerProfile,
  updateCustomerPassword,
  sanitizeCustomer,
  getAdminByEmail,
  getAdminById,
  getAdmins,
  createAdmin,
  updateAdminRole,
  updateAdmin,
  deleteAdmin,
  sanitizeAdmin,
  getDashboardData,
  getBrands,
  getArticles,
  getTestimonials,
  getStoreServices,
  getBranches,
};
