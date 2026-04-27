"use client";

import { useState } from "react";
import { ACCENT, orgAsset } from "./ProjectDetailLayout";

const sectionStyle: React.CSSProperties = {
  borderTop: "1px solid rgba(255,255,255,0.1)",
  padding: "40px 0 56px",
  boxSizing: "border-box",
};

const DONATE_HREF = "/donate";

type DonateData = {
  ctaSection?: { image?: string; title?: string; body?: string; ctaHref?: string; ctaLabel?: string };
  communityAvatars?: string[];
  empowerTitle?: string;
  empowerImage?: string;
  investors?: Array<{ name: string; logo: string; href: string }>;
  investorsCta?: { href: string; label?: string };
};

export function ProjectDetailDonate({ donate: donateData }: { donate: DonateData | undefined }) {
  const [txId, setTxId] = useState("");
  const donate = donateData ?? {};
  const ctaSection = donate.ctaSection;
  const communityAvatars = donate.communityAvatars ?? [];
  const empowerTitle = donate.empowerTitle ?? "Empower Change With Your Donation";
  const empowerImage = donate.empowerImage;
  const investors = donate.investors ?? [];
  const investorsCta = donate.investorsCta;

  return (
    <>
      {ctaSection && (
        <section style={{ ...sectionStyle, background: "#fff", color: "#000" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
            {ctaSection.image && <img src={orgAsset(ctaSection.image)} alt="" style={{ width: 120, height: 120, objectFit: "contain" }} />}
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{ctaSection.title ?? "Contribute to Future of Privacy"}</h2>
            {ctaSection.body && <p style={{ margin: 0, fontSize: 15 }}>{ctaSection.body}</p>}
            {ctaSection.ctaHref && (
              <a href={ctaSection.ctaHref} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", padding: "12px 24px", borderRadius: 8, backgroundColor: "#000", color: "#fff", fontWeight: 600, textDecoration: "none" }}>{ctaSection.ctaLabel ?? "JOIN OUR COMMUNITY"}</a>
            )}
          </div>
        </section>
      )}
      {communityAvatars.length > 0 && (
        <section style={{ ...sectionStyle, paddingTop: 24, paddingBottom: 24 }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
            {communityAvatars.slice(0, 16).map((url, i) => (
              <div key={i} style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden" }}>
                <img src={orgAsset(url)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        </section>
      )}
      <section style={sectionStyle}>
        <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", position: "relative", background: "rgba(0,0,0,0.4)", minHeight: 120 }}>
          {empowerImage && (
            <div style={{ position: "absolute", inset: 0 }}>
              <img src={orgAsset(empowerImage)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }} />
            </div>
          )}
          <div style={{ position: "relative", padding: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.05em", color: "#fff", margin: 0, textTransform: "uppercase" }}>{empowerTitle}</h2>
            <a href={DONATE_HREF} style={{ marginTop: 20, display: "inline-block", padding: "12px 24px", borderRadius: 8, backgroundColor: ACCENT, color: "#000", fontWeight: 600, textDecoration: "none" }}>DONATE NOW</a>
          </div>
        </div>
        <div style={{ marginTop: 24 }}>
          <label htmlFor="pd-tx-id" style={{ display: "block", marginBottom: 8, fontSize: 14, color: "rgba(255,255,255,0.8)" }}>Enter Transaction ID / Hash</label>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input
              id="pd-tx-id"
              type="text"
              placeholder="Transaction ID / Hash"
              value={txId}
              onChange={(e) => setTxId(e.target.value)}
              style={{ flex: 1, minWidth: 200, padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 15 }}
            />
            <button
              type="button"
              onClick={() => window.open(`https://explorer.web3privacy.info/donate?theme=dark&tx=${encodeURIComponent(txId)}`, "_blank")}
              style={{ padding: "12px 24px", borderRadius: 8, backgroundColor: ACCENT, color: "#000", fontWeight: 600, border: "none", cursor: "pointer" }}
            >
              CHECK STATUS
            </button>
          </div>
        </div>
      </section>
      {investors.length > 0 && (
        <section style={sectionStyle}>
          <p style={{ margin: 0, fontSize: 16, color: "rgba(255,255,255,0.9)" }}>Thanks to our investors to make it happen</p>
          <div style={{ marginTop: 24, display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center", alignItems: "center" }}>
            {investors.map((inv, i) => (
              <a key={i} href={inv.href} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
                <img src={orgAsset(inv.logo)} alt={inv.name} style={{ height: 40, width: "auto", maxWidth: 120, objectFit: "contain", filter: "grayscale(1)" }} />
              </a>
            ))}
          </div>
          {investorsCta?.href && (
            <a href={investorsCta.href} target="_blank" rel="noopener noreferrer" style={{ marginTop: 24, display: "inline-block", padding: "12px 24px", borderRadius: 8, backgroundColor: ACCENT, color: "#000", fontWeight: 600, textDecoration: "none" }}>{investorsCta.label ?? "BECOME INVESTOR"}</a>
          )}
        </section>
      )}
    </>
  );
}
