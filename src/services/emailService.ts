import nodemailer from 'nodemailer';
import { emailConfig, fromAddress } from '../config/email.js';

// ── Validation ──────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

function validateEmailFields(to: string, cc?: string, bcc?: string): void {
  if (!isValidEmail(to)) {
    throw new Error(`Invalid recipient email address: "${to}"`);
  }
  if (cc && !isValidEmail(cc)) {
    throw new Error(`Invalid CC email address: "${cc}"`);
  }
  if (bcc && !isValidEmail(bcc)) {
    throw new Error(`Invalid BCC email address: "${bcc}"`);
  }
}

// ── Types ───────────────────────────────────────────────────

export interface Attachment {
  filename: string;
  content: string; // base64-encoded content
  contentType?: string;
}

export interface Email {
  id: string;
  to: string;
  from: string;
  subject: string;
  body: string;
  timestamp: string;
  attachments?: Attachment[];
  html?: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
}

// ── Storage ─────────────────────────────────────────────────

let maxEmails = parseInt(process.env.MAX_STORED_EMAILS || '500', 10);
const emails: Email[] = [];

export function setMaxEmails(n: number): void {
  maxEmails = n;
}

function trimStorage(): void {
  if (emails.length > maxEmails) {
    emails.splice(0, emails.length - maxEmails);
  }
}

// ── Transporter ─────────────────────────────────────────────

// Use mock transporter in test environment
const transporter = process.env.NODE_ENV === 'test' 
  ? nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    })
  : nodemailer.createTransport(emailConfig);

// ── Public API ──────────────────────────────────────────────

export const sendEmail = async (
  to: string,
  subject: string,
  body: string,
  attachments?: Attachment[],
  html?: string,
  cc?: string,
  bcc?: string,
  replyTo?: string,
) => {
  validateEmailFields(to, cc, bcc);

  const email: Email = {
    id: crypto.randomUUID(),
    to,
    from: emailConfig.from || 'noreply@example.com',
    subject,
    body,
    timestamp: new Date().toISOString(),
    ...(attachments && attachments.length > 0 ? { attachments } : {}),
    ...(html ? { html } : {}),
    ...(cc ? { cc } : {}),
    ...(bcc ? { bcc } : {}),
    ...(replyTo ? { replyTo } : {}),
  };

  try {
    const mailAttachments = attachments?.map(att => ({
      filename: att.filename,
      content: att.content,
      encoding: 'base64' as const,
      ...(att.contentType ? { contentType: att.contentType } : {}),
    }));

    const mailOptions: any = {
      from: fromAddress,
      to,
      subject,
      ...(cc ? { cc } : {}),
      ...(bcc ? { bcc } : {}),
      ...(replyTo ? { replyTo } : {}),
      text: body,
      ...(html ? { html } : {}),
      ...(mailAttachments && mailAttachments.length > 0 ? { attachments: mailAttachments } : {}),
    };

    await (transporter as any).sendMail(mailOptions);
  } catch (error) {
    console.error('Failed to send email:', error);
  }

  emails.push(email);
  trimStorage();
  return email;
};

export const getEmails = (limit = 10) => {
  return emails.slice(-limit);
};

export const getEmailById = (id: string) => {
  return emails.find(email => email.id === id) || null;
};

export const deleteEmail = (id: string) => {
  const index = emails.findIndex(email => email.id === id);
  if (index > -1) {
    emails.splice(index, 1);
    return true;
  }
  return false;
};

export const getLatestEmail = () => {
  return emails.length > 0 ? emails[emails.length - 1] : null;
};
