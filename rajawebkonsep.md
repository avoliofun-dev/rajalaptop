# Blueprint Website Profesional + Admin Dashboard

## Konsep E-commerce & Business Management Platform --- Terinspirasi ELS.ID

> Dokumen konsep arsitektur produk untuk membangun website retail
> komputer/elektronik profesional dengan pengalaman publik seperti
> ELS.ID, tetapi dengan backend dan dashboard admin yang lebih
> terintegrasi.

**Status:** Product Blueprint / V1\
**Tanggal:** 26 September 2026\
**Target:** Website publik + customer/member portal + admin dashboard +
operasional toko

------------------------------------------------------------------------

# 1. Visi Produk

Website bukan hanya toko online, tetapi menjadi **Digital Business
Operating System** untuk bisnis retail.

Sistem terdiri dari:

1.  **Public Website** --- katalog, promo, artikel, toko, layanan,
    pencarian.
2.  **Customer Portal** --- akun, pesanan, wishlist, poin, voucher,
    service, trade-in.
3.  **Admin Dashboard** --- pusat kontrol seluruh operasional.
4.  **Staff Dashboard** --- pekerjaan sesuai divisi.
5.  **Branch Management** --- stok dan aktivitas per cabang.
6.  **CRM** --- pelanggan, leads, follow-up, segmentasi.
7.  **CMS** --- banner, halaman, berita, promo, SEO.
8.  **Analytics** --- penjualan, produk, pelanggan, stok, marketing.
9.  **Audit & Security** --- role, permission, log aktivitas, keamanan.

------------------------------------------------------------------------

# 2. Referensi Konsep ELS.ID

ELS.ID saat ini menampilkan struktur yang cukup lengkap untuk bisnis
retail: kategori produk bertingkat, member, branch/store, service
center, marketplace, berita, pricelist, promo, serta layanan seperti
Total Care dan Care Plus. Website juga menyediakan pencarian produk dan
akun pelanggan. \[Referensi: ELS.ID\]

Platform membership ELS juga menunjukkan pola CRM yang mencakup poin
transaksi, promo eksklusif, riwayat belanja, dan affiliate. Platform CRM
terpisah digunakan untuk customer relationship management.

**Kesimpulan konsep:**

> Jangan meniru tampilan secara mentah. Ambil pola bisnisnya, lalu
> bangun sistem internal yang lebih terintegrasi.

------------------------------------------------------------------------

# 3. Struktur Besar Sistem

``` text
                         ┌─────────────────────┐
                         │    PUBLIC WEBSITE   │
                         │ Home / Shop / Promo │
                         └──────────┬──────────┘
                                    │
                                    ▼
┌─────────────────┐       ┌─────────────────────┐       ┌─────────────────┐
│ Customer Portal │──────▶│   BACKEND / API     │◀──────│ Admin Dashboard │
│ Member / Order  │       │ Auth / Business     │       │ Management      │
└─────────────────┘       │ Logic / Database    │       └────────┬────────┘
                          └──────────┬──────────┘                │
                                     │                           │
             ┌───────────────────────┼───────────────────────────┤
             ▼                       ▼                           ▼
       ┌───────────┐          ┌────────────┐              ┌─────────────┐
       │ Inventory │          │   Orders   │              │    CRM      │
       │ Warehouse │          │ Payment    │              │ Customers   │
       └───────────┘          └────────────┘              └─────────────┘
             │                       │                           │
             └───────────────────────┼───────────────────────────┘
                                     ▼
                             ┌────────────────┐
                             │    ANALYTICS   │
                             │ BI / Reports   │
                             └────────────────┘
```

------------------------------------------------------------------------

# 4. Public Website

## 4.1 Home

Komponen:

-   Header
-   Logo
-   Search bar
-   Login / Register
-   Cart
-   Wishlist
-   Navigation kategori
-   Hero banner
-   Flash sale / promo
-   Produk unggulan
-   Produk terbaru
-   Best seller
-   Produk berdasarkan kategori
-   Brand showcase
-   Promo member
-   Trade-in
-   Service center
-   Cabang toko
-   Artikel / berita
-   Testimoni
-   CTA WhatsApp
-   Footer lengkap

## 4.2 Product Catalog

