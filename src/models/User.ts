export interface User {
  id: string;
  username: string;
  password: string;
  emailConfig: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
  createdAt: string;
}

export interface AuthToken {
  token: string;
  userId: string;
  expiresAt: string;
}