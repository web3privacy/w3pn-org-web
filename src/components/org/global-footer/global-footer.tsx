"use client";

import * as React from "react";
import { externalAnchorRelProps } from "@/lib/org/external-anchor-props";
import { GlobalFooterSocialIcon } from "./global-footer-social-icon";
import type { GlobalFooterProps, FooterLink } from "./global-footer-types";

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
    </div>
  );
}

export function GlobalFooter({
  config,
  communityMembers = [],
  onNewsletterSubmit,
  newsletterState = "idle",
  newsletterMessage = "",
  variant,
}: GlobalFooterProps) {
  const [newsletterEmail, setNewsletterEmail] = React.useState("");
  const contribute = config.contribute;
  const donation = config.donation;
  const newsletter = config.newsletter;
  const members = config.members;
  const footer = config.footer;

  const displayedCommunityMembers = React.useMemo(() => {
    if (communityMembers.length > 0) return communityMembers.filter((m) => m.avatarUrl);
    const avatars = contribute?.communityAvatars as string[] | undefined;
    if (!Array.isArray(avatars)) return [];
    return avatars.map((url, i) => ({
      login: `community-${i + 1}`,
      avatarUrl: typeof url === "string" ? url : (url as { image?: string })?.image || "",
      profileUrl: "#support",
    })).filter((m) => m.avatarUrl);
  }, [communityMembers, contribute?.communityAvatars]);

  const handleNewsletterSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const email = newsletterEmail.trim();
      if (email && onNewsletterSubmit) onNewsletterSubmit(email);
    },
    [newsletterEmail, onNewsletterSubmit]
  );

  if (!contribute && !donation && !newsletter && !members && !footer) {
    return null;
  }

  return (
    <div className={`w3pn-global-footer${variant ? ` footer--${variant}` : ""}`}>
      {contribute && (
        <section className="contribute-wrap" id="support">
          <div className="contribute-block">
            <div className="contribute-logo-wrap">
              {contribute.roundLogoImage ? (
                <img src={contribute.roundLogoImage} alt="Privacy eye" className="contribute-round-logo" />
              ) : (
                <img src={contribute.eyeImage || ""} alt="Privacy eye" className="eye-art" />
              )}
            </div>
            <div className="contribute-copy">
              <h3>{contribute.title}</h3>
              <p>{contribute.text}</p>
              <a className="dark-btn" href={(contribute.ctaLink || "#").trim()} {...externalAnchorRelProps(contribute.ctaLink)}>
                {contribute.ctaText}
              </a>
            </div>
          </div>

          <div className="community-grid-fullwidth" aria-label="Our contributors">
            {displayedCommunityMembers.slice(0, 60).map((member, index) => {
              const avatarSrc =
                member.avatarUrl && member.avatarUrl.startsWith("http")
                  ? `${member.avatarUrl.replace(/\?.*$/, "")}?s=96`
                  : member.avatarUrl;
              return (
                <a
                  key={`${member.login}-${index}`}
                  href={member.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={member.login}
                  title={member.login}
                  className="community-grid-avatar"
                >
                  <img
                    src={avatarSrc}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </a>
              );
            })}
          </div>

          {donation && (
            <article className="donation-card" aria-label={donation.title}>
              <div className="donation-copy">
                <h4>{donation.title}</h4>
                <p>{donation.text}</p>
                <a className="primary-btn" href={(donation.ctaLink || "#").trim()} {...externalAnchorRelProps(donation.ctaLink)}>
                  {donation.ctaText}
                </a>
              </div>
              <div className="donation-image-wrap">
                <img src={donation.backgroundImage || ""} alt={donation.title || ""} />
              </div>
            </article>
          )}

          {newsletter && (
            <form className="newsletter-row" onSubmit={handleNewsletterSubmit}>
              <p>{newsletter.text || "Join our Newsletter and get information from our ecosystem"}</p>
              <div className="newsletter-controls">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder={newsletter.placeholder || "Your e-mail"}
                  aria-label="Email address"
                />
                <button
                  className="dark-btn newsletter-btn"
                  type="submit"
                  disabled={newsletterState === "loading"}
                >
                  {newsletter.buttonText || "SUBSCRIBE"}
                </button>
              </div>
            </form>
          )}
          {newsletterMessage ? (
            <p className={`newsletter-status ${newsletterState}`}>{newsletterMessage}</p>
          ) : null}
        </section>
      )}

      {!contribute && donation && (
        <section className="contribute-wrap">
          <article className="donation-card">
            <div className="donation-copy">
              <h4>{donation.title}</h4>
              <p>{donation.text}</p>
              <a className="primary-btn" href={(donation.ctaLink || "#").trim()} {...externalAnchorRelProps(donation.ctaLink)}>
                {donation.ctaText}
              </a>
            </div>
            <div className="donation-image-wrap">
              <img src={donation.backgroundImage || ""} alt={donation.title || ""} />
            </div>
          </article>
          {newsletter && (
            <form className="newsletter-row" onSubmit={handleNewsletterSubmit}>
              <p>{newsletter.text}</p>
              <div className="newsletter-controls">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder={newsletter.placeholder || "Your e-mail"}
                  aria-label="Email address"
                />
                <button
                  className="dark-btn newsletter-btn"
                  type="submit"
                  disabled={newsletterState === "loading"}
                >
                  {newsletter.buttonText || "SUBSCRIBE"}
                </button>
              </div>
            </form>
          )}
          {newsletterMessage ? (
            <p className={`newsletter-status ${newsletterState}`}>{newsletterMessage}</p>
          ) : null}
        </section>
      )}

      {!contribute && !donation && newsletter && (
        <section className="contribute-wrap">
          <form className="newsletter-row" onSubmit={handleNewsletterSubmit}>
            <p>{newsletter.text}</p>
            <div className="newsletter-controls">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder={newsletter.placeholder || "Your e-mail"}
                aria-label="Email address"
              />
              <button
                className="dark-btn newsletter-btn"
                type="submit"
                disabled={newsletterState === "loading"}
              >
                {newsletter.buttonText || "SUBSCRIBE"}
              </button>
            </div>
          </form>
          {newsletterMessage ? (
            <p className={`newsletter-status ${newsletterState}`}>{newsletterMessage}</p>
          ) : null}
        </section>
      )}

      {members && members.logos && members.logos.length > 0 && (
        <section className="members-section">
          <div className="content-shell content-shell--with-padding">
            <SectionTitle title={members.title || "Our members"} />
            <div className="member-grid">
              {members.logos.map((member, index) => {
                const logoInner = <img src={member.image} alt={member.name} />;
                const nameInner = member.name;
                return (
                  <article key={`${member.name}-${member.image}-${index}`} className="member-card">
                    {member.href ? (
                      <a className="logo-wrap" href={member.href} target="_blank" rel="noopener noreferrer">
                        {logoInner}
                      </a>
                    ) : (
                      <div className="logo-wrap">{logoInner}</div>
                    )}
                    <h5>
                      {member.href ? (
                        <a href={member.href} target="_blank" rel="noopener noreferrer">
                          {nameInner}
                        </a>
                      ) : (
                        nameInner
                      )}
                    </h5>
                    <p>
                      {member.handleHref && member.handle ? (
                        <a href={member.handleHref} target="_blank" rel="noopener noreferrer">
                          {member.handle}
                        </a>
                      ) : (
                        member.handle || ""
                      )}
                    </p>
                  </article>
                );
              })}
            </div>
            {members.ctaLink && members.ctaText && (
              <div className="center-cta-wrap">
                <a className="outline-btn" href={members.ctaLink.trim()} {...externalAnchorRelProps(members.ctaLink)}>
                  {members.ctaText}
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {footer && (
        <footer className="site-footer">
          <div className="site-footer-inner">
            <div className="footer-top">
              <img src={footer.logo || ""} alt="web3privacy now" className="footer-logo" />
              {footer.linksColumns && footer.linksColumns.length > 0 ? (
                <div
                  className={`footer-sitemap footer-sitemap-${
                    footer.linksColumns.length >= 4 ? "four" : footer.linksColumns.length === 2 ? "two" : "three"
                  }-cols`}
                >
                  {footer.linksColumns.map((column, colIndex) => (
                    <div key={colIndex} className="footer-sitemap-col">
                      <ul>
                        {(Array.isArray(column) ? column : []).map((item: FooterLink) => (
                          <li key={item.label}>
                            <a
                              href={item.href}
                              {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
                            >
                              {item.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : footer.linksColumn1 ? (
                <div
                  className={`footer-sitemap footer-sitemap-${
                    footer.linksColumn3?.length ? "three" : "two"
                  }-cols`}
                >
                  <div className="footer-sitemap-col">
                    <ul>
                      {footer.linksColumn1.map((item) => (
                        <li key={item.label}>
                          <a
                            href={item.href}
                            {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
                          >
                            {item.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="footer-sitemap-col">
                    <ul>
                      {footer.linksColumn2?.map((item) => (
                        <li key={item.label}>
                          <a
                            href={item.href}
                            {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
                          >
                            {item.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {footer.linksColumn3 && footer.linksColumn3.length > 0 ? (
                    <div className="footer-sitemap-col">
                      <ul>
                        {footer.linksColumn3.map((item) => (
                          <li key={item.label}>
                            <a
                              href={item.href}
                              {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
                            >
                              {item.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : footer.siteMap ? (
                <div className="footer-sitemap">
                  {footer.siteMap.org && (
                    <div className="footer-sitemap-col">
                      <h6>Organization</h6>
                      <ul>
                        {footer.siteMap.org.map((item) => (
                          <li key={item.label}>
                            <a
                              href={item.href}
                              {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
                            >
                              {item.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {footer.siteMap.portal && (
                    <div className="footer-sitemap-col">
                      <h6>Portal</h6>
                      <ul>
                        {footer.siteMap.portal.map((item) => (
                          <li key={item.label}>
                            <a
                              href={item.href}
                              {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
                            >
                              {item.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {footer.siteMap.legal && (
                    <div className="footer-sitemap-col">
                      <h6>Legal &amp; Docs</h6>
                      <ul>
                        {footer.siteMap.legal.map((item) => (
                          <li key={item.label}>
                            <a
                              href={item.href}
                              {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
                            >
                              {item.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : footer.columns ? (
                <div className="footer-columns">
                  {footer.columns.map((column, index) => (
                    <ul key={index}>
                      {column.map((linkText) => (
                        <li key={linkText}>
                          <a href="#top">{linkText}</a>
                        </li>
                      ))}
                    </ul>
                  ))}
                </div>
              ) : null}
              <div className="footer-socials">
                {footer.socialLabel && (
                  <p className="footer-social-label">{footer.socialLabel}</p>
                )}
                <div className="footer-social-icons">
                  {Array.isArray(footer.social) &&
                  footer.social[0] &&
                  typeof footer.social[0] === "object" &&
                  (footer.social[0] as { href?: string }).href ? (
                    footer.social.map((s) => {
                      const item = s as { label: string; icon?: string; href: string };
                      return (
                        <a
                          key={item.label}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={item.label}
                          title={item.label}
                          className="footer-social-link"
                        >
                          <GlobalFooterSocialIcon icon={item.icon || item.label?.toLowerCase() || ""} />
                        </a>
                      );
                    })
                  ) : null}
                </div>
              </div>
            </div>
            {footer.legal && <p className="footer-legal">{footer.legal}</p>}
          </div>
        </footer>
      )}
    </div>
  );
}
