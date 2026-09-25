// Email functionality has been removed.
// All notifications are now handled via in-app notifications (see lib/utils.ts → createNotification).

export const APP_NAME = 'Digital Legacy Vault';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function sendEmail(_params: { to: string; subject: string; html: string }): Promise<{ success: boolean }> {
  // Email sending is removed; using in-app notifications throughout the app
  return { success: true };
}

export function passwordResetEmail(params: { userName: string; resetUrl: string }) {
  return {
    subject: `Reset your ${APP_NAME} password`,
    html: `<p>Click here to reset your password: <a href="${params.resetUrl}">${params.resetUrl}</a></p>`,
  };
}
