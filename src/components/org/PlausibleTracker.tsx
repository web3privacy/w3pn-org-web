"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

type PlausibleTrackerProps = {
  scriptSrc?: string;
  endpoint?: string;
  legacyDomain?: string;
  captureOnLocalhost?: boolean;
};

function isAdminPath(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/about/admin" ||
    pathname.startsWith("/about/admin/") ||
    pathname === "/events/admin" ||
    pathname.startsWith("/events/admin/")
  );
}

export default function PlausibleTracker({
  scriptSrc,
  endpoint,
  legacyDomain,
  captureOnLocalhost = false,
}: PlausibleTrackerProps) {
  const pathname = usePathname() ?? "";

  if (!scriptSrc || isAdminPath(pathname)) {
    return null;
  }

  const initOptions: Record<string, unknown> = {};
  if (endpoint) initOptions.endpoint = endpoint;
  if (captureOnLocalhost) initOptions.captureOnLocalhost = true;

  const initScript = [
    "window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)};",
    "plausible.init=plausible.init||function(i){plausible.o=i||{}};",
    `plausible.init(${JSON.stringify(initOptions)});`,
  ].join("");

  return (
    <>
      <Script
        id="plausible-script"
        src={scriptSrc}
        strategy="afterInteractive"
        data-domain={legacyDomain || undefined}
      />
      <Script id="plausible-init" strategy="afterInteractive">
        {initScript}
      </Script>
    </>
  );
}
