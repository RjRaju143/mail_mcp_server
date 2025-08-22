import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as emailService from "./services/emailService.js";
import app from "./app.js";

const server = new Server(
  {
    name: "mail-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "send_email",
        description: "Send an email",
        inputSchema: {
          type: "object",
          properties: {
            to: { type: "string", description: "Recipient email address" },
            subject: { type: "string", description: "Email subject" },
            body: { type: "string", description: "Email body content" },
          },
          required: ["to", "subject", "body"],
        },
      },
      {
        name: "get_emails",
        description: "Get list of emails",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Number of emails to retrieve" },
          },
        },
      },
      {
        name: "delete_email",
        description: "Delete an email by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "Email ID to delete" },
          },
          required: ["id"],
        },
      },
      {
        name: "get_latest_email",
        description: "Get the most recent email",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "send_email":
      const email = await emailService.sendEmail(
        args?.to as string,
        args?.subject as string,
        args?.body as string
      );
      return {
        content: [
          {
            type: "text",
            text: `Email sent successfully. ID: ${email.id}`,
          },
        ],
      };

    case "get_emails":
      const emails = emailService.getEmails(args?.limit as number | undefined);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(emails, null, 2),
          },
        ],
      };

    case "delete_email":
      const deleted = emailService.deleteEmail(args?.id as string);
      return {
        content: [
          {
            type: "text",
            text: deleted ? `Email ${args?.id} deleted` : `Email ${args?.id} not found`,
          },
        ],
      };

    case "get_latest_email":
      const latestEmail = emailService.getLatestEmail();
      return {
        content: [
          {
            type: "text",
            text: latestEmail ? JSON.stringify(latestEmail, null, 2) : "No emails found",
          },
        ],
      };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  if (process.argv.includes('--mcp')) {
    // MCP mode
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } else {
    // API mode
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}`);
    });
  }
}

main().catch(console.error);
