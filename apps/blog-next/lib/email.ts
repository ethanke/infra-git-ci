import { Resend } from 'resend';
import { randomBytes } from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export function generateSecureToken(): string {
  return randomBytes(32).toString('hex');
}

export function getUnsubscribeUrl(token: string, baseUrl: string): string {
  return `${baseUrl}/unsubscribe?token=${token}`;
}

export async function sendEmail(to: string, template: EmailTemplate): Promise<void> {
  try {
    await resend.emails.send({
      from: 'Blog <noreply@lum.tools>',
      to: [to],
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email');
  }
}

export function createSubscriptionConfirmationTemplate(
  unsubscribeUrl: string,
  siteName: string = 'Lum Tools Blog'
): EmailTemplate {
  return {
    subject: `Welcome to ${siteName} - Confirm Your Subscription`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Subscription Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center;">
            <h1 style="color: #2563eb; margin-bottom: 20px;">Welcome to ${siteName}!</h1>
            <p style="font-size: 16px; margin-bottom: 30px;">
              Thank you for subscribing to our blog. You'll now receive email notifications when we publish new articles.
            </p>
            <p style="font-size: 14px; color: #666; margin-bottom: 30px;">
              If you didn't subscribe to this newsletter, you can unsubscribe using the link below.
            </p>
            <a href="${unsubscribeUrl}" 
               style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Unsubscribe
            </a>
          </div>
          <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
            <p>This email was sent because you subscribed to ${siteName}.</p>
            <p>If you have any questions, please contact us.</p>
          </div>
        </body>
      </html>
    `,
    text: `
Welcome to ${siteName}!

Thank you for subscribing to our blog. You'll now receive email notifications when we publish new articles.

If you didn't subscribe to this newsletter, you can unsubscribe using this link:
${unsubscribeUrl}

This email was sent because you subscribed to ${siteName}.
If you have any questions, please contact us.
    `.trim(),
  };
}

export function createNewArticleTemplate(
  postTitle: string,
  postSummary: string,
  postUrl: string,
  unsubscribeUrl: string,
  siteName: string = 'Lum Tools Blog'
): EmailTemplate {
  return {
    subject: `New Article: ${postTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Article: ${postTitle}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px;">
            <h1 style="color: #2563eb; margin-bottom: 20px;">New Article Published!</h1>
            <h2 style="color: #1f2937; margin-bottom: 15px;">${postTitle}</h2>
            <p style="font-size: 16px; margin-bottom: 25px; color: #4b5563;">
              ${postSummary}
            </p>
            <a href="${postUrl}" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin-bottom: 30px;">
              Read Article
            </a>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="font-size: 14px; color: #666; text-align: center;">
              Don't want to receive these emails? 
              <a href="${unsubscribeUrl}" style="color: #dc2626; text-decoration: none;">Unsubscribe here</a>
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
New Article Published!

${postTitle}

${postSummary}

Read the full article: ${postUrl}

Don't want to receive these emails? Unsubscribe here: ${unsubscribeUrl}
    `.trim(),
  };
}
