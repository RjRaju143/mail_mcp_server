import dotenv from 'dotenv';
dotenv.config();

const DISPLAY_NAME_REGEX = /^(.+)\s+<([^>]+)>$/;

function parseFromAddress(raw: string | undefined): { name?: string; address: string } {
  if (!raw) return { address: 'noreply@example.com' };
  const match = raw.match(DISPLAY_NAME_REGEX);
  if (match) {
    return { name: match[1].trim(), address: match[2] };
  }
  return { address: raw };
}

export const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  from: process.env.EMAIL_FROM,
};

/** Structured from object for nodemailer (name + address). */
export const fromAddress = parseFromAddress(process.env.EMAIL_FROM);
