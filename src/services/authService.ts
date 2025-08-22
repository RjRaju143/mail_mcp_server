import { User, AuthToken } from '../models/User.js';

const users: User[] = [];
const tokens: AuthToken[] = [];

export const registerUser = (username: string, password: string, emailConfig: User['emailConfig']): User => {
  const user: User = {
    id: Date.now().toString(),
    username,
    password,
    emailConfig,
    createdAt: new Date().toISOString()
  };
  users.push(user);
  return user;
};

export const createToken = (userId: string): string => {
  const token = Buffer.from(`${userId}-${Date.now()}`).toString('base64');
  const authToken: AuthToken = {
    token,
    userId,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  };
  tokens.push(authToken);
  return token;
};

export const validateToken = (token: string): User | null => {
  const authToken = tokens.find(t => t.token === token && new Date(t.expiresAt) > new Date());
  if (!authToken) return null;
  return users.find(u => u.id === authToken.userId) || null;
};