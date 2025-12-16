/**
 * Email Template Generator for Museo Bulawan
 * Simple, non-redundant email templates
 */

/**
 * Generate feedback response email
 * @param {string} visitorName - Visitor name
 * @param {string} message - Response message
 * @param {object} appointmentDetails - Optional appointment details
 * @param {string} status - Status for automatic messaging (REVIEWED, RESPONDED, RESOLVED)
 * @returns {string} HTML email
 */
export const generateFeedbackResponseEmail = ({
  visitorName = 'Valued Visitor',
  message = '',
  appointmentDetails = null,
  status = 'GENERAL'
}) => {
  const safeMessage = String(message || '').trim();

  // Determine status banner color and text
  // SUBMITTED = Automatic acknowledgment sent to visitor
  // REVIEWED = Feedback reviewed by team (admin internal status, not sent to visitor)
  // RESPONDED = Admin has sent a response message
  // RESOLVED = Feedback resolved with final message
  let statusBannerColor = '#4CAF50';
  let statusBannerText = '✓ Feedback Received';
  let statusMessage = 'Thank you for taking the time to share your feedback with Museo Bulawan. We truly appreciate your input and will use it to improve our services.';
  let statusUpdate = '';

  if (status === 'SUBMITTED') {
    // Automatic acknowledgment email
    statusBannerColor = '#4CAF50';
    statusBannerText = '✓ Feedback Received';
    statusMessage = 'Thank you for taking the time to share your feedback with Museo Bulawan. We have received your submission and will review it carefully. You will receive further communication from us soon.';
    statusUpdate = '<p style="background:#E8F5E8;border-left:4px solid #4CAF50;padding:10px;margin:15px 0;font-weight:bold;color:#2E7D32">📝 Status Update: Your feedback has been <strong>RECEIVED</strong> successfully.</p>';
  } else if (status === 'RESPONDED') {
    // Admin response with custom message
    statusBannerColor = '#FF9800';
    statusBannerText = '💬 Response from Our Team';
    statusMessage = 'Thank you for your feedback. Our team has carefully reviewed your comments and wanted to reach out with the following response:';
    statusUpdate = '<p style="background:#FFF3E0;border-left:4px solid #FF9800;padding:10px;margin:15px 0;font-weight:bold;color:#E65100">📧 We have reviewed your feedback and prepared a response below.</p>';
  } else if (status === 'RESOLVED') {
    // Resolution email
    statusBannerColor = '#4CAF50';
    statusBannerText = '✅ Feedback Resolved';
    statusMessage = 'Your feedback has been addressed and marked as resolved. Thank you for helping us improve Museo Bulawan.';
    statusUpdate = '<p style="background:#E8F5E8;border-left:4px solid #4CAF50;padding:10px;margin:15px 0;font-weight:bold;color:#2E7D32">✅ Status Update: Your feedback has been <strong>RESOLVED</strong>.</p>';
  }

  return `<div style="font-family:serif;background:#fff;color:#333;padding:20px 0"><div style="max-width:600px;margin:0 auto;border:1px solid #E8C26A;border-radius:8px"><div style="background:#3E2F1C;text-align:center;padding:20px"><h2 style="margin:0;font-size:20px;color:#E8C26A">Museo Bulawan</h2><p style="margin:5px 0 0;font-size:13px;color:#F5E7C1">Preserving the Heritage of Camarines Norte</p></div><div style="padding:25px"><p>Dear <b>${visitorName}</b>,</p><p style="line-height:1.6">${statusMessage}</p>${statusUpdate}${appointmentDetails ? `<div style="background:#FBF6EC;border:1px solid #D9B868;margin:15px 0;padding:15px"><h3 style="margin:0 0 8px 0;font-size:15px;color:#C19A3D">📅 Visit Details</h3><p style="margin:5px 0;font-size:14px"><b>Date:</b> ${appointmentDetails.preferredDate}<br><b>Time:</b> ${appointmentDetails.preferredTime}<br><b>Purpose:</b> ${appointmentDetails.purpose}<br><b>Visitors:</b> ${appointmentDetails.populationCount || 'N/A'}</p></div>` : ''}${safeMessage && safeMessage.trim() ? `<div style="background:#FFF9E8;border-left:3px solid #E8C26A;padding:15px;margin:15px 0"><h4 style="margin:0 0 5px 0;color:#C19A3D;font-size:14px">📨 Our Response:</h4><p style="margin:0;color:#665332;font-size:14px">${safeMessage}</p></div>` : ''}<p style="color:#826723;font-size:14px;margin:15px 0 0 0">Thank you for your valuable feedback!</p><p style="margin:10px 0 0 0;color:#3D3525">Best regards,<br><b style="color:#C19A3D">The Museo Bulawan Team</b></p></div><div style="background:#F5E7C1;text-align:center;padding:15px;font-size:12px;color:#665332"><p style="margin:0 0 8px 0"><a href="https://museobulawan.online" style="color:#85621A">museobulawan.online</a></p><p style="margin:0 0 8px 0"><span style="margin:0 8px"><img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="FB" width="20" height="20" style="vertical-align:middle"/> <a href="https://facebook.com/museobulawancn" style="color:#3E2F1C">Facebook</a></span> | <span style="margin:0 8px"><img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="IG" width="20" height="20" style="vertical-align:middle"/> <a href="https://instagram.com/museobulawanofficial" style="color:#3E2F1C">Instagram</a></span> | <span style="margin:0 8px"><img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" alt="TT" width="20" height="20" style="vertical-align:middle"/> <a href="https://tiktok.com/@museobulawan" style="color:#3E2F1C">TikTok</a></span> | <span style="margin:0 8px"><img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" alt="YT" width="20" height="20" style="vertical-align:middle"/> <a href="https://youtube.com/@museobulawanofficial" style="color:#3E2F1C">YouTube</a></span></p><p style="margin:0 0 8px 0;font-size:11px">📧 museobulawanmis@gmail.com | 📍 Camarines Norte Provincial Capitol Grounds, Daet</p><p style="font-size:11px;color:#A09068;margin:5px 0 0 0">&copy; ${new Date().getFullYear()} Museo Bulawan. Automated message, do not reply.</p></div></div></div>`;
};

/**
 * Strip HTML tags from text for plain text email fallback
 * @param {string} html - HTML content
 * @returns {string} - Plain text
 */
export const stripHtmlTags = (html) => {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\n\n+/g, '\n\n')
    .trim();
};
