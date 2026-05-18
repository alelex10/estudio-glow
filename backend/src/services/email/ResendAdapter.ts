/**
 * ResendAdapter — Resend SDK implementation for transactional email.
 *
 * Recommended for production. Better deliverability, higher rate limits than Gmail SMTP.
 *
 * Spec refs: F4.3, F4.5, F4.7, S4-B
 * Design refs: Section 4.4 (ResendAdapter sketch)
 */
import { Resend } from "resend";
import crypto from "crypto";
import type { EmailService } from "./EmailService";
import { verifyEmailTemplate } from "./templates/verifyEmail";
import { linkAccountTemplate } from "./templates/linkAccount";
import { setPasswordTemplate } from "./templates/setPassword";

export interface ResendConfig {
  apiKey: string;
  from: string;
}

export class ResendAdapter implements EmailService {
  private readonly resend: Resend;
  private readonly from: string;

  constructor({ apiKey, from }: ResendConfig) {
    this.from = from;
    this.resend = new Resend(apiKey);

    // F4.7: Optional boot probe — warn-only if the API key is invalid.
    // The first actual send() will fail fast and propagate the error.
    // We skip an actual network call here to avoid blocking startup.
    if (!apiKey || apiKey.length < 10) {
      console.warn(
        "[ResendAdapter] RESEND_API_KEY looks invalid. First send() will fail.",
      );
    }
  }

  async sendVerificationEmail(params: {
    to: string;
    name: string;
    verifyUrl: string;
  }): Promise<{ id: string }> {
    const { to, name, verifyUrl } = params;
    const { subject, html, text } = verifyEmailTemplate({ name, url: verifyUrl });

    const result = await this.resend.emails.send({
      from: this.from,
      to,
      subject,
      html,
      text,
    });

    if (result.error) {
      throw new Error(`[ResendAdapter] Failed to send email: ${result.error.message}`);
    }

    const messageId = result.data?.id ?? "unknown";

    // F4.5: log recipient hash, never the raw email or URL
    const recipientHash = crypto.createHash("sha256").update(to).digest("hex");
    console.info("[ResendAdapter] sent", {
      provider: "resend",
      recipient_hash: recipientHash,
      message_id: messageId,
    });

    return { id: messageId };
  }

  async sendAccountLinkEmail(params: {
    to: string;
    name: string;
    linkUrl: string;
    googleEmail: string;
  }): Promise<{ id: string }> {
    const { to, name, linkUrl, googleEmail } = params;
    const { subject, html, text } = linkAccountTemplate({ name, linkUrl, googleEmail });

    const result = await this.resend.emails.send({
      from: this.from,
      to,
      subject,
      html,
      text,
    });

    if (result.error) {
      throw new Error(`[ResendAdapter] Failed to send email: ${result.error.message}`);
    }

    const messageId = result.data?.id ?? "unknown";

    const recipientHash = crypto.createHash("sha256").update(to).digest("hex");
    console.info("[ResendAdapter] sent", {
      provider: "resend",
      recipient_hash: recipientHash,
      message_id: messageId,
    });

    return { id: messageId };
  }

  async sendSetPasswordEmail(params: {
    to: string;
    name: string;
    setPasswordUrl: string;
  }): Promise<{ id: string }> {
    const { to, name, setPasswordUrl } = params;
    const { subject, html, text } = setPasswordTemplate({ name, url: setPasswordUrl });

    const result = await this.resend.emails.send({
      from: this.from,
      to,
      subject,
      html,
      text,
    });

    if (result.error) {
      throw new Error(`[ResendAdapter] Failed to send email: ${result.error.message}`);
    }

    const messageId = result.data?.id ?? "unknown";

    const recipientHash = crypto.createHash("sha256").update(to).digest("hex");
    console.info("[ResendAdapter] sent", {
      provider: "resend",
      recipient_hash: recipientHash,
      message_id: messageId,
    });

    return { id: messageId };
  }
}
