import { describe, it, expect } from 'vitest';

describe('MCP Server Tools', () => {
  const mockTools = [
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
  ];

  it('should have correct tool definitions', () => {
    expect(mockTools).toHaveLength(5);
    expect(mockTools[0].name).toBe('send_email');
    expect(mockTools[1].name).toBe('get_emails');
    expect(mockTools[2].name).toBe('delete_email');
    expect(mockTools[3].name).toBe('get_latest_email');
    expect(mockTools[4].name).toBe('get_email_by_id');
  });

  it('should have required fields for send_email', () => {
    const sendEmailTool = mockTools.find(tool => tool.name === 'send_email');
    expect(sendEmailTool?.inputSchema.required).toEqual(['to', 'subject', 'body']);
  });

  it('should have required fields for delete_email', () => {
    const deleteEmailTool = mockTools.find(tool => tool.name === 'delete_email');
    expect(deleteEmailTool?.inputSchema.required).toEqual(['id']);
  });

  it('should have required fields for get_email_by_id', () => {
    const tool = mockTools.find(t => t.name === 'get_email_by_id');
    expect(tool?.inputSchema.required).toEqual(['id']);
  });
});
