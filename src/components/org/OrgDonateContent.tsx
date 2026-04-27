"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { SiBitcoin, SiEthereum, SiMonero, SiZcash } from "react-icons/si";
import {
  DONATION_ASSETS,
  DONATION_CRYPTO_ADDRESSES,
  DONATION_EUR_PRESETS,
  FIXED_CRYPTO_DONATION_MAJOR,
  type DonationAssetId,
} from "@/lib/org/donation-config";
import type { CryptoEurPrices } from "@/lib/org/donation";
import {
  buildPaymentUri,
  buildPaymentUriFixedMajor,
  fetchCryptoEurPrices,
  navigateToPaymentUri,
  openWalletDeepLink,
  sendEthDonation,
  sendEthDonationFixedMajor,
} from "@/lib/org/donation";

const DonateNetworkPicker = dynamic(
  () =>
    import("@/components/org/DonateNetworkPicker").then((m) => ({ default: m.DonateNetworkPicker })),
  {
    ssr: false,
    loading: () => (
      <div
        className="donate-network-picker-trigger donate-network-picker-trigger--loading"
        aria-busy="true"
        aria-label="Loading network selector"
      />
    ),
  },
);

type Content = Record<string, unknown>;

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

const CONTACT_MAIL = "mailto:web3privacynow@protonmail.com";

