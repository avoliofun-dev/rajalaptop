// app/api/whatsapp/notify/route.js
import { NextResponse } from 'next/server';
import {
  sendWhatsAppNotification,
  buildOrderNotificationMsg,
  buildServiceNotificationMsg,
  buildApprovalNotificationMsg,
} from '@/lib/whatsappGateway';
import { getSettings } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, phone, data, recipientType } = body;

    const settings = (await getSettings()) || {};
    const storeName = settings.storeName || 'RajaLaptop';

    let message = '';
    let targetPhone = phone;

    if (type === 'ORDER') {
      message = buildOrderNotificationMsg({ order: data, storeName });
      targetPhone = phone || data.phone;
    } else if (type === 'SERVICE') {
      message = buildServiceNotificationMsg({ service: data, storeName });
      targetPhone = phone || data.phone;
    } else if (type === 'APPROVAL') {
      message = buildApprovalNotificationMsg({
        approval: data,
        requesterName: data.requesterName,
        storeName,
      });
      // Jika nomor tujuan adalah Kepala Toko / Admin
      targetPhone = phone || settings.whatsappNumber || '6281234567890';
    } else if (body.customMessage) {
      message = body.customMessage;
    } else {
      return NextResponse.json({ error: 'Tipe notifikasi tidak dikenal' }, { status: 400 });
    }

    const result = await sendWhatsAppNotification({
      phone: targetPhone,
      message,
      type,
    });

    return NextResponse.json({
      success: true,
      message: 'Notifikasi WhatsApp berhasil dikirim',
      result,
    });
  } catch (error) {
    console.error('API /api/whatsapp/notify error:', error);
    return NextResponse.json({ error: 'Gagal mengirim notifikasi WhatsApp: ' + error.message }, { status: 500 });
  }
}
