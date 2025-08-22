import { describe, it, expect, beforeEach } from 'vitest';
import * as emailService from '../src/services/emailService.js';

describe('Email Service', () => {
  beforeEach(() => {
    // Clear emails before each test
    const emails = emailService.getEmails();
    emails.forEach(email => emailService.deleteEmail(email.id));
  });

  it('should send an email', async () => {
    const email = await emailService.sendEmail('test@example.com', 'Test Subject', 'Test Body');
    
    expect(email).toMatchObject({
      to: 'test@example.com',
      subject: 'Test Subject',
      body: 'Test Body'
    });
    expect(email.id).toBeDefined();
    expect(email.timestamp).toBeDefined();
  });

  it('should get emails with limit', async () => {
    await emailService.sendEmail('test1@example.com', 'Subject 1', 'Body 1');
    await emailService.sendEmail('test2@example.com', 'Subject 2', 'Body 2');
    
    const emails = emailService.getEmails(1);
    expect(emails).toHaveLength(1);
  });

  it('should delete email by id', async () => {
    const email = await emailService.sendEmail('test@example.com', 'Test', 'Body');
    const deleted = emailService.deleteEmail(email.id);
    
    expect(deleted).toBe(true);
    expect(emailService.getEmails()).toHaveLength(0);
  });

  it('should get latest email', async () => {
    await emailService.sendEmail('test1@example.com', 'First', 'Body');
    const latest = await emailService.sendEmail('test2@example.com', 'Latest', 'Body');
    
    const result = emailService.getLatestEmail();
    expect(result?.id).toBe(latest.id);
  });

  it('should return null when no emails exist', () => {
    const result = emailService.getLatestEmail();
    expect(result).toBeNull();
  });
});
