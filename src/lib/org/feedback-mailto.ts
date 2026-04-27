/** Default recipient for org "send feedback" mailto flows. */
export const ORG_FEEDBACK_MAILTO_DEFAULT = "web3privacynow@protonmail.com";

export type BuildOrgFeedbackMailtoParams = {
  /** Plain address (no display name) for widest mail client support */
  to: string;
  subject: string;
  message: string;
  /** If set, appended under a separator so the team can reply */
  replyEmail?: string;
};

/**
 * Builds a mailto: URL that opens the user's mail client with prefilled recipient, subject, and body.
 */
export function buildOrgFeedbackMailto(params: BuildOrgFeedbackMailtoParams): string {
  const to = params.to.trim() || ORG_FEEDBACK_MAILTO_DEFAULT;
  const subject = (params.subject.trim() || "Feedback").slice(0, 500);
  let body = params.message.trim();
  const reply = params.replyEmail?.trim();
  if (reply) {
    body = body ? `${body}\n\n---\nReply to: ${reply}` : `Reply to: ${reply}`;
  }
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