Fitur:

-   Kategori
-   Subkategori
-   Brand
-   Filter harga
-   Filter spesifikasi
-   Filter availability
-   Filter cabang
-   Sort harga
-   Sort terbaru
-   Sort popularitas
-   Search SKU
-   Search nama produk
-   Grid / list view

## 4.3 Product Detail

Informasi:

-   Foto produk
-   Video produk
-   Nama
-   SKU
-   Brand
-   Harga normal
-   Harga promo
-   Stok
-   Stok per cabang
-   Spesifikasi
-   Deskripsi
-   Garansi
-   Bundling
-   Produk terkait
-   Produk alternatif
-   Wishlist
-   Add to cart
-   Beli sekarang
-   Tanya via WhatsApp

------------------------------------------------------------------------

# 5. Customer / Member Portal

Menu customer:

``` text
Dashboard
├── Profil
├── Pesanan
├── Detail Pesanan
├── Wishlist
├── Alamat
├── Poin
├── Voucher
├── Membership
├── Referral / Affiliate
├── Service
├── Trade-in
├── Notifikasi
└── Security
```

Dashboard customer menampilkan:

-   Total transaksi
-   Pesanan aktif
-   Poin
-   Voucher
-   Status membership
-   Produk terakhir dilihat
-   Rekomendasi produk
-   Promo personal

------------------------------------------------------------------------

# 6. ADMIN DASHBOARD

Admin dashboard menjadi bagian paling penting.

## 6.1 Dashboard Overview

Card utama:

-   Total Sales
-   Revenue
-   Orders
-   Customers
-   Products
-   Low Stock
-   Pending Payment
-   Pending Shipment
-   Service Ticket
-   New Leads

Grafik:

-   Revenue harian
-   Revenue mingguan
-   Revenue bulanan
-   Order trend
-   Customer growth
-   Top products
-   Top categories
-   Sales per branch

Contoh:

``` text
┌────────────┬────────────┬────────────┬────────────┐
│ Revenue    │ Orders     │ Customers  │ Products   │
│ Rp 245 JT  │ 1,248      │ 8,921      │ 12,540     │
└────────────┴────────────┴────────────┴────────────┘

Revenue Analytics
┌────────────────────────────────────────────────────┐
│                                                    │
│               LINE / AREA CHART                    │
│                                                    │
└────────────────────────────────────────────────────┘

┌──────────────────────┬─────────────────────────────┐
│ Top Products         │ Sales by Branch             │
│ 1. Laptop A          │ Semarang   Rp 80 JT        │
│ 2. SSD B             │ Yogyakarta Rp 65 JT        │
│ 3. Monitor C        │ Solo       Rp 42 JT        │
└──────────────────────┴─────────────────────────────┘
```

------------------------------------------------------------------------

# 7. ADMIN MODULE

## 7.1 Product Management

``` text
Products
├── All Products
├── Add Product
├── Categories
├── Brands
├── Attributes
├── Variants
├── Specifications
├── Product Images
├── Product Videos
├── Bundles
├── Related Products
├── Product Reviews
└── Import / Export
```

Fitur penting:

-   CRUD produk
-   SKU generator
-   Barcode
-   Multiple images
-   Multiple variants
-   Harga modal
-   Harga jual
-   Harga member
-   Harga reseller
-   Harga promo
-   Stok
-   Minimum stock
-   Supplier
-   Garansi
-   Status publish
-   SEO metadata

------------------------------------------------------------------------

# 8. Inventory Management

Inventory harus multi-gudang dan multi-cabang.

``` text
Inventory
├── Stock Overview
├── Warehouse
├── Branch
├── Stock Transfer
├── Stock Adjustment
├── Stock Opname
├── Stock History
├── Low Stock
├── Damaged Stock
└── Serial Number
```

Untuk barang elektronik, gunakan:

-   Serial number
-   IMEI jika relevan
-   Barcode
-   Batch
-   Warranty ID

Alur:

``` text
Supplier
   ↓
Purchase Order
   ↓
Warehouse
   ↓
Stock
   ├── Branch A
   ├── Branch B
   └── Branch C
```

------------------------------------------------------------------------

# 9. Order Management

Status order:

