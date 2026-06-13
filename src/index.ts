import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as emailService from "./services/emailService.js";
import type { Attachment, FileAttachment } from "./services/emailService.js";

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
        description: "Send an email with optional attachments, HTML body, CC/BCC/Reply-To",
        inputSchema: {
          type: "object",
          properties: {
            to: { type: "string", description: "Recipient email address" },
            subject: { type: "string", description: "Email subject" },
            body: { type: "string", description: "Plain text email body (fallback when html is provided)" },
            html: { type: "string", description: "Optional HTML email body" },
            cc: { type: "string", description: "Optional CC recipient email address" },
            bcc: { type: "string", description: "Optional BCC recipient email address" },
            replyTo: { type: "string", description: "Optional Reply-To email address" },
            attachments: {
              type: "array",
              description: "Optional file attachments (base64-encoded content)",
              items: {
                type: "object",
                properties: {
                  filename: { type: "string", description: "File name with extension" },
                  content: { type: "string", description: "Base64-encoded file content" },
                  contentType: { type: "string", description: "MIME type (optional, inferred from filename if omitted)" },
                },
                required: ["filename", "content"],
              },
            },
            filePaths: {
              type: "array",
              description: "Optional file paths on disk — streamed directly (no size limit, supports any file size)",
              items: {
                type: "object",
                properties: {
                  filePath: { type: "string", description: "Absolute or relative path to the file on disk" },
                  filename: { type: "string", description: "Optional override filename in the email (defaults to basename)" },
                },
                required: ["filePath"],
              },
            },
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
      {
        name: "get_email_by_id",
        description: "Get a single email by its ID",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "Email ID to retrieve" },
          },
          required: ["id"],
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
        args?.body as string,
        args?.attachments as Attachment[] | undefined,
        args?.html as string | undefined,
        args?.cc as string | undefined,
        args?.bcc as string | undefined,
        args?.replyTo as string | undefined,
        args?.filePaths as FileAttachment[] | undefined,
      );
      const attachCount = (email.attachments?.length ?? 0) + (email.fileAttachments?.length ?? 0);
      return {
        content: [
          {
            type: "text",
            text: `Email sent successfully. ID: ${email.id}${attachCount > 0 ? ` with ${attachCount} attachment(s)` : ''}`,
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

    case "get_email_by_id":
      const foundEmail = emailService.getEmailById(args?.id as string);
      return {
        content: [
          {
            type: "text",
            text: foundEmail ? JSON.stringify(foundEmail, null, 2) : `Email ${args?.id} not found`,
          },
        ],
      };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
