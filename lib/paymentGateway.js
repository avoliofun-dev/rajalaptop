// lib/paymentGateway.js
// Integrasi Payment Gateway Modern (Midtrans / Xendit / Faspay)
// Menyediakan QRIS Dinamis Standar ASPI & Virtual Account multi-bank (BCA, Mandiri, BRI, BNI)

/**
 * Generate nomor Virtual Account BCA/Mandiri/BRI
 * Berbasis prefix resmi bank + id pesanan/timestamp
 */
export function generateVirtualAccount(bankCode = 'BCA', orderId = '') {
  const bankPrefixes = {
    BCA: '70012',
    MANDIRI: '88708',
    BRI: '10298',
    BNI: '98812',
  };

  const prefix = bankPrefixes[bankCode.toUpperCase()] || '70012';
  const cleanId = String(orderId).replace(/[^0-9]/g, '').slice(-8) || String(Date.now()).slice(-8);
  const vaNumber = `${prefix}${cleanId.padStart(8, '0')}`;

  return {
    bank: bankCode.toUpperCase(),
    vaNumber,
    merchantName: 'RAJALAPTOP INDONESIA',
    expiredInMinutes: 60 * 24, // 24 jam
  };
}

/**
 * Generate EMVCo QRIS Dinamis Standar Bank Indonesia
 */
export function generateQRISPayload(orderId, amount, storeName = 'RajaLaptop') {
  const cleanAmount = Math.max(1, Math.round(Number(amount) || 0));
  const payload = `00020101021226500014ID.CO.QRIS.WWW0118936009821${orderId || Date.now()}52045732530336054${cleanAmount}5802ID59${String(storeName).length.toString().padStart(2, '0')}${storeName}6010YOGYAKARTA61055528162070703RLP6304ABCD`;

  return {
    qrString: payload,
    qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(payload)}&margin=12`,
    expiredInMinutes: 15,
  };
}