``` text
Pending
↓
Payment Verification
↓
Paid
↓
Processing
↓
Packed
↓
Shipped
↓
Delivered
↓
Completed
```

Status tambahan:

-   Cancelled
-   Refunded
-   Failed
-   Return Requested
-   Returned

Admin dapat:

-   Melihat order
-   Mengubah status
-   Verifikasi pembayaran
-   Cetak invoice
-   Cetak packing slip
-   Input resi
-   Refund
-   Return
-   Melihat timeline order

------------------------------------------------------------------------

# 10. POS / Kasir

Jika memiliki toko fisik, tambahkan POS.

Fitur:

-   Scan barcode
-   Cari produk
-   Customer lookup
-   Member pricing
-   Voucher
-   Diskon
-   Pajak
-   Multiple payment
-   Cash
-   Transfer
-   QRIS
-   E-wallet
-   Card
-   Cetak struk
-   Hold transaction
-   Refund

POS terhubung langsung dengan inventory.

------------------------------------------------------------------------

# 11. Customer Relationship Management

CRM:

``` text
CRM
├── Customers
├── Leads
├── Segments
├── Customer Notes
├── Customer Timeline
├── Follow Up
├── Campaigns
├── Broadcast
├── Voucher
├── Loyalty
└── Affiliate
```

Customer profile:

-   Nama
-   Kontak
-   Email
-   Kota
-   Total transaksi
-   Total spending
-   Produk yang dibeli
-   Last purchase
-   Membership
-   Poin
-   Voucher
-   Service history
-   Notes

------------------------------------------------------------------------

# 12. Membership & Loyalty

Level:

``` text
Regular
Silver
Gold
Platinum
VIP
```

Benefit dapat berupa:

-   Diskon
-   Poin
-   Voucher
-   Early access promo
-   Special price
-   Birthday reward
-   Free shipping
-   Service benefit

Poin:

``` text
Transaksi
   ↓
Earn Point
   ↓
Customer Wallet
   ↓
Redeem
   ↓
Voucher / Reward
```

------------------------------------------------------------------------

# 13. Promo Management

Admin dapat membuat:

-   Discount percentage
-   Discount nominal
-   Flash sale
-   Bundle
-   Buy 1 Get 1
-   Voucher
-   Free shipping
-   Member-only price
-   Brand campaign
-   Category campaign
-   Branch campaign

Rule engine:

``` text
IF
customer = GOLD
AND
category = LAPTOP
AND
cart >= Rp 5.000.000

THEN
discount = 5%
```

------------------------------------------------------------------------

# 14. CMS / Content Management

Admin tidak perlu mengubah kode untuk mengelola konten.

``` text
CMS
├── Pages
├── Homepage
├── Banner
├── Promo
├── News
├── Blog
├── FAQ
├── Testimonials
├── SEO
├── Menu
└── Footer
```

Homepage builder:

``` text
Hero
↓
Category Section
↓
Promo
↓
Best Seller
↓
New Product
↓
Brand
↓
Service
↓
Branch
↓
Article
↓
CTA
```

Section dapat:

-   Add
-   Remove
-   Reorder
-   Hide/show
-   Schedule publish

------------------------------------------------------------------------

# 15. Branch Management

Untuk bisnis multi-cabang:

``` text
Branch
├── Yogyakarta
├── Semarang
├── Solo
├── Purwokerto
├── Tegal
└── Madiun
```

Setiap branch memiliki:

-   Address
-   Google Maps
-   Phone
-   WhatsApp
-   Opening hours
-   Manager
-   Staff
-   Stock
-   Sales
-   Target
-   Service

Dashboard cabang:

-   Sales hari ini
-   Sales bulan ini
-   Target
-   Stock
-   Top products
-   Staff performance
-   Pending orders

------------------------------------------------------------------------

# 16. Service Center

Modul service:

``` text
Customer
↓
Create Service Ticket
↓
Device Received
↓
Diagnosis
↓
Quotation
↓
Approval
↓
Repair
↓
Testing
↓
Ready
↓
Picked Up
```

Data service:

-   Ticket number
-   Customer
-   Device
-   Serial number
-   Complaint
-   Photos
-   Diagnosis
-   Technician
-   Estimated cost
-   Parts
-   Status
-   Warranty
-   Timeline

