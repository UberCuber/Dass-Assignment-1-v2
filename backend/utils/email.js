const nodemailer = require('nodemailer');

const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

const sendTicketEmail = async (to, ticketData) => {
    try {
        const transporter = createTransporter();

        const { eventName, participantName, ticketId, qrCode, eventDate, eventType } = ticketData;

        const mailOptions = {
            from: `"Felicity Events" <${process.env.SMTP_USER}>`,
            to,
            subject: `Your Ticket for ${eventName} - ${ticketId}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px;">
          <div style="background: white; border-radius: 8px; padding: 30px; text-align: center;">
            <h1 style="color: #667eea; margin-bottom: 5px;">🎉 Registration Confirmed!</h1>
            <p style="color: #666; font-size: 14px;">Your ticket for the event</p>
            
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="color: #333; margin: 0 0 10px 0;">${eventName}</h2>
              <p style="color: #888; margin: 5px 0;">Type: ${eventType}</p>
              <p style="color: #888; margin: 5px 0;">Date: ${new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            
            <div style="margin: 20px 0;">
              <p style="color: #333; font-weight: bold;">Participant: ${participantName}</p>
              <p style="color: #667eea; font-size: 18px; font-weight: bold;">Ticket ID: ${ticketId}</p>
            </div>
            
            ${qrCode ? `<div style="margin: 20px 0;"><img src="${qrCode}" alt="QR Code" style="width: 200px; height: 200px;" /></div>` : ''}
            
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              Please present this ticket (or QR code) at the event venue.<br>
              Felicity Event Management System
            </p>
          </div>
        </div>
      `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Ticket email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Email sending error:', error.message);
        // Don't throw - email failure shouldn't block registration
        return null;
    }
};

const sendCredentialsEmail = async (to, credentials) => {
    try {
        const transporter = createTransporter();
        const { organizerName, email, password } = credentials;

        const mailOptions = {
            from: `"Felicity Admin" <${process.env.SMTP_USER}>`,
            to,
            subject: `Your Organizer Account Credentials - Felicity`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Welcome to Felicity, ${organizerName}!</h2>
          <p>Your organizer account has been created. Here are your login credentials:</p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
          </div>
          <p style="color: #e74c3c;">Please change your password after your first login.</p>
        </div>
      `
        };

        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        console.error('Credentials email error:', error.message);
        return null;
    }
};

module.exports = { sendTicketEmail, sendCredentialsEmail };
