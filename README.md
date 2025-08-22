# Mail MCP Server

A Model Context Protocol (MCP) server for email functionality built with TypeScript and Express.

## Features

- Send emails via SMTP
- Retrieve email history
- Delete emails
- Get latest email
- MCP protocol integration

## Dependencies

- [nodemailer](https://www.npmjs.com/package/nodemailer) - Email sending
- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) - MCP protocol support
- [express](https://www.npmjs.com/package/express) - Web framework
- [typescript](https://www.npmjs.com/package/typescript) - Type safety
- [vitest](https://www.npmjs.com/package/vitest) - Testing framework

## Setup

```
npm install
```

## Configuration

Create a `.env` file with your email settings:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

## Usage

### Development
```
npm run dev
```

### Build
```
npm run build
```

### Start
```
npm start
```

### Test
```
npm test
```

### API Mode
```
npm run dev     # Start API server
npm start       # Start built API server
```

### MCP Mode
```
npm run dev:mcp   # Start MCP server in dev
npm run start:mcp # Start built MCP server
```

## How to Use

Add this server to your MCP client configuration. The server provides the following tools:

- `send_email` - Send an email to a recipient
- `get_emails` - Retrieve email history with optional limit
- `delete_email` - Delete an email by ID
- `get_latest_email` - Get the most recent email

## API Usage

### 1. Register User
```bash
POST /api/register
{
  "username": "user1",
  "password": "password123",
  "emailConfig": {
    "host": "smtp.gmail.com",
    "port": 587,
    "user": "your-email@gmail.com",
    "pass": "your-app-password",
    "from": "your-email@gmail.com"
  }
}
```

### 2. Use Mail API
```bash
POST /api/mail
{
  "token": "your-token",
  "action": "send",
  "to": "recipient@example.com",
  "subject": "Test Subject",
  "body": "Test message"
}
```

Actions: `send`, `get`, `delete`, `latest`

## MCP Configuration

Add this to your MCP client configuration file:

```json
{
  "mcpServers": {
    "mail-server": {
      "command": "node",
      "args": ["dist/index.js", "--mcp"],
      "env": {
        "EMAIL_HOST": "smtp.gmail.com",
        "EMAIL_PORT": "587",
        "EMAIL_USER": "your-email@gmail.com",
        "EMAIL_PASS": "your-app-password",
        "EMAIL_FROM": "your-email@gmail.com"
      }
    }
  }
}
```
