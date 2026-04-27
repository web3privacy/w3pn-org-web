"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { SiBitcoin, SiEthereum, SiMonero, SiZcash } from "react-icons/si";
import { useCallback, useState, useSyncExternalStore } from "react";
import { DONATION_ASSETS, type DonationAsset, type DonationAssetId } from "@/lib/org/donation-config";

const MOBILE_MQ = "(max-width: 768px)";

function subscribeMobile(mq: MediaQueryList, onChange: () => void) {
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function useIsMobileDonateNetwork(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia(MOBILE_MQ);
      return subscribeMobile(mq, onStoreChange);
    },
    () => (typeof window !== "undefined" ? window.matchMedia(MOBILE_MQ).matches : false),
    () => false,
  );
}

function NetworkGlyph({
  asset,
  className,
}: {
  asset: DonationAsset;
  className?: string;
}) {
  const cls = className ?? "donate-network-picker-icon";
  const style = { color: asset.color };
  if (asset.id === "bitcoin") return <SiBitcoin className={cls} style={style} size={22} aria-hidden />;
  if (asset.id === "monero") return <SiMonero className={cls} style={style} size={22} aria-hidden />;
  if (asset.id === "zcash") return <SiZcash className={cls} style={style} size={22} aria-hidden />;
  return <SiEthereum className={cls} style={style} size={22} aria-hidden />;
}

function Chevron({ open }: { open?: boolean }) {
  return (
    <svg
      className={`donate-network-picker-chevron${open ? " donate-network-picker-chevron--open" : ""}`}
      width="12"
      height="8"
      viewBox="0 0 12 8"
      aria-hidden
    >
      <path
        d="M1 1.25L6 6.25L11 1.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Props = {
  value: DonationAssetId;
  onChange: (id: DonationAssetId) => void;
};

function NetworkOptionsList({
  value,
  onPick,
}: {
  value: DonationAssetId;
  onPick: (id: DonationAssetId) => void;
}) {
  return (
    <ul className="donate-network-option-list" role="list">
      {DONATION_ASSETS.map((asset) => {
        const selected = asset.id === value;
        return (
          <li key={asset.id}>
            <button
              type="button"
              className={`donate-network-option${selected ? " donate-network-option--selected" : ""}`}
              onClick={() => onPick(asset.id)}
            >
              <span className="donate-network-option-icon-wrap">
                <NetworkGlyph asset={asset} />
              </span>
              <span className="donate-network-option-label">{asset.name}</span>
              {selected ? (
                <span className="donate-network-option-check" aria-hidden>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3.5 8.5L6.5 11.5L12.5 4.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              ) : (
                <span className="donate-network-option-check-spacer" aria-hidden />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function DonateNetworkPickerMobile({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const selected = DONATION_ASSETS.find((a) => a.id === value) ?? DONATION_ASSETS[0]!;

  const handlePick = useCallback(
    (id: DonationAssetId) => {
      onChange(id);
      setOpen(false);
    },
    [onChange],
  );

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className="donate-network-picker-trigger">
          <span className="donate-network-picker-trigger-inner">
            <NetworkGlyph asset={selected} />
            <span className="donate-network-picker-trigger-label">{selected.name}</span>
          </span>
          <Chevron open={open} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="donate-network-sheet-overlay" />
        <Dialog.Content className="donate-network-sheet-content">
          <div className="donate-network-sheet-handle" aria-hidden />
          <Dialog.Title className="donate-network-sr-only">Select donation network</Dialog.Title>
          <Dialog.Description className="donate-network-sr-only">
            Choose Ethereum, Bitcoin, Monero, or Zcash for your donation.
          </Dialog.Description>
          <p className="donate-network-sheet-title">Network</p>
          <NetworkOptionsList value={value} onPick={handlePick} />
          <Dialog.Close asChild>
            <button type="button" className="donate-network-sheet-close">
              Done
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function DonateNetworkPicker({ value, onChange }: Props) {
  const isMobile = useIsMobileDonateNetwork();
  const selected = DONATION_ASSETS.find((a) => a.id === value) ?? DONATION_ASSETS[0]!;

  const handlePick = useCallback(
    (id: DonationAssetId) => {
      onChange(id);
    },
    [onChange],
  );

  if (isMobile) {
    return <DonateNetworkPickerMobile value={value} onChange={onChange} />;
  }

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button type="button" className="donate-network-picker-trigger">
          <span className="donate-network-picker-trigger-inner">
            <NetworkGlyph asset={selected} />
            <span className="donate-network-picker-trigger-label">{selected.name}</span>
          </span>
          <Chevron />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="donate-network-dropdown-content"
          sideOffset={8}
          align="end"
          collisionPadding={16}
        >
          {DONATION_ASSETS.map((asset) => (
            <DropdownMenu.Item
              key={asset.id}
              className={`donate-network-dropdown-item${asset.id === value ? " donate-network-dropdown-item--selected" : ""}`}
              onSelect={() => handlePick(asset.id)}
            >
              <span className="donate-network-option-icon-wrap">
                <NetworkGlyph asset={asset} />
              </span>
              <span className="donate-network-option-label">{asset.name}</span>
              {asset.id === value ? (
                <span className="donate-network-option-check" aria-hidden>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3.5 8.5L6.5 11.5L12.5 4.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              ) : (
                <span className="donate-network-option-check-spacer" aria-hidden />
              )}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
