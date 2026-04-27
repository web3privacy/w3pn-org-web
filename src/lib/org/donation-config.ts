/** Donation page: supported assets, receive addresses, and preset fiat amounts (EUR). */

export type DonationAssetId = "ethereum" | "bitcoin" | "monero" | "zcash";

export type DonationAsset = {
  id: DonationAssetId;
  name: string;
  address: string;
  color: string;
};

/** Receive addresses (single source of truth for UI + payment flows). */
export const DONATION_ASSETS: DonationAsset[] = [
  {
    id: "ethereum",
    name: "Ethereum",
    address: "0xB8Fbd9A43cc0CeB3d9ddd58b752979a77e6f0c1D",
    color: "#627eea",
  },
  {
    id: "bitcoin",
    name: "Bitcoin",
    address: "bc1qfacmh9rqhh3j3xayxzga9xrgas894zfe2v37rz",
    color: "#f7931a",
  },
  {
    id: "monero",
    name: "Monero",
    address:
      "45hzJHESi64PYf44PmewggSNcxjLqBYdtLQuFKQ8XS1r8PiJUciBjbNCbvuVmJTmTnCmMXUQ2SPo8ASpZ9Rfq6L7F8vpcUV",
    color: "#ff6600",
  },
  {
    id: "zcash",
    name: "Zcash",
    address: "zs1mzlsgmt05dz4yl8uk2nw66vjfqngkunedrf0vcqsh7d4azjuaw353gm4wvhzucvvuum9c3ecncy",
    color: "#ecb244",
  },
];

/** Preset fiat tiers (EUR) on the donate grid — excludes the fixed-crypto tier rendered separately. */
export const DONATION_EUR_PRESETS = [
  { eur: 15, description: "A small gesture of support." },
  { eur: 50, description: "Helps us keep things moving" },
  { eur: 100, description: "Supports our upcoming activities." },
  { eur: 500, description: "Helps fund a real part of our work." },
] as const;

/**
 * Fifth tile: fixed amount in the asset’s native unit (not fiat).
 * Display + payment URIs / ETH value use these major-unit strings.
 */
export const FIXED_CRYPTO_DONATION_MAJOR: Record<
  DonationAssetId,
  { major: string; headline: string }
> = {
  ethereum: { major: "1", headline: "1 ETH" },
  bitcoin: { major: "1", headline: "1 BTC" },
  monero: { major: "10", headline: "10 XMR" },
  zcash: { major: "10", headline: "10 ZEC" },
};

/** Rows under “FOR OTHER DONATION…” (same data as DONATION_ASSETS). */
export const DONATION_CRYPTO_ADDRESSES = DONATION_ASSETS.map(({ name, address, color, id }) => ({
  id,
  name,
  address,
  color,
}));