Customer dapat tracking service secara online.

------------------------------------------------------------------------

# 17. Trade-In

Workflow:

``` text
Customer
↓
Input Device
↓
Upload Photos
↓
Admin Review
↓
Estimated Value
↓
Physical Inspection
↓
Final Value
↓
Trade-In Approval
↓
New Purchase / Payout
```

Admin dapat mengatur:

-   Device category
-   Condition
-   Depreciation
-   Estimated value
-   Inspection checklist

------------------------------------------------------------------------

# 18. Pricelist System

Pricelist sebaiknya tidak sekadar PDF.

Admin dapat:

-   Generate pricelist
-   Filter category
-   Filter brand
-   Filter branch
-   Set price
-   Export PDF
-   Export Excel
-   Schedule publication

Format:

``` text
Product | SKU | Price | Promo | Stock | Updated
```

------------------------------------------------------------------------

# 19. Analytics & Reporting

## Sales Analytics

-   Revenue
-   Gross profit
-   Net sales
-   Average order value
-   Orders
-   Refund
-   Discount

## Product Analytics

-   Top selling
-   Slow moving
-   Most viewed
-   Most wishlisted
-   Conversion rate

## Customer Analytics

-   New customers
-   Returning customers
-   Customer retention
-   Lifetime value
-   Purchase frequency

## Inventory Analytics

-   Stock value
-   Inventory turnover
-   Dead stock
-   Low stock
-   Stock movement

## Marketing Analytics

-   Campaign performance
-   Voucher usage
-   Affiliate sales
-   Referral conversion
-   Traffic
-   Conversion

------------------------------------------------------------------------

# 20. Role & Permission

Jangan membuat semua admin memiliki akses penuh.

Role:

``` text
Super Admin
Admin
Manager
Finance
Warehouse
Inventory
Sales
Customer Service
Marketing
Content Editor
Technician
Branch Manager
Cashier
Viewer
```

Permission menggunakan:

``` text
module.action
```

Contoh:

``` text
products.view
products.create
products.edit
products.delete

orders.view
orders.update
orders.refund

inventory.view
inventory.adjust
inventory.transfer

customers.view
customers.edit

reports.view
```

------------------------------------------------------------------------

# 21. Super Admin

Super Admin memiliki:

-   Semua permission
-   User management
-   Role management
-   System settings
-   Payment settings
-   Shipping settings
-   API settings
-   Audit log
-   Security settings
-   Backup
-   Integration

------------------------------------------------------------------------

# 22. Audit Log

Semua tindakan penting dicatat.

``` text
2026-09-26 10:22
Admin: Budi
Action: UPDATE_PRODUCT
Product: ASUS XYZ
Old Price: Rp 12.000.000
New Price: Rp 11.500.000
IP: xxx.xxx.xxx.xxx
```

Audit log penting untuk:

-   keamanan
-   investigasi
-   kontrol internal
-   perubahan harga
-   perubahan stok
-   refund
-   perubahan permission

------------------------------------------------------------------------

# 23. Notification Center

Admin notification:

-   New order
-   Payment received
-   Low stock
-   Out of stock
-   New customer
-   New service ticket
-   Return request
-   Failed payment
-   System alert

Channel:

-   Dashboard
-   Email
-   WhatsApp
-   Push notification

------------------------------------------------------------------------

# 24. Search Global Admin

Admin harus memiliki satu search:

``` text
Search anything...
```

Bisa menemukan:

-   Customer
-   Order
-   Product
-   SKU
-   Serial number
-   Service ticket
-   Invoice
-   Branch
-   Staff

Shortcut:

``` text
Ctrl + K
```

------------------------------------------------------------------------

# 25. Database Konsep

Entity utama:

``` text
users
roles
permissions
role_permissions

customers
customer_addresses
customer_segments

products
product_categories
brands
product_variants
product_images
product_attributes

warehouses
branches
inventory
inventory_movements
serial_numbers

orders
order_items
payments
shipments
returns
refunds

carts
wishlists

promotions
coupons
campaigns

loyalty_points
loyalty_transactions
memberships

service_tickets
service_items
service_parts
service_logs

tradeins
tradein_inspections

articles
pages
banners
menus

notifications
audit_logs
settings
```

