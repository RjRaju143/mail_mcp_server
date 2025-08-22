import express from 'express';
import { validateToken } from '../services/authService.js';
import { sendEmailWithConfig, getUserEmails, deleteUserEmail, getLatestUserEmail } from '../services/apiEmailService.js';

const router = express.Router();

// MCP Tools endpoint
router.post('/tools/list', (req, res) => {
  res.json({
    tools: [
      {
        name: 'send_email',
        description: 'Send an email',
        inputSchema: {
          type: 'object',
          properties: {
            to: { type: 'string', description: 'Recipient email address' },
            subject: { type: 'string', description: 'Email subject' },
            body: { type: 'string', description: 'Email body' },
          },
          required: ['to', 'subject', 'body'],
        },
      },
      {
        name: 'get_emails',
        description: 'Get email history',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Number of emails to retrieve' },
          },
        },
      },
      {
        name: 'delete_email',
        description: 'Delete an email by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Email ID to delete' },
          },
          required: ['id'],
        },
      },
      {
        name: 'get_latest_email',
        description: 'Get the most recent email',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  });
});

// MCP Call tool endpoint
router.post('/tools/call', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  const user = validateToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { name, arguments: args } = req.body;

  try {
    switch (name) {
      case 'send_email':
        const email = await sendEmailWithConfig(user, args.to, args.subject, args.body);
        res.json({ content: [{ type: 'text', text: `Email sent successfully. ID: ${email.id}` }] });
        break;

      case 'get_emails':
        const emails = getUserEmails(user.id, args.limit);
        res.json({ content: [{ type: 'text', text: JSON.stringify(emails, null, 2) }] });
        break;

      case 'delete_email':
        const deleted = deleteUserEmail(user.id, args.id);
        res.json({ content: [{ type: 'text', text: deleted ? `Email ${args.id} deleted` : `Email ${args.id} not found` }] });
        break;

      case 'get_latest_email':
        const latest = getLatestUserEmail(user.id);
        res.json({ content: [{ type: 'text', text: latest ? JSON.stringify(latest, null, 2) : 'No emails found' }] });
        break;

      default:
        res.status(400).json({ error: `Unknown tool: ${name}` });
    }
  } catch (error) {
    res.status(500).json({ error: 'Operation failed' });
  }
});

export default router;