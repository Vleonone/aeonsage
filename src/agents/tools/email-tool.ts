/**
 * Email Tool
 *
 * Send emails via SMTP for notifications and alerts.
 */

// MCP-style tool - type inferred
import type { AeonSageConfig } from "../../config/config.js";

export interface EmailToolParams {
  config?: AeonSageConfig;
}

export interface EmailMessage {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    encoding?: "base64" | "utf-8";
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  to: string[];
  error?: string;
}

// Email templates
const TEMPLATES: Record<string, { subject: string; html: string }> = {
  alert: {
    subject: "[AeonSage Alert] {title}",
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 5px 5px; }
    .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>⚠️ AeonSage Alert</h2>
    </div>
    <div class="content">
      <h3>{title}</h3>
      <p>{message}</p>
      <p><strong>Time:</strong> {timestamp}</p>
      <p><strong>Severity:</strong> {severity}</p>
    </div>
    <div class="footer">
      <p>Sent by AeonSage Bot</p>
    </div>
  </div>
</body>
</html>`,
  },
  notification: {
    subject: "[AeonSage] {title}",
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0d6efd; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 5px 5px; }
    .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🔔 AeonSage Notification</h2>
    </div>
    <div class="content">
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
    <div class="footer">
      <p>Sent by AeonSage Bot</p>
    </div>
  </div>
</body>
</html>`,
  },
  report: {
    subject: "[AeonSage Report] {title}",
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #198754; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 5px 5px; }
    .stats { display: flex; justify-content: space-around; margin: 20px 0; }
    .stat { text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #198754; }
    .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>📊 AeonSage Report</h2>
    </div>
    <div class="content">
      <h3>{title}</h3>
      <p>{message}</p>
      {stats}
    </div>
    <div class="footer">
      <p>Generated at {timestamp}</p>
    </div>
  </div>
</body>
</html>`,
  },
};

/**
 * Replace template placeholders
 */
function applyTemplate(
  template: { subject: string; html: string },
  vars: Record<string, string>,
): { subject: string; html: string } {
  let subject = template.subject;
  let html = template.html;

  for (const [key, value] of Object.entries(vars)) {
    const placeholder = new RegExp(`\\{${key}\\}`, "g");
    subject = subject.replace(placeholder, value);
    html = html.replace(placeholder, value);
  }

  return { subject, html };
}

/**
 * Send email using nodemailer-compatible transport
 */
async function sendEmail(
  message: EmailMessage,
  smtpConfig: { host: string; port: number; user: string; pass: string; secure?: boolean },
): Promise<EmailResult> {
  try {
    // Dynamic import nodemailer
    // @ts-expect-error - Optional dependency
    const nodemailer = await import("nodemailer" /* dynamic */);

    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure ?? smtpConfig.port === 465,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    });

    const mailOptions = {
      from: smtpConfig.user,
      to: Array.isArray(message.to) ? message.to.join(", ") : message.to,
      cc: message.cc ? (Array.isArray(message.cc) ? message.cc.join(", ") : message.cc) : undefined,
      bcc: message.bcc
        ? Array.isArray(message.bcc)
          ? message.bcc.join(", ")
          : message.bcc
        : undefined,
      subject: message.subject,
      text: message.text,
      html: message.html,
      attachments: message.attachments?.map((att) => ({
        filename: att.filename,
        content: att.encoding === "base64" ? Buffer.from(att.content, "base64") : att.content,
      })),
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
      to: Array.isArray(message.to) ? message.to : [message.to],
    };
  } catch (error) {
    return {
      success: false,
      to: Array.isArray(message.to) ? message.to : [message.to],
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

/**
 * Create the email tool
 */
export function createEmailTool(params: EmailToolParams = {}) {
  return {
    name: "email",
    description: `Send emails via SMTP for notifications, alerts, and reports.

Features:
- Send plain text or HTML emails
- Use pre-built templates (alert, notification, report)
- Include attachments
- Support CC and BCC recipients

Templates available:
- alert: Red-themed alert message
- notification: Blue-themed notification
- report: Green-themed report with stats

Requires SMTP configuration in config or environment variables.`,
    inputSchema: {
      type: "object",
      properties: {
        to: {
          type: ["string", "array"],
          description: "Recipient email address(es).",
        },
        subject: {
          type: "string",
          description: "Email subject line.",
        },
        body: {
          type: "string",
          description: "Email body (plain text).",
        },
        html: {
          type: "string",
          description: "Email body (HTML). Overrides body if provided.",
        },
        template: {
          type: "string",
          enum: ["alert", "notification", "report"],
          description: "Use a pre-built template.",
        },
        templateVars: {
          type: "object",
          description: "Variables for template placeholders.",
        },
        cc: {
          type: ["string", "array"],
          description: "CC recipients.",
        },
        bcc: {
          type: ["string", "array"],
          description: "BCC recipients.",
        },
        attachments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              filename: { type: "string" },
              content: { type: "string" },
              encoding: { type: "string", enum: ["base64", "utf-8"] },
            },
          },
          description: "File attachments.",
        },
        smtp: {
          type: "object",
          properties: {
            host: { type: "string" },
            port: { type: "number" },
            user: { type: "string" },
            pass: { type: "string" },
            secure: { type: "boolean" },
          },
          description: "SMTP configuration override.",
        },
      },
      required: ["to"],
    },
    call: async (input: {
      to: string | string[];
      subject?: string;
      body?: string;
      html?: string;
      template?: "alert" | "notification" | "report";
      templateVars?: Record<string, string>;
      cc?: string | string[];
      bcc?: string | string[];
      attachments?: Array<{ filename: string; content: string; encoding?: "base64" | "utf-8" }>;
      smtp?: { host: string; port: number; user: string; pass: string; secure?: boolean };
    }): Promise<EmailResult & { template?: string }> => {
      // Resolve SMTP config
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const smtpConfig = input.smtp ??
        (params.config?.tools as any)?.email?.smtp ?? {
          host: process.env.SMTP_HOST ?? "",
          port: parseInt(process.env.SMTP_PORT ?? "587", 10),
          user: process.env.SMTP_USER ?? "",
          pass: process.env.SMTP_PASS ?? "",
        };

      if (!smtpConfig.host || !smtpConfig.user) {
        return {
          success: false,
          to: Array.isArray(input.to) ? input.to : [input.to],
          error:
            "SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables or provide smtp config.",
        };
      }

      // Build email message
      let subject = input.subject ?? "";
      let html = input.html;
      let text = input.body;

      // Apply template if specified
      if (input.template) {
        const templateDef = TEMPLATES[input.template];
        if (templateDef) {
          const vars = {
            timestamp: new Date().toISOString(),
            severity: "medium",
            stats: "",
            ...input.templateVars,
          };

          const applied = applyTemplate(templateDef, vars);
          subject = subject || applied.subject;
          html = applied.html;
        }
      }

      if (!subject) {
        subject = "[AeonSage] Notification";
      }

      const message: EmailMessage = {
        to: input.to,
        cc: input.cc,
        bcc: input.bcc,
        subject,
        text,
        html,
        attachments: input.attachments,
      };

      const result = await sendEmail(message, smtpConfig);

      return {
        ...result,
        template: input.template,
      };
    },
  };
}
