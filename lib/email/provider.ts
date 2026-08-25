import "server-only";
import nodemailer from "nodemailer";

export type EmailMessage = { to: string; subject: string; html: string; text: string };
export type EmailResult = { id?: string; provider: "smtp" | "resend" };

export interface EmailProvider {
  readonly name: "smtp" | "resend";
  send(message: EmailMessage): Promise<EmailResult>;
}

const smtpProvider: EmailProvider = {
  name: "smtp",
  async send(message) {
    const host = process.env.SMTP_HOST;
    if (!host) throw new Error("SMTP non configuré");
    const transport = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    });
    const response = await transport.sendMail({ from: process.env.EMAIL_FROM, ...message });
    return { id: response.messageId, provider: "smtp" };
  },
};

const resendProvider: EmailProvider = {
  name: "resend",
  async send(message) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("Resend non configuré");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, ...message }),
    });
    if (!response.ok) throw new Error(`Resend a répondu ${response.status}`);
    const data = await response.json() as { id?: string };
    return { id: data.id, provider: "resend" };
  },
};

export function emailProvider(): EmailProvider {
  return process.env.EMAIL_PROVIDER === "resend" ? resendProvider : smtpProvider;
}
