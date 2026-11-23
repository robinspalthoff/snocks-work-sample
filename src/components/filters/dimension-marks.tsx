import type { Brand, Channel, Market } from "@/config/assumptions";
import { C } from "@/components/charts/chart-kit";
import { AmazonLogo, ShopifyLogo, ZalandoLogo } from "@/components/brand/logos";

/**
 * Kleine Erkennungsmarken für die Filter: Kanal-Logo, Länderflagge,
 * Markenfarbe. Die Logos liegen in components/brand/logos.tsx.
 */
export function ChannelMark({ channel, className }: { channel: Channel; className?: string }) {
  if (channel === "Amazon") return <AmazonLogo className={className} />;
  if (channel === "Zalando") return <ZalandoLogo className={className} />;
  return <ShopifyLogo className={className} />;
}

/** Vereinfachte Länderflaggen als Inline-SVG – überall gleich dargestellt. */
export function MarketFlag({ market, className }: { market: Market; className?: string }) {
  const common = { width: 18, height: 13, viewBox: "0 0 18 13", "aria-hidden": true as const };
  const frame = (
    <rect
      x="0.4"
      y="0.4"
      width="17.2"
      height="12.2"
      rx="1.6"
      fill="none"
      stroke="rgba(12,18,21,0.14)"
    />
  );

  const bands = (colors: string[]) => (
    <>
      <clipPath id={`clip-${market}`}>
        <rect width="18" height="13" rx="2" />
      </clipPath>
      <g clipPath={`url(#clip-${market})`}>
        {colors.map((c, i) => (
          <rect
            key={c + i}
            y={(13 / colors.length) * i}
            width="18"
            height={13 / colors.length}
            fill={c}
          />
        ))}
      </g>
    </>
  );

  if (market === "DE")
    return (
      <svg {...common} className={className}>
        {bands(["#000000", "#DD0000", "#FFCE00"])}
        {frame}
      </svg>
    );

  if (market === "AT")
    return (
      <svg {...common} className={className}>
        {bands(["#ED2939", "#FFFFFF", "#ED2939"])}
        {frame}
      </svg>
    );

  if (market === "NL")
    return (
      <svg {...common} className={className}>
        {bands(["#AE1C28", "#FFFFFF", "#21468B"])}
        {frame}
      </svg>
    );

  if (market === "CH")
    return (
      <svg {...common} className={className}>
        <rect width="18" height="13" rx="2" fill="#D52B1E" />
        <rect x="7.7" y="3" width="2.6" height="7" fill="#fff" />
        <rect x="5.5" y="5.2" width="7" height="2.6" fill="#fff" />
        {frame}
      </svg>
    );

  // FR – senkrechte Bahnen
  return (
    <svg {...common} className={className}>
      <clipPath id="clip-FR">
        <rect width="18" height="13" rx="2" />
      </clipPath>
      <g clipPath="url(#clip-FR)">
        <rect width="6" height="13" fill="#002654" />
        <rect x="6" width="6" height="13" fill="#FFFFFF" />
        <rect x="12" width="6" height="13" fill="#ED2939" />
      </g>
      {frame}
    </svg>
  );
}

/** Farbpunkt der Marke – dieselbe Palette wie in den Charts. */
export function BrandDot({ brand, className }: { brand: Brand; className?: string }) {
  return (
    <span
      aria-hidden
      className={className ?? "inline-block size-2.5 shrink-0 rounded-sm"}
      style={{ background: C.brands[brand] }}
    />
  );
}
