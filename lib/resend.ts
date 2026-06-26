import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key');

export const FROM_EMAIL = process.env.FROM_EMAIL ?? 'noreply@digitalvault.app';
export const APP_NAME = 'Digital Legacy Vault';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// ──────────────────────────────────────────────────────────
// Generic email sender
// ──────────────────────────────────────────────────────────
interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailParams) {
  try {
    const result = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo,
    });
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('[Resend] Failed to send email:', error);
    return { success: false, error };
  }
}

// ──────────────────────────────────────────────────────────
// Email helpers — inline HTML templates
// ──────────────────────────────────────────────────────────

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f8fafc;
  color: #1e293b;
  padding: 40px 20px;
`;

const cardStyle = `
  background: #ffffff;
  border-radius: 12px;
  padding: 40px;
  max-width: 560px;
  margin: 0 auto;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
`;

const btnStyle = `
  display: inline-block;
  background: #6366f1;
  color: #ffffff !important;
  text-decoration: none;
  padding: 12px 28px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 15px;
  margin-top: 24px;
`;

const h1Style = `font-size: 22px; font-weight: 700; color: #1e293b; margin: 0 0 8px;`;
const pStyle  = `font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 16px;`;
const smallStyle = `font-size: 13px; color: #94a3b8;`;

function wrap(content: string): string {
  return `<div style="${baseStyle}"><div style="${cardStyle}">${content}</div></div>`;
}

// ──────────────────────────────────────────────────────────
// Individual email composers
// ──────────────────────────────────────────────────────────

export function nomineeInvitationEmail(params: {
  ownerName: string;
  nomineeEmail: string;
  inviteUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `${params.ownerName} has invited you to Digital Legacy Vault`,
    html: wrap(`
      <h1 style="${h1Style}">You've been invited 🔐</h1>
      <p style="${pStyle}"><strong>${params.ownerName}</strong> has invited you as a trusted nominee on Digital Legacy Vault — a secure platform for managing important documents.</p>
      <p style="${pStyle}">As a nominee, you'll be able to request emergency access to selected documents if needed.</p>
      <a href="${params.inviteUrl}" style="${btnStyle}">Accept Invitation</a>
      <p style="${smallStyle} margin-top:24px">This invitation link expires in 7 days. If you didn't expect this email, you can safely ignore it.</p>
    `),
  };
}

export function emergencyRequestEmail(params: {
  ownerName: string;
  nomineeName: string;
  nomineeEmail: string;
  reason: string;
  autoApproveDate: string;
  requestUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `⚠️ Emergency Access Request from ${params.nomineeName}`,
    html: wrap(`
      <h1 style="${h1Style}">Emergency Access Request</h1>
      <p style="${pStyle}">Hello ${params.ownerName},</p>
      <p style="${pStyle}"><strong>${params.nomineeName}</strong> (${params.nomineeEmail}) has submitted an emergency access request for your documents.</p>
      <p style="${pStyle}"><strong>Reason:</strong> ${params.reason}</p>
      <p style="${pStyle}">If you take no action, access will be automatically granted on <strong>${params.autoApproveDate}</strong>.</p>
      <a href="${params.requestUrl}" style="${btnStyle}">Review Request</a>
      <p style="${smallStyle} margin-top:24px">You can approve or reject this request from your dashboard at any time before the auto-approval date.</p>
    `),
  };
}

export function requestApprovedEmail(params: {
  nomineeName: string;
  ownerName: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `✅ Your emergency access request has been approved`,
    html: wrap(`
      <h1 style="${h1Style}">Access Approved</h1>
      <p style="${pStyle}">Hello ${params.nomineeName},</p>
      <p style="${pStyle}"><strong>${params.ownerName}</strong> has approved your emergency access request. You can now access the authorized documents from your dashboard.</p>
      <a href="${params.dashboardUrl}" style="${btnStyle}">Go to Dashboard</a>
    `),
  };
}

export function requestRejectedEmail(params: {
  nomineeName: string;
  ownerName: string;
}): { subject: string; html: string } {
  return {
    subject: `Your emergency access request has been declined`,
    html: wrap(`
      <h1 style="${h1Style}">Access Declined</h1>
      <p style="${pStyle}">Hello ${params.nomineeName},</p>
      <p style="${pStyle}"><strong>${params.ownerName}</strong> has declined your emergency access request.</p>
      <p style="${pStyle}">If you believe this is an error, please contact the owner directly.</p>
    `),
  };
}

export function autoApprovalWarningEmail(params: {
  ownerName: string;
  nomineeName: string;
  autoApproveDate: string;
  requestUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `⏰ Reminder: Emergency access will be auto-granted in 7 days`,
    html: wrap(`
      <h1 style="${h1Style}">Auto-Approval Reminder</h1>
      <p style="${pStyle}">Hello ${params.ownerName},</p>
      <p style="${pStyle}">This is a reminder that <strong>${params.nomineeName}</strong>'s emergency access request will be automatically approved on <strong>${params.autoApproveDate}</strong> unless you take action.</p>
      <a href="${params.requestUrl}" style="${btnStyle}">Review Request Now</a>
    `),
  };
}

export function autoApprovedEmail(params: {
  nomineeName: string;
  ownerName: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `✅ Emergency access auto-approved`,
    html: wrap(`
      <h1 style="${h1Style}">Access Auto-Approved</h1>
      <p style="${pStyle}">Hello ${params.nomineeName},</p>
      <p style="${pStyle}">The waiting period for your emergency access request from <strong>${params.ownerName}</strong> has expired. Access has been automatically granted to the authorized documents.</p>
      <a href="${params.dashboardUrl}" style="${btnStyle}">Access Documents</a>
    `),
  };
}

export function welcomeEmail(params: {
  userName: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Welcome to Digital Legacy Vault 🔐`,
    html: wrap(`
      <h1 style="${h1Style}">Welcome, ${params.userName}!</h1>
      <p style="${pStyle}">Your Digital Legacy Vault account has been created. You can now securely upload and manage your important documents.</p>
      <a href="${params.dashboardUrl}" style="${btnStyle}">Go to Dashboard</a>
    `),
  };
}

export function passwordResetEmail(params: {
  userName: string;
  resetUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Reset your Digital Legacy Vault password`,
    html: wrap(`
      <h1 style="${h1Style}">Password Reset</h1>
      <p style="${pStyle}">Hello ${params.userName},</p>
      <p style="${pStyle}">We received a request to reset your password. Click the button below to create a new password. This link expires in 1 hour.</p>
      <a href="${params.resetUrl}" style="${btnStyle}">Reset Password</a>
      <p style="${smallStyle} margin-top:24px">If you didn't request a password reset, you can safely ignore this email.</p>
    `),
  };
}

export function securityAlertEmail(params: {
  userName: string;
  event: string;
  ipAddress: string;
  time: string;
}): { subject: string; html: string } {
  return {
    subject: `🔔 Security Alert: ${params.event}`,
    html: wrap(`
      <h1 style="${h1Style}">Security Alert</h1>
      <p style="${pStyle}">Hello ${params.userName},</p>
      <p style="${pStyle}">We detected a security event on your account:</p>
      <p style="${pStyle}"><strong>Event:</strong> ${params.event}<br/><strong>IP:</strong> ${params.ipAddress}<br/><strong>Time:</strong> ${params.time}</p>
      <p style="${pStyle}">If this was you, no action is needed. If you don't recognize this activity, please change your password immediately.</p>
    `),
  };
}
