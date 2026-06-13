import { describe, it, expect, beforeEach, afterAll, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import * as emailService from '../src/services/emailService.js';
import type { Attachment } from '../src/services/emailService.js';

describe('Email Service', () => {
  beforeEach(() => {
    // Clear emails before each test
    const emails = emailService.getEmails();
    emails.forEach(email => emailService.deleteEmail(email.id));
  });

  // ── Basic CRUD ──────────────────────────────────────────

  it('should send an email', async () => {
    const email = await emailService.sendEmail('test@example.com', 'Test Subject', 'Test Body');
    
    expect(email).toMatchObject({
      to: 'test@example.com',
      subject: 'Test Subject',
      body: 'Test Body',
    });
    expect(email.id).toBeDefined();
    expect(email.timestamp).toBeDefined();
    expect(email.attachments).toBeUndefined();
  });

  it('should generate a UUID for each email id', async () => {
    const [e1, e2] = await Promise.all([
      emailService.sendEmail('a@b.com', 'S1', 'B1'),
      emailService.sendEmail('a@b.com', 'S2', 'B2'),
    ]);
    expect(e1.id).not.toBe(e2.id);
    // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    expect(e1.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(e2.id).toMatch(/^[0-9a-f-]{36}$/);
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

  it('should delete email by id - false for unknown id', () => {
    expect(emailService.deleteEmail('non-existent')).toBe(false);
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

  // ── Email Validation ────────────────────────────────────

  describe('Email validation', () => {
    it('should reject invalid "to" email', async () => {
      await expect(emailService.sendEmail('not-an-email', 'Sub', 'Body'))
        .rejects.toThrow('Invalid recipient email address');
    });

    it('should reject empty "to" email', async () => {
      await expect(emailService.sendEmail('', 'Sub', 'Body'))
        .rejects.toThrow('Invalid recipient email address');
    });

    it('should reject invalid "cc" email', async () => {
      await expect(emailService.sendEmail('a@b.com', 'Sub', 'Body', undefined, undefined, 'bad-cc'))
        .rejects.toThrow('Invalid CC email address');
    });

    it('should reject invalid "bcc" email', async () => {
      await expect(emailService.sendEmail('a@b.com', 'Sub', 'Body', undefined, undefined, undefined, 'bad-bcc'))
        .rejects.toThrow('Invalid BCC email address');
    });

    it('should accept valid email with cc and bcc', async () => {
      const email = await emailService.sendEmail('a@b.com', 'Sub', 'Body', undefined, undefined, 'cc@b.com', 'bcc@c.com');
      expect(email.to).toBe('a@b.com');
      expect(email.cc).toBe('cc@b.com');
      expect(email.bcc).toBe('bcc@c.com');
    });
  });

  // ── HTML Body ───────────────────────────────────────────

  describe('HTML body', () => {
    it('should store html when provided', async () => {
      const email = await emailService.sendEmail('a@b.com', 'HTML test', 'Plain fallback', undefined, '<h1>Hello</h1>');
      expect(email.html).toBe('<h1>Hello</h1>');
      expect(email.body).toBe('Plain fallback');
    });

    it('should not set html when omitted', async () => {
      const email = await emailService.sendEmail('a@b.com', 'Plain only', 'Just text');
      expect(email.html).toBeUndefined();
    });
  });

  // ── CC / BCC / Reply-To ─────────────────────────────────

  describe('CC / BCC / Reply-To', () => {
    it('should store cc, bcc, and replyTo', async () => {
      const email = await emailService.sendEmail(
        'to@b.com', 'Sub', 'Body',
        undefined, undefined,
        'cc@b.com', 'bcc@c.com', 'reply@b.com',
      );
      expect(email.cc).toBe('cc@b.com');
      expect(email.bcc).toBe('bcc@c.com');
      expect(email.replyTo).toBe('reply@b.com');
    });

    it('should not set optional fields when omitted', async () => {
      const email = await emailService.sendEmail('a@b.com', 'Sub', 'Body');
      expect(email.cc).toBeUndefined();
      expect(email.bcc).toBeUndefined();
      expect(email.replyTo).toBeUndefined();
    });
  });

  // ── getEmailById ────────────────────────────────────────

  describe('getEmailById', () => {
    it('should find email by id', async () => {
      const sent = await emailService.sendEmail('a@b.com', 'Sub', 'Body');
      const found = emailService.getEmailById(sent.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(sent.id);
    });

    it('should return null for unknown id', () => {
      expect(emailService.getEmailById('does-not-exist')).toBeNull();
    });
  });

  // ── Attachments ─────────────────────────────────────────

  describe('Attachments', () => {
    const textAttachment: Attachment = {
      filename: 'hello.txt',
      content: Buffer.from('Hello, World!').toString('base64'),
      contentType: 'text/plain',
    };

    const imageAttachment: Attachment = {
      filename: 'photo.png',
      content: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      contentType: 'image/png',
    };

    it('should send an email with a single attachment', async () => {
      const email = await emailService.sendEmail('test@example.com', 'With attachment', 'Body', [textAttachment]);

      expect(email.attachments).toBeDefined();
      expect(email.attachments).toHaveLength(1);
      expect(email.attachments![0].filename).toBe('hello.txt');
      expect(email.attachments![0].contentType).toBe('text/plain');
      expect(email.attachments![0].content).toBe(textAttachment.content);
    });

    it('should send an email with multiple attachments', async () => {
      const email = await emailService.sendEmail(
        'test@example.com',
        'Multiple attachments',
        'Body',
        [textAttachment, imageAttachment],
      );

      expect(email.attachments).toHaveLength(2);
      expect(email.attachments![0].filename).toBe('hello.txt');
      expect(email.attachments![1].filename).toBe('photo.png');
    });

    it('should store attachment metadata in email history', async () => {
      const email = await emailService.sendEmail('test@example.com', 'Attached', 'Body', [textAttachment]);

      const stored = emailService.getLatestEmail();
      expect(stored?.attachments).toBeDefined();
      expect(stored?.attachments).toHaveLength(1);
      expect(stored?.attachments![0].filename).toBe('hello.txt');
    });

    it('should handle empty attachments array as no attachments', async () => {
      const email = await emailService.sendEmail('test@example.com', 'Empty attachments', 'Body', []);

      expect(email.attachments).toBeUndefined();
    });
  });

  // ── Storage Limit ───────────────────────────────────────

  describe('Storage limit', () => {
    it('should respect settable maxEmails limit', async () => {
      // Override to a low limit
      emailService.setMaxEmails(3);

      // Send 5 emails
      await emailService.sendEmail('a@b.com', 'S1', 'B1');
      await emailService.sendEmail('a@b.com', 'S2', 'B2');
      await emailService.sendEmail('a@b.com', 'S3', 'B3');
      await emailService.sendEmail('a@b.com', 'S4', 'B4');
      await emailService.sendEmail('a@b.com', 'S5', 'B5');

      const stored = emailService.getEmails(10);
      expect(stored.length).toBeLessThanOrEqual(3);

      // Restore default for other tests
      emailService.setMaxEmails(500);
    });
  });

  // ── File Path Attachments (streaming) ────────────────────

  describe('File path attachments (streaming)', () => {
    const tmpDir = path.resolve('test-tmp');
    const smallFile = path.join(tmpDir, 'hello.txt');
    const largeContent = 'x'.repeat(1024 * 1024 * 5); // 5MB test content
    const largeFile = path.join(tmpDir, 'large-5mb.bin');
    const pngFile = path.join(tmpDir, 'photo.png');

    beforeEach(() => {
      fs.mkdirSync(tmpDir, { recursive: true });
      fs.writeFileSync(smallFile, 'Hello from streaming file!', 'utf-8');
      fs.writeFileSync(largeFile, largeContent, 'utf-8');
      // Copy from existing base64 test data to a real file
      const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      fs.writeFileSync(pngFile, Buffer.from(pngBase64, 'base64'));
    });

    afterEach(() => {
      // Clean up temp files
      try { fs.unlinkSync(smallFile); } catch { /* ok */ }
      try { fs.unlinkSync(largeFile); } catch { /* ok */ }
      try { fs.unlinkSync(pngFile); } catch { /* ok */ }
      try { fs.rmdirSync(tmpDir); } catch { /* ok */ }
    });

    it('should send an email with a file path attachment (streamed)', async () => {
      const email = await emailService.sendEmail(
        'test@example.com', 'Streaming file', 'Body',
        undefined, undefined, undefined, undefined, undefined,
        [{ filePath: smallFile }],
      );

      expect(email.fileAttachments).toBeDefined();
      expect(email.fileAttachments).toHaveLength(1);
      expect(email.fileAttachments![0].filePath).toBe(smallFile);
    });

    it('should accept custom filename override', async () => {
      const email = await emailService.sendEmail(
        'a@b.com', 'Custom name', 'Body',
        undefined, undefined, undefined, undefined, undefined,
        [{ filePath: smallFile, filename: 'renamed.txt' }],
      );

      expect(email.fileAttachments![0].filename).toBe('renamed.txt');
    });

    it('should send a large file (5MB) without issues', async () => {
      const email = await emailService.sendEmail(
        'a@b.com', 'Large file', 'Body',
        undefined, undefined, undefined, undefined, undefined,
        [{ filePath: largeFile, filename: 'large.bin' }],
      );

      expect(email.fileAttachments).toHaveLength(1);
      expect(email.fileAttachments![0].filePath).toBe(largeFile);
    });

    it('should support both base64 and file path attachments together', async () => {
      const textAttachment: Attachment = {
        filename: 'hello.txt',
        content: Buffer.from('Hello, World!').toString('base64'),
        contentType: 'text/plain',
      };

      const email = await emailService.sendEmail(
        'a@b.com', 'Mixed attachments', 'Body',
        [textAttachment], undefined, undefined, undefined, undefined,
        [{ filePath: pngFile }],
      );

      expect(email.attachments).toHaveLength(1);
      expect(email.fileAttachments).toHaveLength(1);
    });

    it('should throw if file path does not exist', async () => {
      await expect(emailService.sendEmail(
        'a@b.com', 'Missing file', 'Body',
        undefined, undefined, undefined, undefined, undefined,
        [{ filePath: '/nonexistent/file.pdf' }],
      )).rejects.toThrow('File not found');
    });

    it('should store fileAttachment metadata in email history', async () => {
      await emailService.sendEmail(
        'a@b.com', 'Store test', 'Body',
        undefined, undefined, undefined, undefined, undefined,
        [{ filePath: smallFile }],
      );

      const stored = emailService.getLatestEmail();
      expect(stored?.fileAttachments).toBeDefined();
      expect(stored?.fileAttachments).toHaveLength(1);
      expect(stored?.fileAttachments![0].filePath).toBe(smallFile);
    });
  });
});
