/**
 * Donation flows: Ethereum (browser wallet on mainnet) and bitcoin/monero/zcash payment URIs.
 * Fiat→coin rates from CoinGecko (cached ~60s). Base fiat currency: EUR.
 */

import type { DonationAssetId } from "@/lib/org/donation-config";

const COINGECKO_MULTI =
  "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,monero,zcash&vs_currencies=eur";

/** Spot prices in EUR per 1 native unit (1 ETH, 1 BTC, 1 XMR, 1 ZEC). */
export type CryptoEurPrices = {
  ethereum: number;
  bitcoin: number;
  monero: number;
  zcash: number;
};

let cachedPrices: CryptoEurPrices | null = null;
let cachedAt = 0;
const CACHE_MS = 60_000;

export async function fetchCryptoEurPrices(): Promise<CryptoEurPrices> {
  if (cachedPrices != null && Date.now() - cachedAt < CACHE_MS) return cachedPrices;
  const res = await fetch(COINGECKO_MULTI);
  if (!res.ok) return cachedPrices ?? { ethereum: 0, bitcoin: 0, monero: 0, zcash: 0 };
  const data = (await res.json()) as Record<string, { eur?: number } | undefined>;
  const next: CryptoEurPrices = {
    ethereum: data?.ethereum?.eur ?? 0,
    bitcoin: data?.bitcoin?.eur ?? 0,
    monero: data?.monero?.eur ?? 0,
    zcash: data?.zcash?.eur ?? 0,
  };
  cachedPrices = next;
  cachedAt = Date.now();
  return next;
}

/** ETH spot price in EUR per 1 ETH (same cache as fetchCryptoEurPrices). */
export async function fetchEthEurPrice(): Promise<number> {
  return (await fetchCryptoEurPrices()).ethereum;
}

/** Convert EUR → wei using integer math to avoid float drift on small amounts. */
function eurToWeiHex(amountEur: number, ethEurPrice: number): string {
  if (
    ethEurPrice <= 0 ||
    amountEur <= 0 ||
    !Number.isFinite(amountEur) ||
    !Number.isFinite(ethEurPrice)
  ) {
    return "0x0";
  }
  const scale = 100_000_000;
  const u = BigInt(Math.round(amountEur * scale));
  const p = BigInt(Math.max(1, Math.round(ethEurPrice * scale)));
  const weiPerEth = BigInt("1000000000000000000");
  const wei = (u * weiPerEth) / p;
  return "0x" + wei.toString(16);
}

/**
 * Non-negative decimal string (e.g. "1", "10", "0.25") → wei hex for `value` in `eth_sendTransaction`.
 */
export function ethDecimalToWeiHex(decimal: string): string {
  const t = decimal.trim();
  if (!/^\d+(\.\d+)?$/.test(t)) return "0x0";
  const [intPart, frac = ""] = t.split(".");
  const fracPadded = (frac + "0".repeat(18)).slice(0, 18);
  const weiPerEth = BigInt("1000000000000000000");
  const wei = BigInt(intPart || "0") * weiPerEth + BigInt(fracPadded || "0");
  if (wei <= BigInt(0)) return "0x0";
  return "0x" + wei.toString(16);
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      providers?: unknown[];
    };
  }
}

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

function isRequestProvider(x: unknown): x is Eip1193Provider {
  return (
    typeof x === "object" &&
    x !== null &&
    typeof (x as Eip1193Provider).request === "function"
  );
}

/** Prefer a real EIP-1193 provider when multiple wallets inject `window.ethereum`. */
function getEthereumProvider(): Eip1193Provider | null {
  if (typeof window === "undefined") return null;
  const eth = window.ethereum as unknown;
  if (!eth || typeof eth !== "object") return null;
  if (isRequestProvider(eth)) return eth;
  const list = (eth as { providers?: unknown[] }).providers;
  if (Array.isArray(list)) {
    for (const p of list) {
      if (isRequestProvider(p)) return p;
    }
  }
  return null;
}

function parseChainIdHex(raw: unknown): number {
  if (typeof raw !== "string" || !raw.startsWith("0x")) return NaN;
  const n = Number.parseInt(raw, 16);
  return Number.isFinite(n) ? n : NaN;
}

/** Lowercase 0x + 40 hex — avoids wallet internals choking on missing/invalid `to`. */
function normalizeEthRecipient(addr: string): string | null {
  const t = typeof addr === "string" ? addr.trim() : "";
  if (!/^0x[a-fA-F0-9]{40}$/.test(t)) return null;
  return t.toLowerCase();
}

const ETH_MAINNET_CHAIN_ID = 1;

type EthSendResult = { success: true; txHash: string } | { success: false; error: string };

