import nodemailer from 'nodemailer';
import { User } from '../models/User.js';

interface Email {
  id: string;
  to: string;
  from: string;
  subject: string;
  body: string;
  timestamp: string;
  userId: string;
}

const emails: Email[] = [];

export const sendEmailWithConfig = async (
  user: User,
  to: string,
  subject: string,
  body: string
): Promise<Email> => {
  const transporter = nodemailer.createTransport({
    host: user.emailConfig.host,
    port: user.emailConfig.port,
    secure: false,
    auth: {
      user: user.emailConfig.user,
      pass: user.emailConfig.pass,
    },
  });

  const email: Email = {
    id: Date.now().toString(),
    to,
    from: user.emailConfig.from,
    subject,
    body,
    timestamp: new Date().toISOString(),
    userId: user.id
  };

  try {
    await transporter.sendMail({
      from: user.emailConfig.from,
      to,
      subject,
      text: body,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }

  emails.push(email);
  return email;
};

export const getUserEmails = (userId: string, limit = 10): Email[] => {
  return emails.filter(e => e.userId === userId).slice(-limit);
};

export const deleteUserEmail = (userId: string, emailId: string): boolean => {
  const index = emails.findIndex(e => e.id === emailId && e.userId === userId);
  if (index > -1) {
    emails.splice(index, 1);
    return true;
  }
  return false;
};

export const getLatestUserEmail = (userId: string): Email | null => {
  const userEmails = emails.filter(e => e.userId === userId);
  return userEmails.length > 0 ? userEmails[userEmails.length - 1] : null;
};