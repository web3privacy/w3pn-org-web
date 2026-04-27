export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterSocialItem {
  label: string;
  icon: string;
  href: string;
}

export interface GlobalFooterConfig {
  contribute?: {
    eyeImage?: string;
    roundLogoImage?: string | null;
    title?: string;
    text?: string;
    ctaText?: string;
    ctaLink?: string;
    communityAvatars?: (string | { image?: string })[];
  };
  donation?: {
    title?: string;
    text?: string;
    ctaText?: string;
    ctaLink?: string;
    backgroundImage?: string;
  };
  newsletter?: {
    text?: string;
    placeholder?: string;
    buttonText?: string;
    actionUrl?: string;
  };
  members?: {
    title?: string;
    logos?: Array<{
      name: string;
      handle?: string;
      /** Link shown under the name (e.g. official X profile). */
      handleHref?: string;
      /** Official website — logo and name link here when set. */
      href?: string;
      image: string;
    }>;
    ctaText?: string;
    ctaLink?: string;
  };
  footer?: {
    logo?: string;
    linksColumns?: FooterLink[][];
    linksColumn1?: FooterLink[];
    linksColumn2?: FooterLink[];
    linksColumn3?: FooterLink[];
    siteMap?: {
      org?: FooterLink[];
      portal?: FooterLink[];
      legal?: FooterLink[];
    };
    columns?: string[][];
    socialLabel?: string;
    social?: FooterSocialItem[] | string[];
    legal?: string;
  };
}

export interface GlobalFooterProps {
  config: GlobalFooterConfig;
  /** Pre-fetched community avatars (e.g. from GitHub). If not provided, contribute.communityAvatars or empty grid. */
  communityMembers?: Array<{ login: string; avatarUrl: string; profileUrl: string }>;
  /** Callback when newsletter form is submitted. If not provided, form still renders but submit may no-op. */
  onNewsletterSubmit?: (email: string) => void | Promise<void>;
  /** Newsletter state: idle | loading | success | error */
  newsletterState?: "idle" | "loading" | "success" | "error";
  newsletterMessage?: string;
  /** "portal" = bold SUBSCRIBE, hover black; "org" = hover red, white text, no underline */
  variant?: "portal" | "org";
}
