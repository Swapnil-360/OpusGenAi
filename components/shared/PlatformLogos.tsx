import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export function AmazonLogo({ className = "", size = 18 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Amazon"
    >
      <path
        d="M13.7 15.5c-3.1 2.3-7.6 3.5-11.5 1.4-.5-.3-1-.8-.4-1.3.5-.5 1.1-.3 1.6-.1 3.4 1.7 7.2.7 10-1.1.4-.3.9-.1 1.1.3.2.4.1.7-.8.8z"
        fill="#FF9900"
      />
      <path
        d="M14.9 14.3c-.4-.5-2.5-.2-3.8.3-.3.1-.3-.2-.1-.4 1.1-1 3.2-.8 3.6-.3.4.5-.1 2.5-1.2 3.5-.2.2-.4.1-.3-.2.3-.9 1.8-2.9 1.8-2.9z"
        fill="#FF9900"
      />
      <path
        d="M14 6.8c-.2-1.3-1.4-2.1-3.2-2.1-2.2 0-3.6 1.2-3.8 2.8-.1.5.3.7.6.7.3 0 .5-.2.6-.5.4-1.2 1.4-1.7 2.6-1.7 1.3 0 2.2.6 2.3 1.6v.7c-3.5.2-5.4 1.3-5.4 3.2 0 1.6 1.2 2.7 2.9 2.7 1.7 0 2.6-.9 2.9-1.5h.1v1.1c0 .4.3.6.7.6.4 0 .7-.2.7-.6V8.6c0-1-.4-1.8-1.4-1.8zm-.8 4.2c0 1.2-.9 2.1-2.3 2.1-1 0-1.7-.6-1.7-1.5 0-1.1 1-1.6 2.8-1.7v1.1z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ShopifyLogo({ className = "", size = 18 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Shopify"
    >
      <path
        d="M19.7 7.2l-3.3-1c-.1 0-.2 0-.2.1L15 8.7s-1-.3-1.6-.3c-1.5 0-2.4.9-2.4 2.1 0 1.9 2.5 2.1 2.6 3.6 0 .8-.5 1.3-1.4 1.3-.9 0-1.4-.5-1.7-1.1-.1-.2-.3-.2-.4-.1l-1.3 1c-.1.1-.1.3 0 .4.7 1.2 1.8 1.8 3.3 1.8 2 0 3.5-1.1 3.5-2.7 0-2.1-2.6-2.3-2.6-3.7 0-.5.4-.9 1.1-.9.5 0 .9.1 1.3.3l-1.4 4.5c-.1.2 0 .4.2.5l5.2 1.6c.2.1.4-.1.4-.3l2.8-12.8c.1-.2 0-.4-.2-.5z"
        fill="#95BF47"
      />
      <path
        d="M16.2 6.2l-1.2-3.7c0-.2-.2-.3-.4-.3l-3.3 1c-.1 0-.2.2-.2.3L12 6.2c-1-.2-1.9 0-2.4.3L8.3 4.2c-.1-.1-.3 0-.4.1L5.6 7.6c-.1.1-.1.3 0 .4l2.1 1.7L4.3 20c-.1.2 0 .4.2.5l10.9 3.4c.1 0 .2 0 .3-.1l8-5.3c.1-.1.2-.3.1-.4L16.2 6.2z"
        fill="#5E8E3E"
      />
      <path
        d="M12.4 13.9c-.1-1.5-2.6-1.7-2.6-3.6 0-1.2.9-2.1 2.4-2.1.6 0 1.6.3 1.6.3l1.2-2.4c0-.1.1-.1.2-.1l3.3 1c.2.1.3.3.2.5L16 18c0 .2-.2.3-.4.3l-5.2-1.6c-.2-.1-.3-.3-.2-.5l1.4-4.5c-.4-.2-.8-.3-1.3-.3-.7 0-1.1.4-1.1.9 0 1.4 2.6 1.6 2.6 3.7 0 1.6-1.5 2.7-3.5 2.7-1.5 0-2.6-.6-3.3-1.8-.1-.1-.1-.3 0-.4l1.3-1c.1-.1.3-.1.4.1.3.6.8 1.1 1.7 1.1.9 0 1.4-.5 1.4-1.3z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function InstagramLogo({ className = "", size = 18 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Instagram"
    >
      <rect width="24" height="24" rx="6" fill="url(#ig-grad)" />
      <path
        d="M12 6.8c1.7 0 1.9 0 2.6.1.6.1 1 .2 1.3.4.4.2.7.4 1 .7.3.3.5.6.7 1 .2.3.3.7.4 1.3.1.7.1.9.1 2.6s0 1.9-.1 2.6c-.1.6-.2 1-.4 1.3-.2.4-.4.7-.7 1-.3.3-.6.5-1 .7-.3.2-.7.3-1.3.4-.7.1-.9.1-2.6.1s-1.9 0-2.6-.1c-.6-.1-1-.2-1.3-.4-.4-.2-.7-.4-1-.7-.3-.3-.5-.6-.7-1-.2-.3-.3-.7-.4-1.3-.1-.7-.1-.9-.1-2.6s0-1.9.1-2.6c.1-.6.2-1 .4-1.3.2-.4.4-.7.7-1 .3-.3.6-.5 1-.7.3-.2.7-.3 1.3-.4.7-.1.9-.1 2.6-.1zm0-1.6c-1.7 0-2 .1-2.7.1-.7.1-1.2.2-1.7.4-.5.2-.9.5-1.3.9-.4.4-.7.8-.9 1.3-.2.5-.3 1-.4 1.7-.1.7-.1 1-.1 2.7s.1 2 .1 2.7c.1.7.2 1.2.4 1.7.2.5.5.9.9 1.3.4.4.8.7 1.3.9.5.2 1 .3 1.7.4.7.1 1 .1 2.7.1s2-.1 2.7-.1c.7-.1 1.2-.2 1.7-.4.5-.2.9-.5 1.3-.9.4-.4.7-.8.9-1.3.2-.5.3-1 .4-1.7.1-.7.1-1 .1-2.7s-.1-2-.1-2.7c-.1-.7-.2-1.2-.4-1.7-.2-.5-.5-.9-.9-1.3-.4-.4-.8-.7-1.3-.9-.5-.2-1-.3-1.7-.4-.7-.1-1-.1-2.7-.1z"
        fill="#FFFFFF"
      />
      <circle cx="12" cy="12" r="2.8" fill="#FFFFFF" />
      <circle cx="16.5" cy="7.5" r="0.9" fill="#FFFFFF" />
      <defs>
        <radialGradient
          id="ig-grad"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="matrix(24 24 -24 24 3 22)"
        >
          <stop stopColor="#FED373" />
          <stop offset="0.25" stopColor="#F15245" />
          <stop offset="0.5" stopColor="#D92E7F" />
          <stop offset="0.75" stopColor="#9B36B7" />
          <stop offset="1" stopColor="#515ECF" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function FacebookLogo({ className = "", size = 18 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Facebook"
    >
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        d="M15.5 12h-2.3v8h-3.3v-8H8V9.2h1.9V7.4c0-2.3 1.4-3.4 3.3-3.4 1 0 1.8.1 2 .1v2.3h-1.4c-1.1 0-1.4.5-1.4 1.3v1.5h2.6l-.5 2.8z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function EbayLogo({ className = "", size = 18 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="eBay"
    >
      <rect width="24" height="24" rx="5" fill="#1E1E24" />
      <text
        x="3"
        y="16.5"
        fontSize="12.5"
        fontWeight="900"
        letterSpacing="-1"
        fontFamily="sans-serif"
      >
        <tspan fill="#E53238">e</tspan>
        <tspan fill="#0064D2">b</tspan>
        <tspan fill="#F5AF02">a</tspan>
        <tspan fill="#86B817">y</tspan>
      </text>
    </svg>
  );
}

export function EtsyLogo({ className = "", size = 18 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Etsy"
    >
      <rect width="24" height="24" rx="5" fill="#F16521" />
      <text
        x="3.5"
        y="17"
        fontSize="13"
        fontWeight="bold"
        fontFamily="serif"
        fill="#FFFFFF"
        letterSpacing="-0.5"
      >
        Etsy
      </text>
    </svg>
  );
}

export function WalmartLogo({ className = "", size = 18 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Walmart"
    >
      <circle cx="12" cy="12" r="12" fill="#0071DC" />
      {/* 6 rays of Walmart spark in yellow */}
      <g stroke="#FFC220" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="4" x2="12" y2="7.5" />
        <line x1="12" y1="16.5" x2="12" y2="20" />
        <line x1="5.1" y1="8" x2="8.1" y2="9.7" />
        <line x1="15.9" y1="14.3" x2="18.9" y2="16" />
        <line x1="5.1" y1="16" x2="8.1" y2="14.3" />
        <line x1="15.9" y1="9.7" x2="18.9" y2="8" />
      </g>
    </svg>
  );
}

export function PinterestLogo({ className = "", size = 18 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Pinterest"
    >
      <circle cx="12" cy="12" r="12" fill="#BD081C" />
      <path
        d="M12.3 5C8.3 5 6 7.8 6 10.7c0 1.5.8 3.3 2.1 3.9.2.1.4 0 .5-.2.1-.2.2-.8.3-1 0-.1 0-.2-.1-.3-.4-.5-.7-1.4-.7-2.3 0-2.3 1.8-4.4 4.8-4.4 2.6 0 4 1.6 4 3.7 0 2.8-1.2 5.1-3 5.1-1 0-1.7-.8-1.5-1.8.3-1.2.8-2.5.8-3.3 0-.8-.4-1.4-1.3-1.4-.9 0-1.8.9-1.8 2.2 0 .8.3 1.3.3 1.3s-1 4.3-1.2 5.1c-.4 1.5-.1 3.5 0 3.7 0 .1.2.2.3.1.1-.1 1.7-2.3 2.1-3.7.1-.4.6-2.4.6-2.4.3.6 1.3 1.1 2.3 1.1 3 0 5-2.8 5-6.5C18.6 7.6 15.6 5 12.3 5z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function TikTokLogo({ className = "", size = 18 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="TikTok"
    >
      <circle cx="12" cy="12" r="12" fill="#010101" />
      <path
        d="M16.6 8.3c-.9-.4-1.6-1.1-2-2.1-.1-.3-.2-.6-.2-.9h-2.3v10.5c0 1.3-1 2.4-2.4 2.4-1.3 0-2.4-1-2.4-2.4 0-1.3 1.1-2.4 2.4-2.4.3 0 .5 0 .8.1v-2.4c-.3 0-.5-.1-.8-.1-2.6 0-4.7 2.1-4.7 4.8 0 2.6 2.1 4.8 4.7 4.8 2.6 0 4.7-2.1 4.7-4.8V10.7c1.1.8 2.4 1.3 3.8 1.3v-2.3c-.6 0-1.3-.5-1.9-1.4z"
        fill="#25F4EE"
      />
      <path
        d="M16.3 8c-.9-.4-1.6-1.1-2-2.1-.1-.3-.2-.6-.2-.9h-2v10.5c0 1.3-1 2.4-2.4 2.4-1.3 0-2.4-1-2.4-2.4 0-1.3 1.1-2.4 2.4-2.4.3 0 .5 0 .8.1v-2.4c-.3 0-.5-.1-.8-.1-2.6 0-4.7 2.1-4.7 4.8 0 2.6 2.1 4.8 4.7 4.8 2.6 0 4.7-2.1 4.7-4.8V10.4c1.1.8 2.4 1.3 3.8 1.3V9.4c-.6 0-1.3-.5-1.9-1.4z"
        fill="#FE2C55"
        style={{ mixBlendMode: "screen" }}
      />
    </svg>
  );
}

export function ShopeeLogo({ className = "", size = 18 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Shopee"
    >
      <circle cx="12" cy="12" r="12" fill="#EE4D2D" />
      <path
        d="M16 8.5c0-2.2-1.8-3.5-4-3.5s-4 1.3-4 3.5h1.5c0-1.3 1.1-2.1 2.5-2.1s2.5.8 2.5 2.1H16z"
        fill="#FFFFFF"
      />
      <path
        d="M6.5 9.5l1 9.5c0 .6.5 1 1 1h7c.6 0 1-.4 1-1l1-9.5h-11zm5.5 8c-1.7 0-2.6-.9-2.6-1.7h1.3c0 .4.5.8 1.3.8.7 0 1.2-.4 1.2-.8 0-.5-.4-.7-1.4-.9-1.3-.3-2.1-.7-2.1-1.7 0-1 .9-1.7 2.2-1.7 1.4 0 2.3.7 2.4 1.6h-1.3c-.1-.4-.5-.7-1.1-.7-.6 0-1 .3-1 .7 0 .4.4.6 1.3.8 1.4.3 2.2.8 2.2 1.8 0 1.2-1 1.8-2.4 1.8z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export interface PlatformItem {
  id: string;
  name: string;
  icon: React.ComponentType<LogoProps>;
  color: string;
  category: "marketplace" | "social" | "web";
  popularRatio: string;
}

export const PLATFORM_LIST: PlatformItem[] = [
  {
    id: "amazon",
    name: "Amazon",
    icon: AmazonLogo,
    color: "#FF9900",
    category: "marketplace",
    popularRatio: "1:1",
  },
  {
    id: "shopify",
    name: "Shopify",
    icon: ShopifyLogo,
    color: "#95BF47",
    category: "marketplace",
    popularRatio: "1:1 / 16:9",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: InstagramLogo,
    color: "#E1306C",
    category: "social",
    popularRatio: "1:1 / 4:5 / 9:16",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: FacebookLogo,
    color: "#1877F2",
    category: "social",
    popularRatio: "1:1 / 16:9",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: TikTokLogo,
    color: "#25F4EE",
    category: "social",
    popularRatio: "9:16",
  },
  {
    id: "etsy",
    name: "Etsy",
    icon: EtsyLogo,
    color: "#F16521",
    category: "marketplace",
    popularRatio: "3:4 / 4:3",
  },
  {
    id: "ebay",
    name: "eBay",
    icon: EbayLogo,
    color: "#E53238",
    category: "marketplace",
    popularRatio: "1:1 / 4:3",
  },
  {
    id: "walmart",
    name: "Walmart",
    icon: WalmartLogo,
    color: "#FFC220",
    category: "marketplace",
    popularRatio: "1:1",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    icon: PinterestLogo,
    color: "#BD081C",
    category: "social",
    popularRatio: "2:3 / 3:4",
  },
  {
    id: "shopee",
    name: "Shopee",
    icon: ShopeeLogo,
    color: "#EE4D2D",
    category: "marketplace",
    popularRatio: "1:1",
  },
];
