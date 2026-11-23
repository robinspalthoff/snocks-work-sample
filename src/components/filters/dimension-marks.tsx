import type { Brand, Channel, Market } from "@/config/assumptions";
import { C } from "@/components/charts/chart-kit";

/**
 * Kleine Erkennungsmarken für die Filter.
 *
 * Die Kanal-Marken sind bewusst vereinfachte, selbst gezeichnete Formen in
 * der jeweiligen Plattformfarbe – keine Kopien der Originallogos. Sie
 * sollen den Kanal auf 16 Pixeln erkennbar machen, nicht die Marke
 * repräsentieren.
 */
export function ChannelMark({ channel, className }: { channel: Channel; className?: string }) {
  const common = { width: 16, height: 16, viewBox: "0 0 16 16", "aria-hidden": true as const };

  if (channel === "Amazon") {
    return (
      <svg {...common} className={className}>
        <rect width="16" height="16" rx="4" fill="#232F3E" />
        <path
          d="M3.6 10.3c1.9 1.3 4.3 1.7 6.4 1.1.5-.2.9-.4 1.3-.6.2-.1.4.1.2.3-.2.2-.5.4-.8.6-1.1.7-2.5.9-3.8.7-1.3-.2-2.5-.8-3.4-1.7-.1-.1 0-.3.1-.4z"
          fill="#FF9900"
        />
        <path
          d="M11.4 9.9c-.2-.2-1.1-.1-1.5-.1-.1 0-.2-.1-.1-.2.7-.5 1.9-.4 2.1-.2.2.2-.1 1.3-.7 1.9-.1.1-.2 0-.2-.1.2-.4.5-1.2.4-1.3z"
          fill="#FF9900"
        />
        <path
          d="M8.9 5.6v-.5c0-.1.1-.2.2-.2h2.2c.1 0 .2.1.2.2v.4c0 .1-.1.2-.2.4l-1.1 1.6c.4 0 .9.1 1.2.3.1 0 .1.1.1.2v.5c0 .1-.1.2-.2.1-.6-.3-1.4-.3-2 0-.1.1-.2 0-.2-.1v-.5c0-.1 0-.2.1-.4l1.3-1.8h-1.1c-.1 0-.2-.1-.2-.2zM5.2 8.7h-.7c-.1 0-.1-.1-.1-.1V5.1c0-.1.1-.1.1-.1h.6c.1 0 .1.1.1.1v.5c.2-.4.5-.7 1-.7.5 0 .8.3 1 .7.2-.4.6-.7 1.1-.7.3 0 .7.1.9.5.2.3.2.8.2 1.2v2c0 .1-.1.1-.1.1h-.7c-.1 0-.1-.1-.1-.1v-1.7c0-.2 0-.6-.1-.8-.1-.2-.2-.2-.4-.2s-.3.1-.5.3c-.1.2-.1.5-.1.7v1.7c0 .1-.1.1-.1.1h-.7c-.1 0-.1-.1-.1-.1v-1.7c0-.4 0-1-.5-1s-.5.6-.5 1v1.7c0 .1 0 .1-.1.1z"
          fill="#fff"
        />
      </svg>
    );
  }

  if (channel === "Zalando") {
    return (
      <svg {...common} className={className}>
        <rect width="16" height="16" rx="4" fill="#FF6900" />
        <path d="M4.6 4.4h6.8v1.3L7 10.3h4.5v1.3H4.4v-1.3L8.8 5.7H4.6z" fill="#fff" />
      </svg>
    );
  }

  // Onlineshop (Shopify)
  return (
    <svg {...common} className={className}>
      <rect width="16" height="16" rx="4" fill="#95BF47" />
      <path
        d="M8 3.2c.9 0 1.6.8 1.8 2h-.9c-.1-.8-.5-1.3-.9-1.3s-.8.5-.9 1.3h-.9c.2-1.2.9-2 1.8-2z"
        fill="#fff"
        opacity=".9"
      />
      <path d="M4.9 5.5h6.2l.6 6.1a.5.5 0 0 1-.5.6H4.8a.5.5 0 0 1-.5-.6z" fill="#fff" />
      <path
        d="M8.4 7.6c-.7-.2-1 .1-1 .4 0 .3.3.4.7.6.6.3 1 .6 1 1.2 0 .8-.6 1.2-1.4 1.2-.5 0-1-.2-1.2-.3l.2-.8c.2.1.6.3 1 .3.3 0 .5-.1.5-.4 0-.2-.2-.4-.6-.6-.6-.3-1-.6-1-1.2 0-.7.6-1.2 1.5-1.2.4 0 .7.1.9.2z"
        fill="#95BF47"
      />
    </svg>
  );
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
