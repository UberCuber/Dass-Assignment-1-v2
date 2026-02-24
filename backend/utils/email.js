// Email utility - uses Brevo HTTP API (works on Render free tier)
// Falls back to Nodemailer SMTP for local development

const sendEmail = async (to, subject, html) => {
  // Brevo HTTP API (works on Render, no domain verification needed)
  if (process.env.BREVO_API_KEY) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Felicity Events', email: process.env.BREVO_SENDER || process.env.SMTP_USER || 'noreply@felicity.org' },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || JSON.stringify(data));
      console.log('Email sent via Brevo:', data.messageId);
      return data;
    } catch (error) {
      console.error('Brevo email error:', error.message);
      return null;
    }
  }

  // Fallback: Nodemailer SMTP (works locally with Gmail)
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const nodemailer = require('nodemailer');
      const port = parseInt(process.env.SMTP_PORT) || 465;
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port,
        secure: port === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        family: 4,
      });
      const info = await transporter.sendMail({
        from: `"Felicity Events" <${process.env.SMTP_USER}>`,
        to, subject, html,
      });
      console.log('Email sent via SMTP:', info.messageId);
      return info;
    } catch (error) {
      console.error('SMTP email error:', error.message);
      return null;
    }
  }

  console.log('No email provider configured (set BREVO_API_KEY or SMTP_USER/SMTP_PASS)');
  return null;
};

const sendTicketEmail = async (to, ticketData) => {
  const { eventName, participantName, ticketId, qrCode, eventDate, eventType } = ticketData;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px; text-align: center;">
        <h1 style="color: #111; margin-bottom: 5px;">Registration Confirmed</h1>
        <p style="color: #666; font-size: 14px;">Your ticket for the event</p>
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h2 style="color: #333; margin: 0 0 10px;">${eventName}</h2>
          <p style="color: #888; margin: 5px 0;">Type: ${eventType}</p>
          <p style="color: #888; margin: 5px 0;">Date: ${new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div style="margin: 20px 0;">
          <p style="color: #333; font-weight: bold;">Participant: ${participantName}</p>
          <p style="color: #111; font-size: 18px; font-weight: bold;">Ticket ID: ${ticketId}</p>
        </div>
        ${qrCode ? `<div style="margin: 20px 0;"><img src="${qrCode}" alt="QR Code" style="width: 200px; height: 200px;" /></div>` : ''}
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          Please present this ticket (or QR code) at the event venue.<br>
          Felicity Event Management System
        </p>
      </div>
    </div>`;
  return sendEmail(to, `Your Ticket for ${eventName} - ${ticketId}`, html);
};

const sendCredentialsEmail = async (to, credentials) => {
  const { organizerName, email, password } = credentials;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Welcome to Felicity, ${organizerName}!</h2>
      <p>Your organizer account has been created. Here are your login credentials:</p>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
      </div>
      <p style="color: #e74c3c;">Please change your password after your first login.</p>
    </div>`;
  return sendEmail(to, 'Your Organizer Account Credentials - Felicity', html);
};

module.exports = { sendTicketEmail, sendCredentialsEmail };
