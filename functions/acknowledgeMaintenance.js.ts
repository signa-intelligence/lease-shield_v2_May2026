import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token, action, status, landlordResponse, actualCost, completionPhotoUrls, billPhotoUrls } = await req.json();

    if (!token) {
      return Response.json({ error: 'Missing token' }, { status: 400 });
    }

    // Find maintenance request by token
    const requests = await base44.asServiceRole.entities.MaintenanceRequest.filter({
      acknowledgment_token: token
    });

    if (!requests || requests.length === 0) {
      return Response.json({ error: 'Invalid or expired token' }, { status: 404 });
    }

    const maintenanceRequest = requests[0];

    // If action is 'get', just return the request
    if (action === 'get') {
      return Response.json({ 
        success: true,
        maintenanceRequest: maintenanceRequest
      });
    }

    // If action is 'update', update the status
    if (action === 'update') {
      if (!status) {
        return Response.json({ error: 'Missing status' }, { status: 400 });
      }

      const updateData = {
        status: status,
        acknowledged_date: new Date().toISOString()
      };

      if (landlordResponse) {
        updateData.landlord_response = landlordResponse;
      }

      if (actualCost !== undefined && actualCost !== null) {
        updateData.actual_cost = actualCost;
      }

      if (completionPhotoUrls && completionPhotoUrls.length > 0) {
        updateData.completion_photo_urls = completionPhotoUrls;
      }

      if (billPhotoUrls && billPhotoUrls.length > 0) {
        updateData.bill_photo_urls = billPhotoUrls;
      }

      if (status === 'completed') {
        updateData.resolved_date = new Date().toISOString().split('T')[0];
      }

      await base44.asServiceRole.entities.MaintenanceRequest.update(maintenanceRequest.id, updateData);

      // Get tenant user data to send notification
      const tenantEmail = maintenanceRequest.created_by;
      const users = await base44.asServiceRole.entities.User.filter({ email: tenantEmail });
      
      if (users && users.length > 0) {
        const tenant = users[0];
        const language = tenant.language || 'en';

        const subject = language === 'th'
          ? `🔔 อัปเดตคำขอซ่อม: ${maintenanceRequest.issue_title}`
          : `🔔 Maintenance Update: ${maintenanceRequest.issue_title}`;

        const statusLabels = {
          en: {
            acknowledged: 'Acknowledged',
            in_progress: 'In Progress',
            completed: 'Completed',
            rejected: 'Rejected'
          },
          th: {
            acknowledged: 'รับทราบแล้ว',
            in_progress: 'กำลังดำเนินการ',
            completed: 'เสร็จสิ้น',
            rejected: 'ถูกปฏิเสธ'
          }
        };

        const statusLabel = statusLabels[language][status] || status;
        const statusColor = status === 'completed' ? '#10B981' : 
                           status === 'in_progress' ? '#F59E0B' : 
                           status === 'acknowledged' ? '#6366F1' : '#EF4444';

        // Build photo sections for email
        let completionPhotosHtml = '';
        if (completionPhotoUrls && completionPhotoUrls.length > 0) {
          const photosGrid = completionPhotoUrls.map(url => 
            `<img src="${url}" style="width: 150px; height: 150px; object-fit: cover; border-radius: 8px; margin: 5px;" />`
          ).join('');
          completionPhotosHtml = language === 'th'
            ? `<div style="margin: 20px 0;">
                <p style="font-weight: bold; margin-bottom: 10px;">📸 รูปงานซ่อมเสร็จแล้ว:</p>
                <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                  ${photosGrid}
                </div>
              </div>`
            : `<div style="margin: 20px 0;">
                <p style="font-weight: bold; margin-bottom: 10px;">📸 Completion Photos:</p>
                <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                  ${photosGrid}
                </div>
              </div>`;
        }

        let billPhotosHtml = '';
        if (billPhotoUrls && billPhotoUrls.length > 0) {
          const billsGrid = billPhotoUrls.map(url => 
            `<img src="${url}" style="width: 150px; height: 150px; object-fit: cover; border-radius: 8px; margin: 5px;" />`
          ).join('');
          billPhotosHtml = language === 'th'
            ? `<div style="margin: 20px 0;">
                <p style="font-weight: bold; margin-bottom: 10px;">🧾 ใบเสร็จ/บิล:</p>
                <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                  ${billsGrid}
                </div>
              </div>`
            : `<div style="margin: 20px 0;">
                <p style="font-weight: bold; margin-bottom: 10px;">🧾 Bills/Receipts:</p>
                <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                  ${billsGrid}
                </div>
              </div>`;
        }

        const emailBody = language === 'th'
          ? `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(to right, #0C3B2E, #047857); padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="color: white; margin: 0;">🔔 อัปเดตคำขอซ่อม</h2>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${statusColor};">
                <h3 style="color: #0C3B2E; margin-top: 0;">${maintenanceRequest.issue_title}</h3>
                <p style="margin: 15px 0;"><strong>สถานะใหม่:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusLabel}</span></p>
                ${actualCost ? `<p style="margin: 10px 0;"><strong>ค่าใช้จ่ายจริง:</strong> ฿${parseFloat(actualCost).toLocaleString()}</p>` : ''}
                ${landlordResponse ? `
                <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <p style="margin: 0; color: #666; font-size: 14px;"><strong>ข้อความจาก${tenant.landlord_name || 'เจ้าของบ้าน'}:</strong></p>
                  <p style="margin: 5px 0 0 0; color: #1a1d1f;">${landlordResponse}</p>
                </div>
                ` : ''}
                ${completionPhotosHtml}
                ${billPhotosHtml}
                <p style="font-size: 12px; color: #999; margin-top: 20px;">อัปเดตเมื่อ: ${new Date().toLocaleString('th-TH')}</p>
              </div>
              <p style="font-size: 10px; color: #999; text-align: center; margin-top: 20px;">ส่งจาก Lease Shield - www.leaseshield.asia</p>
            </div>
          </div>
          `
          : `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(to right, #0C3B2E, #047857); padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="color: white; margin: 0;">🔔 Maintenance Update</h2>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${statusColor};">
                <h3 style="color: #0C3B2E; margin-top: 0;">${maintenanceRequest.issue_title}</h3>
                <p style="margin: 15px 0;"><strong>New Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusLabel}</span></p>
                ${actualCost ? `<p style="margin: 10px 0;"><strong>Actual Cost:</strong> ฿${parseFloat(actualCost).toLocaleString()}</p>` : ''}
                ${landlordResponse ? `
                <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <p style="margin: 0; color: #666; font-size: 14px;"><strong>Message from ${tenant.landlord_name || 'landlord'}:</strong></p>
                  <p style="margin: 5px 0 0 0; color: #1a1d1f;">${landlordResponse}</p>
                </div>
                ` : ''}
                ${completionPhotosHtml}
                ${billPhotosHtml}
                <p style="font-size: 12px; color: #999; margin-top: 20px;">Updated: ${new Date().toLocaleString('en-US')}</p>
              </div>
              <p style="font-size: 10px; color: #999; text-align: center; margin-top: 20px;">Sent from Lease Shield - www.leaseshield.asia</p>
            </div>
          </div>
          `;

        try {
          await base44.integrations.Core.SendEmail({
            to: tenant.email,
            subject: subject,
            body: emailBody
          });
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError);
        }
      }

      return Response.json({ 
        success: true,
        maintenanceRequest: {
          ...maintenanceRequest,
          ...updateData
        }
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Acknowledge maintenance error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});