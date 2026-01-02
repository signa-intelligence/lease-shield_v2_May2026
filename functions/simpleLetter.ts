import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { subject, tenant_name, landlord_name, property_address, deposit_amount } = await req.json();
    
    if (!tenant_name || !landlord_name) {
      return Response.json({ error: 'Names required' }, { status: 400 });
    }

    // Simple letter text
    let letter = '';
    
    if (subject === 'deposit') {
      letter = `To: ${landlord_name}
From: ${tenant_name}
Re: Security Deposit Return Request

Dear ${landlord_name},

I am writing to request the return of my security deposit for the property at ${property_address || '[Property Address]'}.

The lease has ended and I have vacated the property. I paid a deposit of ${deposit_amount || '[Amount]'} THB.

Please return the deposit within 14 days or provide an itemized list of any deductions.

Thank you,
${tenant_name}

---

เรียน ${landlord_name}
จาก ${tenant_name}
เรื่อง ขอคืนเงินประกัน

เรียน ${landlord_name}

ข้าพเจ้าเขียนจดหมายนี้เพื่อขอคืนเงินประกันสำหรับทรัพย์สิน ${property_address || '[ที่อยู่ทรัพย์สิน]'}

สัญญาเช่าสิ้นสุดแล้วและข้าพเจ้าได้ย้ายออกแล้ว ข้าพเจ้าได้ชำระเงินประกัน ${deposit_amount || '[จำนวนเงิน]'} บาท

กรุณาคืนเงินประกันภายใน 14 วัน หรือแจ้งรายการหักเงิน (ถ้ามี)

ขอบคุณครับ/ค่ะ
${tenant_name}`;
    } else if (subject === 'damages') {
      letter = `To: ${landlord_name}
From: ${tenant_name}
Re: Dispute of Damage Claims

Dear ${landlord_name},

I received your claim for damages at ${property_address || '[Property Address]'}.

I respectfully dispute this claim. The property was in good condition when I left.

Please provide itemized evidence (photos, receipts) for any claimed damages.

Thank you,
${tenant_name}

---

เรียน ${landlord_name}
จาก ${tenant_name}
เรื่อง โต้แย้งค่าเสียหาย

เรียน ${landlord_name}

ข้าพเจ้าได้รับการเรียกค่าเสียหายสำหรับ ${property_address || '[ที่อยู่ทรัพย์สิน]'}

ข้าพเจ้าขอโต้แย้งการเรียกร้องนี้ ทรัพย์สินอยู่ในสภาพดีเมื่อข้าพเจ้าย้ายออก

กรุณาแจ้งรายละเอียดพร้อมหลักฐาน (รูปภาพ ใบเสร็จ) สำหรับความเสียหายที่อ้าง

ขอบคุณครับ/ค่ะ
${tenant_name}`;
    } else {
      letter = `To: ${landlord_name}
From: ${tenant_name}
Re: Lease Termination Notice

Dear ${landlord_name},

I am writing to inform you of my intention to terminate the lease for ${property_address || '[Property Address]'}.

Please let me know the termination process and any fees.

Thank you,
${tenant_name}

---

เรียน ${landlord_name}
จาก ${tenant_name}
เรื่อง แจ้งยกเลิกสัญญาเช่า

เรียน ${landlord_name}

ข้าพเจ้าเขียนจดหมายนี้เพื่อแจ้งความประสงค์ยกเลิกสัญญาเช่าสำหรับ ${property_address || '[ที่อยู่ทรัพย์สิน]'}

กรุณาแจ้งขั้นตอนการยกเลิกและค่าธรรมเนียม (ถ้ามี)

ขอบคุณครับ/ค่ะ
${tenant_name}`;
    }

    // Save as text file
    const blob = new Blob([letter], { type: 'text/plain; charset=utf-8' });
    const file = new File([blob], `letter_${Date.now()}.txt`, { type: 'text/plain' });
    
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    await base44.entities.Document.create({
      type: 'letter',
      file_url,
      label: `Letter - ${subject}`
    });

    return Response.json({ 
      success: true,
      url: file_url
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});