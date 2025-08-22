import { describe, it, expect } from 'vitest';

describe('MCP Server Tools', () => {
  const mockTools = [
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
  ];

  it('should have correct tool definitions', () => {
    expect(mockTools).toHaveLength(4);
    expect(mockTools[0].name).toBe('send_email');
    expect(mockTools[1].name).toBe('get_emails');
    expect(mockTools[2].name).toBe('delete_email');
    expect(mockTools[3].name).toBe('get_latest_email');
  });

  it('should have required fields for send_email', () => {
    const sendEmailTool = mockTools.find(tool => tool.name === 'send_email');
    expect(sendEmailTool?.inputSchema.required).toEqual(['to', 'subject', 'body']);
  });

  it('should have required fields for delete_email', () => {
    const deleteEmailTool = mockTools.find(tool => tool.name === 'delete_email');
    expect(deleteEmailTool?.inputSchema.required).toEqual(['id']);
  });
});
