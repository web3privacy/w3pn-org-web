"use client";

import { useState } from "react";
import { buildOrgFeedbackMailto, ORG_FEEDBACK_MAILTO_DEFAULT } from "@/lib/org/feedback-mailto";

const DEFAULT_FEEDBACK_DESC =
  "Your perspective helps us build better tools for the privacy community. Whether you have ideas for new features, spotted something that could be improved, or want to share how you use this project — we read every message and use feedback to shape what comes next. Drop us a line below; we'd love to hear from you.";

/** Tablet & mobile (≤1024px); keep in sync with two-line layout. */
const DEFAULT_FEEDBACK_DESC_SHORT =
  "We read every message. Share ideas, fixes, or how you use this project—it shapes what we build next.";

type FeedbackConfig =
  | {
      email?: string;
      subjectPrefix?: string;
      /** Full intro copy (desktop). Falls back to site default when omitted. */
      desc?: string;
      /** Shorter intro for ≤1024px; falls back to default short copy when omitted. */
      descShort?: string;
    }
  | undefined;

type Props = {
  projectName?: string;
  feedback?: FeedbackConfig;
};

export function ProjectDetailFeedback({ projectName, feedback }: Props) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const feedbackEmail = feedback?.email?.trim() || ORG_FEEDBACK_MAILTO_DEFAULT;
  const subjectPrefix =
    feedback?.subjectPrefix?.trim() || (projectName ? `Feedback [${projectName}]` : "Feedback");
  const subject = `${subjectPrefix}: from Visitor`;

  const fullDesc = feedback?.desc?.trim() || DEFAULT_FEEDBACK_DESC;
  const narrowDesc = feedback?.descShort?.trim() || DEFAULT_FEEDBACK_DESC_SHORT;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;
    const mailto = buildOrgFeedbackMailto({
      to: feedbackEmail,
      subject,
      message: trimmedMessage,
      replyEmail: email.trim() || undefined,
    });
    window.location.assign(mailto);
  };

  return (
    <section className="project-detail-feedback-section">
      <div className="project-detail-feedback-box">
        <div className="project-detail-feedback-main">
          <div className="project-detail-feedback-col project-detail-feedback-col--text">
            <img src="/images/projects/detail/assets/title-feedback.webp" alt="FEEDBACK" className="project-detail-section-title-img" width={180} height={40} />
            <p className="project-detail-feedback-desc project-detail-feedback-desc--desktop-lg">{fullDesc}</p>
            <p className="project-detail-feedback-desc project-detail-feedback-desc--tablet-mobile">{narrowDesc}</p>
          </div>
          <div className="project-detail-feedback-col project-detail-feedback-col--form">
            <form onSubmit={handleSubmit} className="project-detail-feedback-form">
              <textarea
                id="pd-feedback-message"
                placeholder="Place for your feedback"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                required
                className="project-detail-feedback-input project-detail-feedback-textarea"
              />
              <div className="project-detail-feedback-form-row">
                <input
                  id="pd-feedback-email"
                  type="email"
                  placeholder="Your e-mail (voluntary)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="project-detail-feedback-input project-detail-feedback-email"
                />
                <button type="submit" className="project-detail-feedback-submit">
                  SEND FEEDBACK
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
