import nodemailer from 'nodemailer';
import { emailConfig } from '../config/email.js';

interface Email {
  id: string;
  to: string;
  from: string;
  subject: string;
  body: string;
  timestamp: string;
}

const emails: Email[] = [];

// Use mock transporter in test environment
const transporter = process.env.NODE_ENV === 'test' 
  ? nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    })
  : nodemailer.createTransport(emailConfig);

export const sendEmail = async (to: string, subject: string, body: string) => {
  const email: Email = {
    id: Date.now().toString(),
    to,
    from: emailConfig.from || 'noreply@example.com',
    subject,
    body,
    timestamp: new Date().toISOString()
  };
  
  try {
    await (transporter as any).sendMail({
      from: emailConfig.from,
      to,
      subject,
      text: body,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
  }
  
  emails.push(email);
  return email;
};

export const getEmails = (limit = 10) => {
  return emails.slice(-limit);
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
