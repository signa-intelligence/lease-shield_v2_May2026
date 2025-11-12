import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token, action, status, message, role, completionPhotoUrls, billPhotoUrls } = await req.json();

    console.log('🔍 === ACKNOWLEDGMENT REQUEST START ===');
    console.log('📥 Request payload:', { token, action, status, role, hasMessage: !!message });

    if (!token) {
      return Response.json({ error: 'Missing token' }, { status: 400 });
    }

    // Find maintenance request by token
    const requests = await base44.asServiceRole.entities.MaintenanceRequest.filter({
      acknowledgment_token: token
    });

    if (!requests || requests.length === 0) {
      console.error('❌ No maintenance request found for token:', token);
      return Response.json({ error: 'Invalid or expired token' }, { status: 404 });
    }

    const maintenanceRequest = requests[0];
    console.log('✅ Found maintenance request:', maintenanceRequest.id);
    console.log('📝 Created by:', maintenanceRequest.created_by);

    // If action is 'view', just return the request
    if (action === 'view') {
      return Response.json({ 
        success: true,
        maintenanceRequest: maintenanceRequest
      });
    }

    // If action is 'update', update the status and add to communication log
    if (action === 'update') {
      if (!status || !message || !role) {
        console.error('❌ Missing required fields:', { status, hasMessage: !!message, role });
        return Response.json({ error: 'Missing required fields' }, { status: 400 });
      }

      console.log('📝 === UPDATE ACTION STARTING ===');

      // ========================================
      // CRITICAL FIX: Use list() instead of filter()
      // ========================================
      console.log('🔍 Fetching tenant user data using list()...');
      const allUsers = await base44.asServiceRole.entities.User.list();
      const tenant = allUsers.find(u => u.email === maintenanceRequest.created_by);
      
      if (!tenant) {
        console.error('❌ Tenant user not found:', maintenanceRequest.created_by);
        console.log('📋 All user emails:', allUsers.map(u => u.email));
        return Response.json({ error: 'Tenant not found' }, { status: 404 });
      }

      console.log('✅ === TENANT USER DATA LOADED ===');
      console.log('📧 Email:', tenant.email);
      console.log('📋 Full tenant object keys:', Object.keys(tenant));
      console.log('📱 line_messaging_token:', tenant.line_messaging_token || 'NOT SET');
      console.log('📱 line_user_id:', tenant.line_user_id || 'NOT SET');
      console.log('🔔 line_notifications:', tenant.line_notifications);
      console.log('🔔 email_notifications:', tenant.email_notifications);
      console.log('🌐 language:', tenant.language || 'en');

      const language = tenant.language || 'en';
      const senderName = role === 'landlord' 
        ? (tenant.landlord_name || 'Landlord')
        : (tenant.juristic_name || 'Juristic Office');
      const senderEmail = role === 'landlord'
        ? (tenant.landlord_email || '')
        : (tenant.juristic_email || '');

      console.log('👤 Sender info:', { role, senderName, senderEmail });

      // Build new log entry
      const newLogEntry = {
        timestamp: new Date().toISOString(),
        message: message,
        sender: role,
        sender_name: senderName,
        sender_email: senderEmail,
        action_type: status === maintenanceRequest.status ? 'message' : 'status_change',
        metadata: {
          old_status: maintenanceRequest.status,
          new_status: status,
          has_completion_photos: completionPhotoUrls?.length > 0,
          has_bills: billPhotoUrls?.length > 0
        }
      };

      // Append to existing communication log
      const updatedLog = [...(maintenanceRequest.communication_log || []), newLogEntry];

      const updateData = {
        status: status,
        acknowledged_date: new Date().toISOString(),
        communication_log: updatedLog
      };

      if (completionPhotoUrls && completionPhotoUrls.length > 0) {
        updateData.completion_photo_urls = [
          ...(maintenanceRequest.completion_photo_urls || []),
          ...completionPhotoUrls
        ];
      }

      if (billPhotoUrls && billPhotoUrls.length > 0) {
        updateData.bill_photo_urls = [
          ...(maintenanceRequest.bill_photo_urls || []),
          ...billPhotoUrls
        ];
      }

      if (status === 'completed') {
        updateData.resolved_date = new Date().toISOString().split('T')[0];
      }

      console.log('💾 Updating maintenance request...');
      await base44.asServiceRole.entities.MaintenanceRequest.update(maintenanceRequest.id, updateData);
      console.log('✅ Maintenance request updated successfully');

      // Track notification results
      let lineSent = false;
      let emailSent = false;
      let lineError = null;
      let emailError = null;

      // ========================================
      // SEND LINE NOTIFICATION TO TENANT
      // ========================================
      console.log('');
      console.log('📱 === STEP 1: LINE NOTIFICATION ===');
      
      // Try both possible token fields
      const lineToken = tenant.line_messaging_token || tenant.line_user_id;
      
      if (!lineToken) {
        console.log('⚠️ LINE Token not set (checked both line_messaging_token and line_user_id)');
        console.log('📋 Tenant data:', JSON.stringify(tenant, null, 2));
      } else if (tenant.line_notifications === false) {
        console.log('⚠️ LINE notifications disabled by user');
      } else {
        console.log('✅ Prerequisites met - attempting LINE notification');
        console.log('🎯 Target LINE User ID:', lineToken);
        
        try {
          // Create Flex message
          const statusEmoji = {
            acknowledged: '👀',
            in_progress: '⚙️',
            completed: '✅',
            rejected: '❌'
          };

          const statusColors = {
            acknowledged: '#6366F1',
            in_progress: '#F59E0B',
            completed: '#10B981',
            rejected: '#EF4444'
          };

          const emoji = statusEmoji[status] || '🔔';
          const statusColor = statusColors[status] || '#6366F1';

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

          const updateFlexMessage = {
            altText: language === 'th' 
              ? `🔔 อัปเดต: ${maintenanceRequest.issue_title}` 
              : `🔔 Update: ${maintenanceRequest.issue_title}`,
            contents: {
              type: 'bubble',
              size: 'mega',
              header: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      {
                        type: 'text',
                        text: emoji,
                        size: 'xl',
                        weight: 'bold'
                      },
                      {
                        type: 'text',
                        text: language === 'th' ? 'อัปเดตคำขอซ่อม' : 'Maintenance Update',
                        weight: 'bold',
                        size: 'lg',
                        color: '#FFFFFF',
                        flex: 1,
                        margin: 'md'
                      }
                    ]
                  },
                  {
                    type: 'text',
                    text: language === 'th' ? `จาก ${senderName}` : `From ${senderName}`,
                    color: '#FFFFFF',
                    size: 'sm',
                    margin: 'sm'
                  }
                ],
                backgroundColor: statusColor,
                paddingAll: '20px'
              },
              body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                      {
                        type: 'text',
                        text: maintenanceRequest.issue_title,
                        weight: 'bold',
                        size: 'md',
                        color: '#0C3B2E',
                        wrap: true
                      },
                      {
                        type: 'separator',
                        margin: 'md'
                      },
                      {
                        type: 'box',
                        layout: 'baseline',
                        contents: [
                          {
                            type: 'text',
                            text: language === 'th' ? 'สถานะใหม่:' : 'New Status:',
                            color: '#8B8B8B',
                            size: 'sm',
                            flex: 0
                          },
                          {
                            type: 'text',
                            text: statusLabel,
                            weight: 'bold',
                            size: 'md',
                            color: statusColor,
                            flex: 1,
                            margin: 'md'
                          }
                        ],
                        margin: 'lg'
                      }
                    ]
                  },
                  {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                      {
                        type: 'text',
                        text: message.length > 200 ? message.substring(0, 200) + '...' : message,
                        size: 'sm',
                        color: '#6B7280',
                        wrap: true
                      }
                    ],
                    margin: 'xl',
                    paddingAll: '12px',
                    backgroundColor: '#F9FAFB',
                    cornerRadius: 'md'
                  },
                  ...(completionPhotoUrls && completionPhotoUrls.length > 0 ? [{
                    type: 'box',
                    layout: 'baseline',
                    contents: [
                      {
                        type: 'text',
                        text: '📸',
                        size: 'sm',
                        flex: 0
                      },
                      {
                        type: 'text',
                        text: language === 'th' 
                          ? `${completionPhotoUrls.length} รูปงานเสร็จแล้ว` 
                          : `${completionPhotoUrls.length} completion photos`,
                        size: 'sm',
                        color: '#10B981',
                        weight: 'bold',
                        flex: 1,
                        margin: 'sm'
                      }
                    ],
                    margin: 'md'
                  }] : []),
                  ...(billPhotoUrls && billPhotoUrls.length > 0 ? [{
                    type: 'box',
                    layout: 'baseline',
                    contents: [
                      {
                        type: 'text',
                        text: '🧾',
                        size: 'sm',
                        flex: 0
                      },
                      {
                        type: 'text',
                        text: language === 'th' 
                          ? `${billPhotoUrls.length} ใบเสร็จ/บิล` 
                          : `${billPhotoUrls.length} bills/receipts`,
                        size: 'sm',
                        color: '#3B82F6',
                        weight: 'bold',
                        flex: 1,
                        margin: 'sm'
                      }
                    ],
                    margin: 'md'
                  }] : [])
                ],
                paddingAll: '20px'
              },
              footer: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'button',
                    action: {
                      type: 'uri',
                      label: language === 'th' ? 'ดูรายละเอียดเต็ม' : 'View Full Details',
                      uri: 'https://app.leaseshield.asia/MaintenanceTracker'
                    },
                    style: 'primary',
                    color: '#0C3B2E',
                    height: 'sm'
                  }
                ],
                paddingAll: '12px'
              },
              styles: {
                footer: {
                  separator: false
                }
              }
            }
          };

          console.log('📦 Flex message structure created');
          console.log('🚀 Calling sendLineMessage function...');

          const lineResponse = await base44.asServiceRole.functions.invoke('sendLineMessage', {
            userId: lineToken,
            flexMessage: updateFlexMessage
          });

          console.log('📥 LINE function response received:', JSON.stringify(lineResponse.data, null, 2));

          if (lineResponse.data?.success) {
            console.log('🎉 LINE NOTIFICATION SENT SUCCESSFULLY!');
            lineSent = true;
          } else {
            console.error('❌ LINE function returned success=false:', lineResponse.data);
            lineError = lineResponse.data?.error || 'Unknown error';
          }
        } catch (error) {
          console.error('❌ === LINE NOTIFICATION ERROR ===');
          console.error('Error type:', error.constructor.name);
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
          lineError = error.message;
        }
      }

      // ========================================
      // SEND EMAIL NOTIFICATION TO TENANT
      // ========================================
      console.log('');
      console.log('📧 === STEP 2: EMAIL NOTIFICATION ===');
      
      if (!tenant.email) {
        console.log('⚠️ No email address - skipping email notification');
      } else if (tenant.email_notifications === false) {
        console.log('⚠️ Email notifications disabled by user - skipping');
      } else {
        console.log('✅ Prerequisites met - attempting email notification');
        console.log('📬 Target email:', tenant.email);
        
        try {
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

          // Build photo sections
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

          const subject = language === 'th'
            ? `🔔 อัปเดตคำขอซ่อม: ${maintenanceRequest.issue_title}`
            : `🔔 Maintenance Update: ${maintenanceRequest.issue_title}`;

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
                  <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p style="margin: 0; color: #666; font-size: 14px;"><strong>ข้อความจาก ${senderName}:</strong></p>
                    <p style="margin: 5px 0 0 0; color: #1a1d1f;">${message}</p>
                  </div>
                  ${completionPhotosHtml}
                  ${billPhotosHtml}
                  <p style="font-size: 12px; color: #999; margin-top: 20px;">อัปเดตเมื่อ: ${new Date().toLocaleString('th-TH')}</p>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                  <a href="https://app.leaseshield.asia/MaintenanceTracker" style="display: inline-block; background-color: #0C3B2E; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    ดูรายละเอียดเต็ม
                  </a>
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
                  <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p style="margin: 0; color: #666; font-size: 14px;"><strong>Message from ${senderName}:</strong></p>
                    <p style="margin: 5px 0 0 0; color: #1a1d1f;">${message}</p>
                  </div>
                  ${completionPhotosHtml}
                  ${billPhotosHtml}
                  <p style="font-size: 12px; color: #999; margin-top: 20px;">Updated: ${new Date().toLocaleString('en-US')}</p>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                  <a href="https://app.leaseshield.asia/MaintenanceTracker" style="display: inline-block; background-color: #0C3B2E; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    View Full Details
                  </a>
                </div>
                <p style="font-size: 10px; color: #999; text-align: center; margin-top: 20px;">Sent from Lease Shield - www.leaseshield.asia</p>
              </div>
            </div>
            `;

          console.log('📝 Email content prepared');
          console.log('🚀 Calling SendEmail integration...');

          await base44.integrations.Core.SendEmail({
            to: tenant.email,
            subject: subject,
            body: emailBody
          });

          console.log('🎉 EMAIL SENT SUCCESSFULLY!');
          emailSent = true;
        } catch (error) {
          console.error('❌ === EMAIL NOTIFICATION ERROR ===');
          console.error('Error type:', error.constructor.name);
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
          emailError = error.message;
        }
      }

      // ========================================
      // FINAL SUMMARY
      // ========================================
      console.log('');
      console.log('📊 === NOTIFICATION SUMMARY ===');
      console.log('📧 Email:', emailSent ? '✅ SENT' : `❌ FAILED (${emailError || 'prerequisites not met'})`);
      console.log('📱 LINE:', lineSent ? '✅ SENT' : `❌ FAILED (${lineError || 'prerequisites not met'})`);
      console.log('✅ === ACKNOWLEDGMENT COMPLETE ===');
      console.log('');

      return Response.json({ 
        success: true,
        message: 'Update successful',
        lineSent: lineSent,
        emailSent: emailSent,
        debug: {
          lineError: lineError,
          emailError: emailError,
          tenantEmail: tenant.email,
          tenantLineToken: (tenant.line_messaging_token || tenant.line_user_id) ? 'SET' : 'NOT_SET',
          emailNotificationsEnabled: tenant.email_notifications !== false,
          lineNotificationsEnabled: tenant.line_notifications !== false
        },
        maintenanceRequest: {
          ...maintenanceRequest,
          ...updateData
        }
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('❌ === CRITICAL ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});