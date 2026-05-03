import pkg from 'nodemailer';
const { createTransport } = pkg;

// Email configuration
const transporter = createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Email templates
const templates = {
  welcome: (name) => ({
    subject: 'Welcome to TutorXpert!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Welcome to TutorXpert, ${name}!</h1>
        <p>We're excited to have you join our learning community.</p>
        <p>Get started by:</p>
        <ul>
          <li>Completing your profile</li>
          <li>Browsing our expert tutors</li>
          <li>Booking your first session</li>
        </ul>
        <a href="${process.env.FRONTEND_URL}/dashboard" 
           style="display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          Go to Dashboard
        </a>
      </div>
    `
  }),

  bookingConfirmed: (data) => ({
    subject: 'Booking Confirmed - TutorXpert',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Your Session is Confirmed!</h1>
        <p>Hi ${data.learnerName},</p>
        <p>Your tutoring session has been confirmed.</p>
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Tutor:</strong> ${data.tutorName}</p>
          <p><strong>Subject:</strong> ${data.subjectName}</p>
          <p><strong>Date & Time:</strong> ${new Date(data.scheduledAt).toLocaleString()}</p>
          <p><strong>Duration:</strong> ${data.durationMinutes} minutes</p>
        </div>
        <a href="${process.env.FRONTEND_URL}/bookings" 
           style="display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">
          View Booking
        </a>
      </div>
    `
  }),

  newBookingRequest: (data) => ({
    subject: 'New Booking Request - TutorXpert',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">New Booking Request</h1>
        <p>Hi ${data.tutorName},</p>
        <p>You have a new booking request from ${data.learnerName}.</p>
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Subject:</strong> ${data.subjectName}</p>
          <p><strong>Date & Time:</strong> ${new Date(data.scheduledAt).toLocaleString()}</p>
          <p><strong>Duration:</strong> ${data.durationMinutes} minutes</p>
        </div>
        <a href="${process.env.FRONTEND_URL}/bookings" 
           style="display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">
          View & Confirm
        </a>
      </div>
    `
  }),

  sessionReminder: (data) => ({
    subject: 'Session Reminder - TutorXpert',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Session Reminder</h1>
        <p>Hi ${data.userName},</p>
        <p>This is a reminder that you have a tutoring session coming up soon.</p>
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Subject:</strong> ${data.subjectName}</p>
          <p><strong>Date & Time:</strong> ${new Date(data.scheduledAt).toLocaleString()}</p>
          <p><strong>Duration:</strong> ${data.durationMinutes} minutes</p>
        </div>
        <a href="${process.env.FRONTEND_URL}/sessions/${data.sessionId}" 
           style="display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">
          Join Session
        </a>
      </div>
    `
  }),

  sessionSummary: (data) => ({
    subject: 'Session Summary - TutorXpert',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Session Summary</h1>
        <p>Hi ${data.userName},</p>
        <p>Here's a summary of your recent tutoring session.</p>
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Subject:</strong> ${data.subjectName}</p>
          <p><strong>Duration:</strong> ${data.duration} minutes</p>
          <p><strong>Date:</strong> ${new Date(data.date).toLocaleDateString()}</p>
          ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
        </div>
        ${data.isLearner ? `
          <p>Don't forget to rate your tutor!</p>
          <a href="${process.env.FRONTEND_URL}/sessions/${data.sessionId}/review" 
             style="display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">
            Leave a Review
          </a>
        ` : ''}
      </div>
    `
  }),

  passwordReset: (data) => ({
    subject: 'Password Reset - TutorXpert',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Password Reset Request</h1>
        <p>Hi ${data.name},</p>
        <p>We received a request to reset your password. Click the button below to create a new password.</p>
        <a href="${process.env.FRONTEND_URL}/reset-password?token=${data.resetToken}" 
           style="display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Reset Password
        </a>
        <p style="color: #6B7280; font-size: 14px;">This link will expire in 1 hour.</p>
        <p style="color: #6B7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      </div>
    `
  }),

  accountVerified: (name) => ({
    subject: 'Account Verified - TutorXpert',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10B981;">Account Verified!</h1>
        <p>Hi ${name},</p>
        <p>Congratulations! Your tutor account has been verified.</p>
        <p>You can now:</p>
        <ul>
          <li>Receive booking requests from learners</li>
          <li>Start earning by teaching</li>
          <li>Build your reputation on the platform</li>
        </ul>
        <a href="${process.env.FRONTEND_URL}/dashboard" 
           style="display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          Go to Dashboard
        </a>
      </div>
    `
  })
};

// Send email function
export const sendEmail = async (to, templateName, data = {}) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('Email service not configured. Email would be sent to:', to);
      console.log('Template:', templateName);
      return { success: true, message: 'Email service not configured (dev mode)' };
    }

    const template = templates[templateName];
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    const { subject, html } = typeof template === 'function' ? template(data) : template;

    const info = await transporter.sendMail({
      from: `"TutorXpert" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });

    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Bulk email function
export const sendBulkEmail = async (recipients, templateName, data = {}) => {
  const results = [];
  
  for (const recipient of recipients) {
    const result = await sendEmail(recipient, templateName, data);
    results.push({ recipient, ...result });
  }
  
  return results;
};

// Test email connection
export const testEmailConnection = async () => {
  try {
    await transporter.verify();
    return { success: true, message: 'Email service is ready' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default {
  sendEmail,
  sendBulkEmail,
  testEmailConnection
};
