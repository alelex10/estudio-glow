/**
 * EmailService interface — task-oriented, not transport-oriented.
 * Callers should not know about HTML, subject lines, or transport protocols.
 * Adapters compose subject + HTML internally (using template modules).
 *
 * Spec refs: F4.1
 * Design refs: Section 4.2
 */
export interface EmailService {
  /**
   * Sends a verification email with a clickable URL to the user.
   * The URL must already contain the raw token as a query param.
   * The adapter logs { provider, recipient_hash, message_id } — never the URL or token (F4.5).
   */
  sendVerificationEmail(params: {
    to: string;
    name: string;
    verifyUrl: string;
  }): Promise<{ id: string }>;

  /**
   * Sends an account-link confirmation email for the Google OAuth linking flow.
   * The linkUrl contains the raw ACCOUNT_LINK token as a query param.
   * The googleEmail is shown to the user as context ("link your account with X").
   */
  sendAccountLinkEmail(params: {
    to: string;
    name: string;
    linkUrl: string;
    googleEmail: string;
  }): Promise<{ id: string }>;
}
