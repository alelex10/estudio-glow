/**
 * GmailSmtpAdapter — nodemailer implementation using Gmail SMTP (port 587 STARTTLS).
 *
 * FOR DEVELOPMENT / STAGING ONLY.
 * Use ResendAdapter in production (lower rate limits, better deliverability).
 *
 * Spec refs: F4.2, F4.5, F4.6, S4-A, S4-B
 * Design refs: Section 4.4 (GmailSmtpAdapter sketch)
 */
import nodemailer from "nodemailer";
import crypto from "crypto";
import type { EmailService } from "./EmailService";
import { verifyEmailTemplate } from "./templates/verifyEmail";
import { linkAccountTemplate } from "./templates/linkAccount";

export interface GmailSmtpConfig {
  user: string;
  pass: string;
  from: string;
}

export class GmailSmtpAdapter implements EmailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;
  private readonly replyTo: string;

  constructor({ user, pass, from }: GmailSmtpConfig) {
    // F4.6: Warn at startup — this adapter is for dev/staging only
    console.warn(
      "[GmailSmtpAdapter] GmailSmtpAdapter is for development/staging only. Use ResendAdapter in production.",
    );

    // DELIVERABILITY: with Gmail SMTP, the address in `From:` MUST be the same as the
    // authenticated user, otherwise DMARC alignment fails and Gmail/Outlook flag the
    // message as spam. We don't override the user's config here, but we warn loudly.
    if (!from.toLowerCase().includes(user.toLowerCase())) {
      console.warn(
        `[GmailSmtpAdapter] EMAIL_FROM ("${from}") does not contain GMAIL_USER ("${user}"). ` +
          `Gmail SMTP requires the sender address to match the authenticated account — ` +
          `messages are very likely to land in SPAM. Set EMAIL_FROM to something like ` +
          `"Estudio Glow <${user}>".`,
      );
    }

    this.from = from;
    this.replyTo = user;
    this.transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // STARTTLS (not SSL) on port 587
      auth: { user, pass },
    });
  }

  async sendVerificationEmail(params: {
    to: string;
    name: string;
    verifyUrl: string;
  }): Promise<{ id: string }> {
    const { to, name, verifyUrl } = params;
    const { subject, html, text } = verifyEmailTemplate({ name, url: verifyUrl });

    const info = await this.transporter.sendMail({
      from: this.from,
      to,
      replyTo: this.replyTo,
      subject,
      html,
      text,
    });

    // F4.5: log recipient hash, never the raw email or URL
    const recipientHash = crypto.createHash("sha256").update(to).digest("hex");
    console.info("[GmailSmtpAdapter] sent", {
      provider: "gmail",
      recipient_hash: recipientHash,
      message_id: info.messageId,
    });

    return { id: info.messageId as string };
  }

  async sendAccountLinkEmail(params: {
    to: string;
    name: string;
    linkUrl: string;
    googleEmail: string;
  }): Promise<{ id: string }> {
    const { to, name, linkUrl, googleEmail } = params;
    const { subject, html, text } = linkAccountTemplate({ name, linkUrl, googleEmail });

    const info = await this.transporter.sendMail({
      from: this.from,
      to,
      replyTo: this.replyTo,
      subject,
      html,
      text,
    });

    const recipientHash = crypto.createHash("sha256").update(to).digest("hex");
    console.info("[GmailSmtpAdapter] sent", {
      provider: "gmail",
      recipient_hash: recipientHash,
      message_id: info.messageId,
    });

    return { id: info.messageId as string };
  }
}