------------------------------------------------------------------------

# 26. Arsitektur Backend

Rekomendasi:

``` text
Frontend
   │
   ▼
Next.js / React
   │
   ▼
API Layer
   │
   ▼
Backend
   │
   ├── Auth
   ├── Product
   ├── Order
   ├── Inventory
   ├── CRM
   ├── CMS
   ├── Service
   ├── Loyalty
   └── Reporting
   │
   ▼
PostgreSQL
```

Tambahan:

``` text
Redis
Object Storage
Queue Worker
Search Engine
Payment Gateway
Shipping API
WhatsApp API
Email Provider
Analytics
```

------------------------------------------------------------------------

# 27. Frontend Structure

## Public

``` text
/
├── /shop
├── /category/[slug]
├── /product/[slug]
├── /brand/[slug]
├── /promo
├── /blog
├── /service
├── /trade-in
├── /stores
├── /about
├── /contact
├── /cart
└── /checkout
```

## Customer

``` text
/account
/account/orders
/account/wishlist
/account/points
/account/vouchers
/account/service
/account/profile
```

## Admin

``` text
/admin
/admin/products
/admin/categories
/admin/orders
/admin/customers
/admin/inventory
/admin/branches
/admin/pos
/admin/service
/admin/trade-in
/admin/promotions
/admin/cms
/admin/reports
/admin/users
/admin/roles
/admin/settings
/admin/audit-log
```

------------------------------------------------------------------------

# 28. Dashboard UI Design

Gaya visual:

-   Clean
-   Modern
-   Professional
-   Banyak whitespace
-   Sidebar collapsible
-   Topbar
-   Card analytics
-   Data table
-   Filter
-   Search
-   Modal
-   Drawer
-   Toast notification
-   Responsive

Layout:

``` text
┌──────────────────────────────────────────────────────────┐
│ LOGO        Search...              Notification   Admin  │
├─────────────┬────────────────────────────────────────────┤
│ Dashboard   │                                            │
│ Products    │              PAGE CONTENT                  │
│ Orders      │                                            │
│ Inventory   │                                            │
│ Customers   │                                            │
│ CRM         │                                            │
│ Marketing   │                                            │
│ Service     │                                            │
│ Reports     │                                            │
│ CMS         │                                            │
│ Users       │                                            │
│ Settings    │                                            │
└─────────────┴────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 29. Responsive Admin

Desktop:

-   Sidebar penuh
-   Data table lengkap
-   Analytics besar

Tablet:

-   Sidebar compact
-   Table horizontal scroll

Mobile:

-   Bottom navigation
-   Card layout
-   Filter drawer
-   Quick action

Admin tetap dapat melakukan pekerjaan penting melalui HP.

------------------------------------------------------------------------

# 30. Security

Wajib:

-   HTTPS
-   Password hashing
-   Secure session
-   HttpOnly cookie
-   CSRF protection
-   Rate limiting
-   Brute force protection
-   2FA untuk admin
-   RBAC
-   Audit log
-   Input validation
-   SQL injection protection
-   XSS protection
-   File upload validation
-   Backup database
-   Secret management

Untuk admin:

``` text
Login
↓
2FA
↓
Session
↓
Permission Check
↓
Audit Log
```

------------------------------------------------------------------------

# 31. SEO

Public website:

-   SEO title
-   Meta description
-   Open Graph
-   Canonical URL
-   Schema.org
-   Product schema
-   Breadcrumb schema
-   Article schema
-   Sitemap
-   Robots.txt
-   Clean URL
-   Image optimization
-   WebP/AVIF
-   Internal linking

Produk:

``` text
/products/asus-vivobook-14
```

bukan:

``` text
/product?id=12983
```

------------------------------------------------------------------------

# 32. Performance

Target:

-   Fast first load
-   Image optimization
-   Lazy loading
-   CDN
-   Server-side rendering
-   Caching
-   Database indexing
-   Pagination
-   Background jobs

Jangan mengambil seluruh data produk sekaligus.

Gunakan:

``` text
pagination
filter
search
cache
```

------------------------------------------------------------------------

# 33. Payment

Payment abstraction:

``` text
Payment Service
├── Bank Transfer
├── Virtual Account
├── QRIS
├── E-Wallet
├── Credit/Debit Card
└── COD
```

Jangan mengikat seluruh sistem langsung ke satu payment provider.

Gunakan interface:

``` text
PaymentProvider
├── createPayment()
├── checkPayment()
├── cancelPayment()
└── refundPayment()
```

------------------------------------------------------------------------

# 34. Shipping

Shipping abstraction:

``` text
Shipping
├── JNE
├── J&T
├── SiCepat
├── TIKI
├── POS
└── Pickup Store
```

Sistem menyimpan:

-   Courier
-   Service
-   Tracking number
-   Shipping cost
-   ETA
-   Shipment status

------------------------------------------------------------------------

# 35. WhatsApp Integration

WhatsApp dapat digunakan untuk:

-   Order confirmation
-   Payment confirmation
-   Shipping notification
-   Service notification
-   Promo
-   Customer support

Contoh:

``` text
Halo Bapak/Ibu {name},

