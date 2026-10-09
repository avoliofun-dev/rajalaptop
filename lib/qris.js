/**
 * lib/qris.js
 * Utility Generator Standar EMVCo / QRIS Dinamis Indonesia
 * Menghasilkan string payload QRIS Standar Bank Indonesia (ASPI / EMVCo MPM)
 * dengan CRC16-CCITT (0xFFFF) validasi checksum.
 */

// Menghitung Checksum CRC16 CCITT (Polynomial 0x1021)
export function calculateCRC16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  let hex = (crc & 0xffff).toString(16).toUpperCase();
  return hex.padStart(4, '0');
}

/**
 * Format Tag EMV: Tag + Length (2 digit) + Value
 */
export function formatTag(tag, value) {
  const strVal = String(value || '');
  const len = strVal.length.toString().padStart(2, '0');
  return `${tag}${len}${strVal}`;
}

/**
 * Buat Payload QRIS Dinamis Standar Nasional (ASPI / Bank Indonesia)
 * @param {Object} params
 * @param {string} params.orderId - ID Pesanan unik (contoh: RL-9821)
 * @param {number} params.amount - Total nominal pembayaran dalam Rupiah
 * @param {string} [params.storeName] - Nama merchant toko
 * @param {string} [params.city] - Kota merchant
 */
export function generateDynamicQRIS({
  orderId,
  amount,
  storeName = 'RAJALAPTOP INDONESIA',
  city = 'PEKALONGAN'
}) {
  const sanitizedStore = storeName.toUpperCase().slice(0, 25);
  const sanitizedCity = city.toUpperCase().slice(0, 15);
  const roundedAmount = Math.round(Number(amount) || 0);

  // Payload bagian depan tanpa CRC
  // 00: Payload Format Indicator (01)
  // 01: Point of Initiation Method (12 = Dynamic QR)
  // 26: Merchant Account Information (NMID / Reverse Domain)
  // 51: Merchant Account Information 2 (ID.CO.QRIS.WWW)
  // 52: Merchant Category Code (5732 = Electronics Stores)
  // 53: Transaction Currency (360 = IDR)
  // 54: Transaction Amount
  // 58: Country Code (ID)
  // 59: Merchant Name
  // 60: Merchant City
  // 61: Postal Code (51111)
  // 62: Additional Data Field (Invoice / Reference ID)

  const nmidSub = formatTag('00', 'ID.CO.QRIS.WWW') + formatTag('01', 'ID1026093019821');
  const merchantAccountInfo = formatTag('26', nmidSub);

  const additionalSub = formatTag('01', orderId.slice(0, 25)) + formatTag('07', 'RLPT');
  const additionalData = formatTag('62', additionalSub);

  let raw = '';
  raw += formatTag('00', '01');
  raw += formatTag('01', '12'); // 12 = Dynamic QR
  raw += merchantAccountInfo;
  raw += formatTag('52', '5732'); // Electronic Store
  raw += formatTag('53', '360');  // IDR
  raw += formatTag('54', String(roundedAmount));
  raw += formatTag('58', 'ID');
  raw += formatTag('59', sanitizedStore);
  raw += formatTag('60', sanitizedCity);
  raw += formatTag('61', '51111');
  raw += additionalData;

  // Tag 63: CRC16 Checksum
  raw += '6304';
  const checksum = calculateCRC16(raw);
  const fullQRIS = raw + checksum;

  return {
    rawPayload: fullQRIS,
    orderId,
    amount: roundedAmount,
    storeName: sanitizedStore,
    city: sanitizedCity,
    checksum,
    generatedAt: new Date().toISOString()
  };
}