function formatEurDisplay(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

function DonateCryptoIcon({ assetId }: { assetId: DonationAssetId }) {
  const cls = "donate-address-crypto-icon-svg";
  if (assetId === "bitcoin") return <SiBitcoin className={cls} size={18} aria-hidden />;
  if (assetId === "monero") return <SiMonero className={cls} size={18} aria-hidden />;
  if (assetId === "zcash") return <SiZcash className={cls} size={18} aria-hidden />;
  return <SiEthereum className={cls} size={18} aria-hidden />;
}

function nativeEstimateLabel(amountEur: number, assetId: DonationAssetId, p: CryptoEurPrices): string {
  const price =
    assetId === "ethereum"
      ? p.ethereum
      : assetId === "bitcoin"
        ? p.bitcoin
        : assetId === "monero"
          ? p.monero
          : p.zcash;
  if (price <= 0) return "—";
  const n = amountEur / price;
  const sym = assetId === "ethereum" ? "ETH" : assetId === "bitcoin" ? "BTC" : assetId === "monero" ? "XMR" : "ZEC";
  const digits = assetId === "monero" ? 5 : 4;
  return `~${n.toFixed(digits)} ${sym}`;
}

/** Approximate EUR value for the fixed-crypto tier (1 ETH / 1 BTC / 10 XMR / 10 ZEC). */
function fixedCryptoEurLabel(assetId: DonationAssetId, p: CryptoEurPrices): string {
  const spec = FIXED_CRYPTO_DONATION_MAJOR[assetId];
  const major = Number.parseFloat(spec.major);
  if (!Number.isFinite(major) || major <= 0) return "—";
  const unitEur =
    assetId === "ethereum"
      ? p.ethereum
      : assetId === "bitcoin"
        ? p.bitcoin
        : assetId === "monero"
          ? p.monero
          : p.zcash;
  if (unitEur <= 0) return "—";
  const eur = major * unitEur;
  return `≈ ${formatEurDisplay(eur)}`;
}

type DonateOutcome =
  | { kind: "eth"; ok: true; txHash: string }
  | { kind: "eth"; ok: false; error: string }
  | { kind: "uri"; ok: true }
  | { kind: "uri"; ok: false; error: string };

/* ── Hero ── */

function DonateHeroSection({ donation }: { donation?: { title?: string; text?: string; heroBackgroundImage?: string } }) {
  const heroBackgroundImage =
    donation?.heroBackgroundImage?.trim() || "/images/donate/page/assets/bg-donate-hero.jpg";
  return (
    <section className="donate-hero hero">
      <img className="hero-bg" src={heroBackgroundImage} alt="" />
      <div className="hero-content">
        <h1>
          {donation?.title ??
            "Web3privacy is financed by our community, Events are always free, making privacy accessible as possible"}
        </h1>
        {donation?.text && <p className="donate-hero-desc">{donation.text}</p>}
      </div>
    </section>
  );
}

/* ── Get Involved ── */

function GetInvolvedSection() {
  const CARDS = [
    {
      title: "Speak at Events",
      description: "Present privacy research, projects, or lessons from the field.",
      icon: "mic",
      contactHref: "https://tally.so/r/nrOzXl",
      buttonLabel: "Propose a Talk",
    },
    {
      title: "Build with Us",
      description: "Design, code, and maintain privacy-focused public goods.",
      icon: "code",
      buttonLabel: "Start Building",
    },
    {
      title: "Support the Community",
      description: "Help with events, content, research, outreach, and operations.",
      icon: "volunteer_activism",
      contactHref: "https://tally.so/r/3lLqKo",
      buttonLabel: "Get Involved",
    },
  ];

  return (
    <section className="donate-section">
      <div className="content-shell content-shell--with-padding">
        <div className="donate-get-involved-title">
          <img
            src="/images/donate/page/assets/get-involved-title.webp"
            alt="GET INVOLVED"
            className="donate-get-involved-img"
          />
        </div>
        <h3
          className="donate-section-title donate-get-involved-heading"
          style={{ fontSize: "clamp(20px, 2vw, 28px)", fontWeight: 600 }}
        >
          Contribute / Build with Us
        </h3>
        <p className="donate-section-subtitle">
          Support our future activities and help sustain our work.
        </p>
        <div className="donate-involve-grid">
          {CARDS.map((card) => {
            const href = card.contactHref ?? CONTACT_MAIL;
            const isExternal = href.startsWith("http");
            return (
            <div key={card.title} className="donate-involve-card">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <a
                href={href}
                className="donate-involve-contact"
                {...(isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
              >
                {card.buttonLabel ?? "Contact us"}
              </a>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Crypto Donation ── */

function CryptoDonationSection() {
  const narrow512 = useMediaQuery("(max-width: 512px)");
  const [selectedAssetId, setSelectedAssetId] = useState<DonationAssetId>("ethereum");
  const [prices, setPrices] = useState<CryptoEurPrices>({
    ethereum: 0,
    bitcoin: 0,
    monero: 0,
    zcash: 0,
  });
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [result, setResult] = useState<DonateOutcome | null>(null);

  useEffect(() => {
    fetchCryptoEurPrices().then(setPrices);
  }, [selectedAssetId]);

  const selectedAsset = DONATION_ASSETS.find((a) => a.id === selectedAssetId) ?? DONATION_ASSETS[0]!;

  type DonationRun =
    | { kind: "eur"; eur: number }
    | { kind: "fixedMajor" };

  const runDonation = useCallback(
    async (arg: DonationRun) => {
      setResult(null);
      const asset = DONATION_ASSETS.find((a) => a.id === selectedAssetId);
      if (!asset) return;

      if (arg.kind === "fixedMajor") {
        const spec = FIXED_CRYPTO_DONATION_MAJOR[selectedAssetId];
        if (selectedAssetId === "ethereum") {
          setLoading(true);
          try {
            const res = await sendEthDonationFixedMajor(spec.major, asset.address);
            if (res.success) {
              setResult({ kind: "eth", ok: true, txHash: res.txHash });
            } else {
              setResult({ kind: "eth", ok: false, error: res.error });
            }
          } finally {
            setLoading(false);
          }
          return;
        }

        setLoading(true);
        try {
          const uri = buildPaymentUriFixedMajor(selectedAssetId, asset.address, spec.major);
          if (!uri) {
            setResult({ kind: "uri", ok: false, error: "Unsupported asset." });
            return;
          }
          const opened = openWalletDeepLink(uri);
          if (opened.success) {
            setResult({ kind: "uri", ok: true });
          } else {
            setResult({ kind: "uri", ok: false, error: opened.error });
          }
        } finally {
          setLoading(false);
        }
        return;
      }

      const amountEur = arg.eur;

      if (selectedAssetId === "ethereum") {
        setLoading(true);
        try {
          const res = await sendEthDonation(amountEur, asset.address);
          if (res.success) {
            setResult({ kind: "eth", ok: true, txHash: res.txHash });
          } else {
            setResult({ kind: "eth", ok: false, error: res.error });
          }
        } finally {
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        let p = prices;
        const needsPriceForAmount =
          amountEur > 0 &&
          (selectedAssetId === "bitcoin"
            ? p.bitcoin <= 0
            : selectedAssetId === "monero"
              ? p.monero <= 0
              : p.zcash <= 0);
        let openedAfterAsync = false;
        if (needsPriceForAmount) {
          p = await fetchCryptoEurPrices();
          setPrices(p);
          openedAfterAsync = true;
        }
        const uri = buildPaymentUri(selectedAssetId, asset.address, amountEur, p);
        if (!uri) {
          setResult({ kind: "uri", ok: false, error: "Unsupported asset." });
          return;
        }
        if (openedAfterAsync) {
          navigateToPaymentUri(uri);
          setResult({ kind: "uri", ok: true });
          return;
        }
        const opened = openWalletDeepLink(uri);
        if (opened.success) {
          setResult({ kind: "uri", ok: true });
        } else {
          setResult({ kind: "uri", ok: false, error: opened.error });
        }
      } finally {
        setLoading(false);
      }
    },
    [selectedAssetId, prices],
  );

  const handleDonateEur = useCallback(
    (amountEur: number) => {
      void runDonation({ kind: "eur", eur: amountEur });
    },
    [runDonation],
  );

  const handleDonateFixedMajor = useCallback(() => {
    void runDonation({ kind: "fixedMajor" });
  }, [runDonation]);

  const handleCustomDonate = useCallback(() => {
    const parsed = parseFloat(customAmount);
    if (Number.isNaN(parsed) || parsed <= 0) {
      setResult({ kind: "eth", ok: false, error: "Enter a valid amount." });
      return;
    }
    void runDonation({ kind: "eur", eur: parsed });
  }, [customAmount, runDonation]);

  const copyAddress = (address: string, idx: number) => {
    navigator.clipboard.writeText(address);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const fixedSpec = FIXED_CRYPTO_DONATION_MAJOR[selectedAssetId];

  return (
    <section className="donate-section">
      <div className="content-shell content-shell--with-padding">
        <h2 className="donate-section-title">
          Consider a donation to support our future work
        </h2>
        <p className="donate-section-subtitle">
          Support our future activities and help us keep building tools, research, and events for privacy.{" "}
          <a href="#how" style={{ color: "#1a1a1a" }}>
            How funds are used
          </a>
        </p>

        <div className="donate-wallet-row donate-wallet-row--network-only">
          <span>Network:</span>
          <DonateNetworkPicker
            value={selectedAssetId}
            onChange={(id) => {
              setSelectedAssetId(id);
              setResult(null);
            }}
          />
        </div>

        <div className="donate-amount-grid">
          {DONATION_EUR_PRESETS.map(({ eur, description }) => (
            <div key={eur} className="donate-amount-card">
              <span className="donate-amount-value">{formatEurDisplay(eur)}</span>
              <p>
                {description}{" "}
                <span style={{ color: "#9ca3af" }}>
                  ({nativeEstimateLabel(eur, selectedAssetId, prices)})
                </span>
              </p>
              <button
                type="button"
                className="primary-btn"
                onClick={() => handleDonateEur(eur)}
                disabled={loading}
              >
                {loading
                  ? selectedAssetId === "ethereum"
                    ? "Sending…"
                    : "Opening…"
                  : selectedAssetId === "ethereum"
                    ? `DONATE ${formatEurDisplay(eur)}`
                    : `OPEN IN WALLET (${formatEurDisplay(eur)})`}
              </button>
            </div>
          ))}
          <div className="donate-amount-card">
            <span className="donate-amount-value">{fixedSpec.headline}</span>
            <p>
              A serious contribution to future initiatives.{" "}
              <span style={{ color: "#9ca3af" }}>({fixedCryptoEurLabel(selectedAssetId, prices)})</span>
            </p>
            <button
              type="button"
              className="primary-btn"
              onClick={handleDonateFixedMajor}
              disabled={loading}
            >
              {loading
                ? selectedAssetId === "ethereum"
                  ? "Sending…"
                  : "Opening…"
                : selectedAssetId === "ethereum"
                  ? `DONATE ${fixedSpec.headline}`
                  : `OPEN IN WALLET (${fixedSpec.headline})`}
            </button>
          </div>
          <div className="donate-custom-card">
            <input
              type="number"
              min={0}
              step={1}
              placeholder={narrow512 ? "EUR" : "EUR amount"}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="donate-custom-input"
            />
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6b7280" }}>
              Choose any amount you want to contribute.
            </p>
            <button
              type="button"
              className="primary-btn"
              onClick={handleCustomDonate}
              disabled={loading}
            >
              {loading
                ? selectedAssetId === "ethereum"
                  ? "Sending…"
                  : "Opening…"
                : selectedAssetId === "ethereum"
                  ? "DONATE"
                  : "OPEN IN WALLET"}
            </button>
          </div>
        </div>

        {result && (
          <div
            className={`donate-result ${
              (result.kind === "eth" && result.ok) || (result.kind === "uri" && result.ok)
                ? "donate-result--success"
                : "donate-result--error"
            }`}
          >
            {result.kind === "eth" && result.ok ? (
              <span>
                Thank you! Transaction:{" "}
                <a
                  href={`https://etherscan.io/tx/${result.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {result.txHash.slice(0, 10)}…
                </a>
              </span>
            ) : result.kind === "eth" && !result.ok ? (
              <span>{result.error}</span>
            ) : result.kind === "uri" && result.ok ? (
              <span>
                Payment link sent to your system. If your wallet did not open, copy the {selectedAsset.name}{" "}
                address below.
              </span>
            ) : result.kind === "uri" && !result.ok ? (
              <span>{result.error}</span>
            ) : null}
          </div>
        )}

        <div className="donate-addresses">
          <p className="donate-addresses-title">FOR OTHER DONATION YOU CAN USE OUR ADDRESSES:</p>
          {DONATION_CRYPTO_ADDRESSES.map((crypto, idx) => (
            <div key={crypto.name} className="donate-address-row">
              <span className="donate-address-crypto-icon" style={{ color: crypto.color }}>
                <DonateCryptoIcon assetId={crypto.id} />
              </span>
              <span className="donate-address-label">{crypto.name}:</span>
              <span className="donate-address-value">{crypto.address}</span>
              <button
                type="button"
                className="donate-address-copy"
                onClick={() => copyAddress(crypto.address, idx)}
              >
                {copiedIdx === idx ? "Copied!" : "Copy"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Membership ── */

const MEMBERSHIP_CONTACT_MAILTO = "mailto:web3privacynow@protonmail.com";
const MEMBERSHIP_TALLY_URL = "https://tally.so/r/mVxvgN";

function MembershipSection() {
  const narrow400 = useMediaQuery("(max-width: 399px)");
  const TIERS: Array<{
    title: string;
    description: string;
    benefits: string[];
    price: string;
    priceNote: string;
    cta: string;
    href: string;
    full: boolean;
    bgImage?: string;
    bgWidth?: number;
  }> = [
    {
      title: "Individual",
      description:
        "For members who want to be more involved in the governance of our initiative, we offer the opportunity to participate in the decisions and voting on our plans and other topics.",
      benefits: [
        "You are supporting a good cause!",
        "Guaranteed access to all our events",
        "Privacy swag pack",
        "Deals from our partners",
      ],
      price: "€100 / Year",
      priceNote: "Price",
      cta: "BECOME A MEMBER",
      href: MEMBERSHIP_CONTACT_MAILTO,
      full: false,
      bgImage: "/images/donate/page/assets/bg-individual.webp",
      bgWidth: 238,
    },
    {
      title: "Organisations",
      description:
        "Members are our chosen collaborators for mutual support and growth. Rather than one-time deals for individual events or projects, we strive for consistency collaboration to achieve lasting impact.",
      benefits: [
        "Greater Exposure",
        "Access to Talent",
        "Targeted Outreach",
        "Thought Leadership",
      ],
      price: "€15K – €100K / Year",
      priceNote: "Membership ranges",
      cta: "REQUEST TIER BREAKDOWN",
      href: MEMBERSHIP_TALLY_URL,
      full: false,
      bgImage: "/images/donate/page/assets/bg-institution.webp",
      bgWidth: 306,
    },
    {
      title: "Event Sponsor",
      description:
        "For members who want to be more involved in the governance of our initiative, we offer the opportunity to participate in the decisions and voting on our plans and other topics.",
      benefits: [],
      price: "€1K – €40K / Event",
      priceNote: "Sponsorship ranges",
      cta: "BECOME A SPONSOR",
      href: MEMBERSHIP_TALLY_URL,
      full: true,
    },
  ];

  return (
    <section className="donate-section donate-section--last">
      <div className="content-shell content-shell--with-padding">
        <h2 className="donate-section-title">Membership</h2>
        <p className="donate-section-subtitle">
          Support our future activities and help sustain our work.
        </p>
        <div className="donate-membership-grid">
          {TIERS.map((tier) => (
            <div
              key={tier.title}
              className={`donate-membership-card${tier.full ? " donate-membership-card--full" : ""}`}
            >
              {tier.bgImage && (
                <img
                  src={tier.bgImage}
                  alt=""
                  className="donate-membership-card-bg"
                  style={tier.bgWidth ? { width: tier.bgWidth } : undefined}
                  aria-hidden
                />
              )}
              <div className="donate-membership-card-content">
                <h3>{tier.title}</h3>
                <p>{tier.description}</p>
                {tier.benefits.length > 0 && (
                  <>
                    <div className="donate-membership-benefits-label">
                      BENEFITS
                    </div>
                    <ul>
                      {tier.benefits.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </>
                )}
                <div className="donate-membership-price-note">{tier.priceNote}</div>
                <div className="donate-membership-price">{tier.price}</div>
                <a
                  href={tier.href}
                  className="primary-btn"
                  {...(tier.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                >
                  {tier.cta === "REQUEST TIER BREAKDOWN" && narrow400 ? "REQUEST TIERS" : tier.cta}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Page Root ── */

export default function OrgDonateContent({ content }: { content: Content }) {
  const donation = (content.donation ?? {}) as {
    title?: string;
    text?: string;
    ctaText?: string;
    ctaLink?: string;
    heroBackgroundImage?: string;
  };

  return (
    <div className="donate-page">
      <main>
        <div className="page-content-wrap page-content-wrap--with-padding">
          <DonateHeroSection donation={donation} />
          <GetInvolvedSection />
          <CryptoDonationSection />
          <MembershipSection />
        </div>
      </main>
    </div>
  );
}