Pesanan #{order_number}
telah diproses.

Total: {total}

Lihat pesanan:
{link}
```

------------------------------------------------------------------------

# 36. Homepage Personalization

Setelah sistem memiliki data cukup:

``` text
Customer behavior
       ↓
Recommendation Engine
       ↓
Recommended Products
       ↓
Personalized Homepage
```

Contoh:

Customer sering melihat:

``` text
Laptop Gaming
RTX
Monitor Gaming
```

Maka sistem menampilkan kategori dan produk terkait.

------------------------------------------------------------------------

# 37. AI Assistant --- Tahap Lanjutan

AI bukan prioritas MVP, tetapi dapat ditambahkan.

Use case:

### Customer AI

-   Rekomendasi laptop
-   Bandingkan produk
-   Tanya spesifikasi
-   Cari produk sesuai budget

### Admin AI

-   Ringkas penjualan
-   Deteksi produk slow moving
-   Buat deskripsi produk
-   Buat SEO metadata
-   Analisis customer
-   Buat laporan

Contoh:

``` text
Admin:
"Kenapa penjualan laptop minggu ini turun?"

AI:
- Traffic turun 8%
- Conversion rate turun 3%
- Produk A out of stock
- Promo kategori laptop berakhir
```

AI harus memberikan sumber data dan alasan, bukan membuat angka sendiri.

------------------------------------------------------------------------

# 38. MVP Development

## Phase 1 --- Foundation

-   Authentication
-   User
-   Role
-   Permission
-   Database
-   Admin layout
-   Public layout

## Phase 2 --- Catalog

-   Product
-   Category
-   Brand
-   Search
-   Product detail
-   Inventory dasar

## Phase 3 --- Commerce

-   Cart
-   Checkout
-   Order
-   Payment
-   Shipping
-   Invoice

## Phase 4 --- Admin

-   Dashboard
-   Product management
-   Order management
-   Customer
-   Inventory
-   Reports

## Phase 5 --- CRM

-   Customer profile
-   Membership
-   Points
-   Voucher
-   Promo
-   Notification

## Phase 6 --- Operations

-   Branch
-   POS
-   Service center
-   Trade-in

## Phase 7 --- Advanced

-   Analytics
-   Recommendation
-   AI
-   Automation
-   Advanced BI

------------------------------------------------------------------------

# 39. Prioritas MVP

### P0 --- Wajib

``` text
Auth
RBAC
Product
Category
Inventory
Customer
Cart
Checkout
Order
Payment
Admin Dashboard
```

### P1 --- Sangat penting

``` text
Promotion
Voucher
Membership
Branch
Shipping
CMS
SEO
Notification
Reports
```

### P2 --- Pengembangan

``` text
POS
Service Center
Trade-In
Affiliate
Advanced CRM
Advanced Analytics
AI
Recommendation
```

------------------------------------------------------------------------

# 40. Prinsip Arsitektur

## Jangan membuat website terlebih dahulu lalu memikirkan admin belakangan.

Bangun dari awal dengan konsep:

``` text
DATA
 ↓
BUSINESS LOGIC
 ↓
API
 ↓
ADMIN
 ↓
PUBLIC WEBSITE
 ↓