async function sendEthWithValueHex(toAddress: string, valueHex: string): Promise<EthSendResult> {
  const provider = getEthereumProvider();
  if (!provider) {
    return { success: false, error: "No wallet found. Install MetaMask or Rabby." };
  }
  const recipient = normalizeEthRecipient(toAddress);
  if (!recipient) {
    return { success: false, error: "Invalid donation address configuration." };
  }
  if (valueHex === "0x0") {
    return {
      success: false,
      error: "Donation amount is zero. Try a larger amount.",
    };
  }
  try {
    const accountsRaw = await provider.request({ method: "eth_requestAccounts" });
    const accounts = Array.isArray(accountsRaw) ? accountsRaw : [];
    const from =
      typeof accounts[0] === "string" && /^0x[a-fA-F0-9]{40}$/.test(accounts[0].trim())
        ? accounts[0].trim()
        : null;
    if (!from) {
      return {
        success: false,
        error:
          "No Ethereum account connected. Unlock your wallet, approve the connection, then try again.",
      };
    }

    const currentChain = await provider.request({ method: "eth_chainId" });
    const currentChainId = parseChainIdHex(currentChain);
    if (!Number.isFinite(currentChainId)) {
      return { success: false, error: "Could not read the active network from your wallet." };
    }
    if (currentChainId !== ETH_MAINNET_CHAIN_ID) {
      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x1" }],
        });
      } catch {
        return {
          success: false,
          error: "Please switch your wallet to Ethereum mainnet and try again.",
        };
      }
      const afterSwitch = await provider.request({ method: "eth_chainId" });
      const afterId = parseChainIdHex(afterSwitch);
      if (!Number.isFinite(afterId) || afterId !== ETH_MAINNET_CHAIN_ID) {
        return {
          success: false,
          error: "Wallet is not on Ethereum mainnet. Switch network and try again.",
        };
      }
    }
    const txHash = await provider.request({
      method: "eth_sendTransaction",
      params: [
        {
          from,
          to: recipient,
          value: valueHex,
          gasLimit: "0x5208",
        },
      ],
    });
    const hash = typeof txHash === "string" ? txHash : String(txHash ?? "");
    if (!hash) return { success: false, error: "Transaction failed. No hash returned." };
    return { success: true, txHash: hash };
  } catch (err) {
    const msg = (err as Error)?.message ?? String(err);
    if (msg.includes("User denied") || msg.includes("user rejected")) {
      return { success: false, error: "Transaction rejected." };
    }
    if (msg.includes("toLowerCase")) {
      return {
        success: false,
        error:
          "Your wallet could not build the transaction. Connect an account, use Ethereum mainnet, and try again.",
      };
    }
    return { success: false, error: msg || "Transaction failed." };
  }
}

/**
 * Request accounts, ensure Ethereum mainnet, send native ETH donation in wei from EUR spot price.
 */
export async function sendEthDonation(
  amountEur: number,
  toAddress: string,
): Promise<EthSendResult> {
  const { ethereum: ethEur } = await fetchCryptoEurPrices();
  if (ethEur <= 0) {
    return { success: false, error: "Could not fetch ETH price. Try again later." };
  }
  const valueHex = eurToWeiHex(amountEur, ethEur);
  if (valueHex === "0x0") {
    return {
      success: false,
      error: "Donation amount rounds to zero at the current ETH price. Try a larger amount.",
    };
  }
  return sendEthWithValueHex(toAddress, valueHex);
}

/** Send a fixed amount of ETH (major units, e.g. "1" or "0.5") — no fiat conversion. */
export async function sendEthDonationFixedMajor(
  ethMajorDecimal: string,
  toAddress: string,
): Promise<EthSendResult> {
  const valueHex = ethDecimalToWeiHex(ethMajorDecimal);
  if (valueHex === "0x0") {
    return { success: false, error: "Invalid ETH amount." };
  }
  return sendEthWithValueHex(toAddress, valueHex);
}

/** BIP21 / common URI schemes to hand off to the user’s wallet app. */
export function buildPaymentUri(
  assetId: DonationAssetId,
  address: string,
  amountEur: number | undefined,
  prices: CryptoEurPrices,
): string {
  switch (assetId) {
    case "bitcoin": {
      let uri = `bitcoin:${address}`;
      if (amountEur != null && prices.bitcoin > 0) {
        const btc = (amountEur / prices.bitcoin).toFixed(8);
        uri += `?amount=${btc}`;
      }
      return uri;
    }
    case "monero": {
      let uri = `monero:${address}`;
      if (amountEur != null && prices.monero > 0) {
        const xmr = (amountEur / prices.monero).toFixed(12);
        uri += `?tx_amount=${xmr}`;
      }
      return uri;
    }
    case "zcash": {
      let uri = `zcash:${address}`;
      if (amountEur != null && prices.zcash > 0) {
        const zec = (amountEur / prices.zcash).toFixed(8);
        uri += `?amount=${zec}`;
      }
      return uri;
    }
    default:
      return "";
  }
}

/** Payment URI with an explicit amount in the asset’s major unit (BTC, XMR, ZEC). */
export function buildPaymentUriFixedMajor(
  assetId: DonationAssetId,
  address: string,
  majorAmount: string,
): string {
  const amt = majorAmount.trim();
  if (!amt) return "";
  switch (assetId) {
    case "bitcoin":
      return `bitcoin:${address}?amount=${amt}`;
    case "monero":
      return `monero:${address}?tx_amount=${amt}`;
    case "zcash":
      return `zcash:${address}?amount=${amt}`;
    default:
      return "";
  }
}

export function openWalletDeepLink(uri: string): { success: true } | { success: false; error: string } {
  if (!uri || typeof window === "undefined") {
    return { success: false, error: "Invalid payment link." };
  }
  try {
    const a = document.createElement("a");
    a.href = uri;
    a.rel = "noopener noreferrer";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error)?.message ?? "Could not open wallet link." };
  }
}

/**
 * Same-tab navigation to a payment URI. Use when opening must happen after an `await`
 * (browser may no longer treat the action as a user gesture, so a synthetic anchor click can be ignored).
 */
export function navigateToPaymentUri(uri: string): void {
  if (typeof window !== "undefined" && uri) {
    window.location.assign(uri);
  }
}
