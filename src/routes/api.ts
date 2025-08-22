import express from 'express';
import { registerUser, createToken, validateToken } from '../services/authService.js';
import { sendEmailWithConfig, getUserEmails, deleteUserEmail, getLatestUserEmail } from '../services/apiEmailService.js';

const router = express.Router();

// Register user
router.post('/register', (req, res) => {
  const { username, password, emailConfig } = req.body;
  
  if (!username || !password || !emailConfig) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const user = registerUser(username, password, emailConfig);
    const token = createToken(user.id);
    res.json({ token, userId: user.id });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Unified mail API
router.post('/mail', async (req, res) => {
  const { token, action, ...params } = req.body;
  
  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  const user = validateToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    switch (action) {
      case 'send':
        const { to, subject, body } = params;
        if (!to || !subject || !body) {
          return res.status(400).json({ error: 'Missing email parameters' });
        }
        const email = await sendEmailWithConfig(user, to, subject, body);
        res.json({ success: true, email });
        break;

      case 'get':
        const { limit } = params;
        const emails = getUserEmails(user.id, limit);
        res.json({ emails });
        break;

      case 'delete':
        const { emailId } = params;
        if (!emailId) {
          return res.status(400).json({ error: 'Email ID required' });
        }
        const deleted = deleteUserEmail(user.id, emailId);
        res.json({ success: deleted });
        break;

      case 'latest':
        const latest = getLatestUserEmail(user.id);
        res.json({ email: latest });
        break;

      default:
        res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Operation failed' });
  }
});

export default router;