CUSTOMER PORTAL
```

Dengan begitu satu data dapat digunakan banyak bagian sistem.

Contoh:

``` text
PRODUCT
   ↓
Public Website
   ↓
Customer
   ↓
Cart
   ↓
Order
   ↓
Inventory
   ↓
Accounting
   ↓
Analytics
```

------------------------------------------------------------------------

# 41. Konsep Dashboard Utama yang Disarankan

Admin membuka dashboard dan langsung melihat:

``` text
GOOD MORNING, ADMIN

Today's Overview

Revenue        Orders       Customers       Profit
Rp 18.2 JT     84           32              Rp 4.1 JT


SALES ANALYTICS
────────────────────────────────────────

Revenue Trend
[ Chart ]


ORDER PIPELINE
────────────────────────────────────────

Pending     Processing     Shipping     Completed
12          24             18           30


INVENTORY ALERT
────────────────────────────────────────

12 products low stock
5 products out of stock


TOP PRODUCTS
────────────────────────────────────────

1. Laptop ASUS...
2. SSD Kingston...
3. Monitor...


BRANCH PERFORMANCE
────────────────────────────────────────

Yogyakarta
Semarang
Solo
Purwokerto


RECENT ACTIVITY
────────────────────────────────────────

10:21 Order #INV-1201
10:19 Product updated
10:12 New customer
09:58 Stock transferred
```

------------------------------------------------------------------------

# 42. Diferensiasi dari Website Retail Biasa

Target sistem:

> **Website + E-commerce + CRM + Inventory + POS + Service + CMS +
> Analytics dalam satu ekosistem.**

Jadi admin tidak perlu berpindah-pindah aplikasi untuk:

-   melihat penjualan
-   mengecek stok
-   mengelola produk
-   mengelola pelanggan
-   membuat promo
-   mengelola service
-   mengelola cabang
-   membaca laporan

------------------------------------------------------------------------

# 43. Rekomendasi Struktur Project

Jika menggunakan Next.js:

``` text
src/
├── app/
│   ├── (public)/
│   ├── account/
│   ├── admin/
│   └── api/
│
├── components/
│   ├── ui/
│   ├── product/
│   ├── checkout/
│   ├── admin/
│   └── charts/
│
├── modules/
│   ├── auth/
│   ├── products/
│   ├── orders/
│   ├── inventory/
│   ├── customers/
│   ├── crm/
│   ├── promotions/
│   ├── service/
│   ├── tradein/
│   └── reports/
│
├── lib/
│   ├── db/
│   ├── auth/
│   ├── permissions/
│   ├── payments/
│   └── shipping/
│
└── types/
```

------------------------------------------------------------------------

# 44. Kesimpulan Konsep

Konsep yang paling tepat bukan sekadar:

> "Membuat website seperti ELS.ID."

Tetapi:

> **Membangun platform retail digital profesional dengan pengalaman
> storefront seperti ELS.ID dan backend operasional yang terintegrasi.**

Struktur ideal:

``` text
                    DIGITAL RETAIL PLATFORM
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   PUBLIC WEB            CUSTOMER PORTAL       ADMIN SYSTEM
        │                     │                     │
   Catalog               Orders                Products
   Promo                 Points                Inventory
   Blog                  Wishlist              Orders
   Branch                Service               Customers
   Service               Membership            CRM
        │                     │                 Marketing
        └─────────────────────┼───────────────── CMS
                              │                 Reports
                         BACKEND / API          POS
                              │                 Service
                              │                 Trade-In
                              ▼
                           DATABASE
                              │
                              ▼
                     ANALYTICS / BI / AI
```

**Target akhir:** admin memiliki satu pusat kendali untuk menjalankan
seluruh bisnis, sementara pelanggan mendapatkan pengalaman website yang
cepat, profesional, informatif, dan mudah digunakan.

------------------------------------------------------------------------

# 45. Referensi

-   ELS.ID --- website publik dan struktur katalog: https://els.id/
-   ELS Membership --- membership, poin, promo, riwayat transaksi,
    affiliate: https://member.els.id/
-   ELS CRM --- customer relationship management:
    https://member.els.id/crm
-   ELS Service Center: https://els.id/service-center/
-   ELS About: https://els.id/about-els/
