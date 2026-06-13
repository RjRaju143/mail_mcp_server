import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
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

export interface FileAttachment {
  /** Path to file on disk — streamed directly (no size limit). */
  filePath: string;
  /** Optional override filename (defaults to basename of filePath). */
  filename?: string;
}

export interface Email {
  id: string;
  to: string;
  from: string;
  subject: string;
  body: string;
  timestamp: string;
  attachments?: Attachment[];
  fileAttachments?: FileAttachment[];
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
  filePaths?: FileAttachment[],
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
    ...(filePaths && filePaths.length > 0 ? { fileAttachments: filePaths } : {}),
    ...(html ? { html } : {}),
    ...(cc ? { cc } : {}),
    ...(bcc ? { bcc } : {}),
    ...(replyTo ? { replyTo } : {}),
  };

  // Validate file paths exist before sending (throws immediately, not caught below)
  if (filePaths && filePaths.length > 0) {
    for (const fp of filePaths) {
      const resolvedPath = path.resolve(fp.filePath);
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`File not found: ${resolvedPath}`);
      }
    }
  }

  try {
    // Build base64 attachments
    const mailAttachments: any[] = attachments?.map(att => ({
      filename: att.filename,
      content: att.content,
      encoding: 'base64' as const,
      ...(att.contentType ? { contentType: att.contentType } : {}),
    })) ?? [];

    // Build file-path attachments — streamed directly (no buffer)
    // Paths already validated above; paths are guaranteed to exist.
    if (filePaths && filePaths.length > 0) {
      for (const fp of filePaths) {
        const resolvedPath = path.resolve(fp.filePath);
        mailAttachments.push({
          filename: fp.filename || path.basename(resolvedPath),
          content: fs.createReadStream(resolvedPath), // ← streams to SMTP
        });
      }
    }

    const mailOptions: any = {
      from: fromAddress,
      to,
      subject,
      ...(cc ? { cc } : {}),
      ...(bcc ? { bcc } : {}),
      ...(replyTo ? { replyTo } : {}),
      text: body,
      ...(html ? { html } : {}),
      ...(mailAttachments.length > 0 ? { attachments: mailAttachments } : {}),
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
