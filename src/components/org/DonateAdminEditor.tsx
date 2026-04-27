"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ORG_ADMIN_PREVIEW_KEY,
  useSetOrgPreviewContent,
  type Content,
} from "@/lib/org/OrgContentContext";
import AdminFileUpload from "@/components/org/AdminFileUpload";
import { useAdminToast } from "@/components/org/AdminToast";
import "@/styles/org/admin.css";

function cloneContent(c: Content): Content {
  return JSON.parse(JSON.stringify(c));
}

type DonationData = {
  title?: string;
  text?: string;
  ctaText?: string;
  ctaLink?: string;
  heroBackgroundImage?: string;
};

type InvolveCard = {
  title: string;
  description: string;
};

type NftItem = {
  price: string;
  description: string;
  cta: string;
  image: string;
};

type MembershipTier = {
  title: string;
  description: string;
  benefits: string[];
  price: string;
  priceNote: string;
  cta: string;
  href: string;
};

const DONATE_SECTIONS = [
  { id: "hero", label: "Hero" },
  { id: "involved", label: "Get Involved" },
  { id: "nft", label: "NFTs" },
  { id: "donation", label: "Donation Amounts" },
  { id: "membership", label: "Membership" },
] as const;

export default function DonateAdminEditor({ initialContent }: { initialContent: Content }) {
  const [content, setContent] = useState<Content>(() => {
    if (typeof window === "undefined") return cloneContent(initialContent);
    try {
      const raw = window.localStorage.getItem(ORG_ADMIN_PREVIEW_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as Content;
        return {
          ...cloneContent(initialContent),
          donation: stored.donation ?? (initialContent as Content).donation,
          donatePageConfig: stored.donatePageConfig ?? (initialContent as Content).donatePageConfig,
        };
      }
    } catch {}
    return cloneContent(initialContent);
  });
  const setPreview = useSetOrgPreviewContent();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string>("hero");
  const { addToast } = useAdminToast();

  const donation = (content.donation ?? {}) as DonationData;
  const config = (content.donatePageConfig ?? {}) as {
    involveCards?: InvolveCard[];
    nftItems?: NftItem[];
    membershipTiers?: MembershipTier[];
    sectionTitle?: string;
    nftSectionTitle?: string;
    donationSectionTitle?: string;
    membershipSectionTitle?: string;
  };

  const setDonation = useCallback((next: DonationData) => {
    setContent((prev) => ({ ...prev, donation: next }));
  }, []);

  const setConfig = useCallback((next: typeof config) => {
    setContent((prev) => ({ ...prev, donatePageConfig: next }));
  }, []);

  const persistDonate = useCallback(async () => {
    const res = await fetch("/api/org/default-content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        merge: {
          donation: content.donation ?? {},
          donatePageConfig: content.donatePageConfig ?? {},
        },
      }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error || `Save failed (${res.status})`);
    }
  }, [content.donation, content.donatePageConfig]);

  const saveAndPreview = useCallback(async () => {
    try {
      await persistDonate();
      setPreview(content);
      addToast("success", "Donate page saved to website");
      router.refresh();
      window.open("/donate", "_blank");
    } catch (e) {
      addToast("error", e instanceof Error ? e.message : "Save failed");
    }
  }, [content, setPreview, addToast, router, persistDonate]);

  const saveOnly = useCallback(async () => {
    try {
      await persistDonate();
      setPreview(content);
      addToast("success", "Donate page saved to website");
      router.refresh();
    } catch (e) {
      addToast("error", e instanceof Error ? e.message : "Save failed");
    }
  }, [content, setPreview, addToast, router, persistDonate]);

  const involveCards: InvolveCard[] = config.involveCards ?? [
    { title: "Speaker at our Events", description: "Support our future activities and help us keep building tools, research, and events for privacy." },
    { title: "Full-stack programmer / Builder", description: "Support our future activities and help us keep building tools, research, and events for privacy." },
    { title: "Volunteer", description: "Support our future activities and help us keep building tools, research, and events for privacy." },
  ];

  const nftItems: NftItem[] = config.nftItems ?? [
    { price: "0.05 ETH", description: "If you want to support us and give thanks.", cta: "MINT PRIVACY AVATAR", image: "/images/donate/page/assets/nft-1.webp" },
    { price: "0.1 ETH", description: "Ideal as giveback for some W3PN goodies (Shirts, Pins, Sticker packs,…)", cta: "MINT PRIVACY CREW", image: "/images/donate/page/assets/nft-2.webp" },
    { price: "1 ETH", description: "If you are want to support us in our activities in future", cta: "MINT PRIVACY PATRON", image: "/images/donate/page/assets/nft-3.webp" },
  ];

  const membershipTiers: MembershipTier[] = config.membershipTiers ?? [
    { title: "Individual", description: "For members who want to be more involved...", benefits: ["You are supporting a good cause!", "Guaranteed access to all our events", "Privacy swag pack", "Deals from our partners"], price: "€100 / Year", priceNote: "Price", cta: "BECOME A MEMBER", href: "https://web3privacy.info/membership/" },
    { title: "Organisations", description: "Members are our chosen collaborators...", benefits: ["Greater Exposure", "Access to Talent", "Targeted Outreach", "Thought Leadership"], price: "€15K – €100K / Year", priceNote: "Membership ranges", cta: "REQUEST TIER BREAKDOWN", href: "https://web3privacy.info/membership/" },
    { title: "Event Sponsor", description: "For organizations who want to sponsor...", benefits: [], price: "€1K – €40K / Event", priceNote: "Sponsorship ranges", cta: "BECOME A SPONSOR", href: "https://web3privacy.info/membership/" },
  ];

  return (
    <div className="org-admin-root">
      <div className="org-admin-header">
        <h1>Donate</h1>
        <div className="org-admin-actions">
          <Link href="/donate" className="org-admin-btn org-admin-btn--secondary" target="_blank">View Page</Link>
          <button type="button" className="org-admin-btn org-admin-btn--secondary" onClick={saveOnly}>
            Save
          </button>
          <button type="button" className="org-admin-btn org-admin-btn--primary" onClick={saveAndPreview}>
            Save &amp; view site
          </button>
        </div>
      </div>

      <div className="org-admin-layout">
      <nav className="org-admin-nav">
        {DONATE_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`org-admin-nav-item ${activeSection === s.id ? "is-active" : ""}`}
            onClick={() => setActiveSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <div className="org-admin-form">
        {activeSection === "hero" && (
          <section className="org-admin-block">
            <h2>Hero Section</h2>
            <div className="org-admin-field">
              <label className="org-admin-label">Title</label>
              <textarea
                className="org-admin-textarea"
                rows={3}
                value={donation.title ?? ""}
                onChange={(e) => setDonation({ ...donation, title: e.target.value })}
                placeholder="Web3privacy is financed by our community..."
              />
            </div>
            <div className="org-admin-field">
              <label className="org-admin-label">Description Text</label>
              <textarea
                className="org-admin-textarea"
                rows={3}
                value={donation.text ?? ""}
                onChange={(e) => setDonation({ ...donation, text: e.target.value })}
                placeholder="An open, anonymous, free, and secure privacy ecosystem..."
              />
            </div>
            <div className="org-admin-field">
              <label className="org-admin-label">Hero Background Image URL</label>
              <div className="org-admin-upload-row">
                <input
                  value={donation.heroBackgroundImage ?? ""}
                  onChange={(e) => setDonation({ ...donation, heroBackgroundImage: e.target.value })}
                  placeholder="/images/donate/page/assets/bg-donate-hero.jpg"
                  className="org-admin-input org-admin-input--wide"
                />
                <AdminFileUpload
                  folder="donate"
                  label="Upload image"
                  onUploaded={(url) => setDonation({ ...donation, heroBackgroundImage: url })}
                />
              </div>
            </div>
          </section>
        )}

        {activeSection === "involved" && (
          <section className="org-admin-block">
            <h2>Get Involved Cards</h2>
            <p className="org-admin-hint">Edit the cards shown in the Get Involved section.</p>
            {involveCards.map((card, i) => (
              <div key={i} className="org-admin-subblock">
                <div className="org-admin-field">
                  <label className="org-admin-label">Card {i + 1} Title</label>
                  <input
                    className="org-admin-input"
                    value={card.title}
                    onChange={(e) => {
                      const next = [...involveCards];
                      next[i] = { ...next[i]!, title: e.target.value };
                      setConfig({ ...config, involveCards: next });
                    }}
                  />
                </div>
                <div className="org-admin-field">
                  <label className="org-admin-label">Card {i + 1} Description</label>
                  <textarea
                    className="org-admin-textarea"
                    rows={2}
                    value={card.description}
                    onChange={(e) => {
                      const next = [...involveCards];
                      next[i] = { ...next[i]!, description: e.target.value };
                      setConfig({ ...config, involveCards: next });
                    }}
                  />
                </div>
              </div>
            ))}
          </section>
        )}

        {activeSection === "nft" && (
          <section className="org-admin-block">
            <h2>NFT Section</h2>
            <div className="org-admin-field">
              <label className="org-admin-label">Section Title</label>
              <input
                className="org-admin-input"
                value={config.nftSectionTitle ?? "Support privacy on-chain by minting W3PN NFTs"}
                onChange={(e) => setConfig({ ...config, nftSectionTitle: e.target.value })}
              />
            </div>
            {nftItems.map((item, i) => (
              <div key={i} className="org-admin-subblock">
                <h3>NFT {i + 1}</h3>
                <div className="org-admin-field-grid">
                  <div className="org-admin-field">
                    <label className="org-admin-label">Price</label>
                    <input
                      className="org-admin-input"
                      value={item.price}
                      onChange={(e) => {
                        const next = [...nftItems];
                        next[i] = { ...next[i]!, price: e.target.value };
                        setConfig({ ...config, nftItems: next });
                      }}
                    />
                  </div>
                  <div className="org-admin-field">
                    <label className="org-admin-label">Button Text</label>
                    <input
                      className="org-admin-input"
                      value={item.cta}
                      onChange={(e) => {
                        const next = [...nftItems];
                        next[i] = { ...next[i]!, cta: e.target.value };
                        setConfig({ ...config, nftItems: next });
                      }}
                    />
                  </div>
                  <div className="org-admin-field org-admin-field--full">
                    <label className="org-admin-label">Description</label>
                    <textarea
                      className="org-admin-textarea"
                      rows={2}
                      value={item.description}
                      onChange={(e) => {
                        const next = [...nftItems];
                        next[i] = { ...next[i]!, description: e.target.value };
                        setConfig({ ...config, nftItems: next });
                      }}
                    />
                  </div>
                  <div className="org-admin-field org-admin-field--full">
                    <label className="org-admin-label">Image Path</label>
                    <input
                      className="org-admin-input"
                      value={item.image}
                      onChange={(e) => {
                        const next = [...nftItems];
                        next[i] = { ...next[i]!, image: e.target.value };
                        setConfig({ ...config, nftItems: next });
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {activeSection === "donation" && (
          <section className="org-admin-block">
            <h2>Donation Section</h2>
            <div className="org-admin-field">
              <label className="org-admin-label">Section Title</label>
              <input
                className="org-admin-input"
                value={config.donationSectionTitle ?? "Consider a donation to support out future work"}
                onChange={(e) => setConfig({ ...config, donationSectionTitle: e.target.value })}
              />
            </div>
            <p className="org-admin-hint">
              Donation amounts and wallet addresses are configured in <code>donation-config.ts</code>.
            </p>
          </section>
        )}

        {activeSection === "membership" && (
          <section className="org-admin-block">
            <h2>Membership Section</h2>
            <div className="org-admin-field">
              <label className="org-admin-label">Section Title</label>
              <input
                className="org-admin-input"
                value={config.membershipSectionTitle ?? "Membership"}
                onChange={(e) => setConfig({ ...config, membershipSectionTitle: e.target.value })}
              />
            </div>
            {membershipTiers.map((tier, i) => (
              <div key={i} className="org-admin-subblock">
                <h3>{tier.title}</h3>
                <div className="org-admin-field-grid">
                  <div className="org-admin-field">
                    <label className="org-admin-label">Title</label>
                    <input
                      className="org-admin-input"
                      value={tier.title}
                      onChange={(e) => {
                        const next = [...membershipTiers];
                        next[i] = { ...next[i]!, title: e.target.value };
                        setConfig({ ...config, membershipTiers: next });
                      }}
                    />
                  </div>
                  <div className="org-admin-field">
                    <label className="org-admin-label">Price</label>
                    <input
                      className="org-admin-input"
                      value={tier.price}
                      onChange={(e) => {
                        const next = [...membershipTiers];
                        next[i] = { ...next[i]!, price: e.target.value };
                        setConfig({ ...config, membershipTiers: next });
                      }}
                    />
                  </div>
                  <div className="org-admin-field org-admin-field--full">
                    <label className="org-admin-label">Description</label>
                    <textarea
                      className="org-admin-textarea"
                      rows={2}
                      value={tier.description}
                      onChange={(e) => {
                        const next = [...membershipTiers];
                        next[i] = { ...next[i]!, description: e.target.value };
                        setConfig({ ...config, membershipTiers: next });
                      }}
                    />
                  </div>
                  <div className="org-admin-field">
                    <label className="org-admin-label">CTA Button Text</label>
                    <input
                      className="org-admin-input"
                      value={tier.cta}
                      onChange={(e) => {
                        const next = [...membershipTiers];
                        next[i] = { ...next[i]!, cta: e.target.value };
                        setConfig({ ...config, membershipTiers: next });
                      }}
                    />
                  </div>
                  <div className="org-admin-field">
                    <label className="org-admin-label">CTA Link</label>
                    <input
                      className="org-admin-input"
                      value={tier.href}
                      onChange={(e) => {
                        const next = [...membershipTiers];
                        next[i] = { ...next[i]!, href: e.target.value };
                        setConfig({ ...config, membershipTiers: next });
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
      </div>
    </div>
  );
}
