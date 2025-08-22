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

## How to Use

Add this server to your MCP client configuration. The server provides the following tools:

- `send_email` - Send an email to a recipient
- `get_emails` - Retrieve email history with optional limit
- `delete_email` - Delete an email by ID
- `get_latest_email` - Get the most recent email

## MCP Configuration

Add this to your MCP client configuration file:

```json
{
  "mcpServers": {
    "mail-server": {
      "command": "npx",
      "args": ["tsx", "/mnt/c/Users/Olsen/Desktop/mail-mcp-server/dist/index.js"],
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
