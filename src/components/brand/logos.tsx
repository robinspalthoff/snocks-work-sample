/**
 * Marken-Logos.
 *
 * Shopify, Zalando und GitHub stammen als Pfad aus dem Projekt
 * „Simple Icons" (CC0, gemeinfrei) und sind damit die offiziellen
 * Glyphen. Amazon und LinkedIn hat Simple Icons auf Wunsch der
 * Rechteinhaber entfernt; beide sind hier als eigene, bewusst
 * schlichte Umsetzung des Bildzeichens angelegt. Zalando ist als
 * Letterform statt als Simple-Icons-Silhouette umgesetzt, weil die
 * Silhouette ohne das Z auf 18 Pixeln wie ein Play-Symbol wirkt.
 *
 * Die Logos dienen allein der Kennzeichnung des jeweiligen Kanals
 * bzw. Profils. Alle Marken gehören ihren Inhabern.
 */

const SHOPIFY_PATH =
  "M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z";

const GITHUB_PATH =
  "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12";

/** „in"-Bildzeichen, eigene Umsetzung in gleicher Geometrie. */
const LINKEDIN_PATH =
  "M6.94 7.98v13.2H2.56V7.98h4.38zM4.75 1.2c1.4 0 2.54 1.14 2.54 2.54S6.15 6.29 4.75 6.29 2.2 5.15 2.2 3.74 3.34 1.2 4.75 1.2zM9.6 7.98h4.2v1.8h.06c.58-1.1 2.02-2.26 4.16-2.26 4.45 0 5.27 2.93 5.27 6.73v6.93h-4.38v-6.14c0-1.47-.03-3.35-2.04-3.14-2.04 0-2.35 1.6-2.35 3.24v6.14H9.6V7.98z";

interface MarkProps {
  className?: string;
  /** Monochrom in der aktuellen Textfarbe statt in Markenfarbe. */
  mono?: boolean;
}

/** Gekacheltes Logo – für die Kanalauswahl. */
function Tile({
  bg,
  children,
  className,
  label,
}: {
  bg: string;
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={label}
      className={className ?? "size-[18px] shrink-0"}
    >
      <rect width="24" height="24" rx="5.5" fill={bg} />
      {children}
    </svg>
  );
}

export function ShopifyLogo({ className }: MarkProps) {
  return (
    <Tile bg="#95BF47" className={className} label="Shopify">
      <g transform="translate(4.2 4.2) scale(0.65)">
        <path d={SHOPIFY_PATH} fill="#ffffff" />
      </g>
    </Tile>
  );
}

export function ZalandoLogo({ className }: MarkProps) {
  return (
    <Tile bg="#FF6900" className={className} label="Zalando">
      <path d="M6.6 6.1h11.3v2.2l-7.5 7.6h7.5v2.1H6.3v-2.2l7.5-7.5H6.6z" fill="#ffffff" />
    </Tile>
  );
}

/**
 * Amazon: dunkle Kachel mit dem orangen Bogen. Bewusst nur das
 * Bildzeichen – der Schriftzug wäre auf 18 Pixeln nicht lesbar.
 */
export function AmazonLogo({ className }: MarkProps) {
  return (
    <Tile bg="#232F3E" className={className} label="Amazon">
      <path
        d="M5.4 12.6c2.3 2.4 5.3 3.7 8.4 3.7 1.9 0 3.8-.5 5.5-1.4"
        fill="none"
        stroke="#FF9900"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M17.3 11.9l3.5 1.5-2.2 2.9z" fill="#FF9900" />
    </Tile>
  );
}

export function GithubLogo({ className, mono = true }: MarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label="GitHub"
      className={className ?? "size-4 shrink-0"}
      fill={mono ? "currentColor" : "#181717"}
    >
      <path d={GITHUB_PATH} />
    </svg>
  );
}

export function LinkedinLogo({ className, mono = true }: MarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label="LinkedIn"
      className={className ?? "size-4 shrink-0"}
      fill={mono ? "currentColor" : "#0A66C2"}
    >
      <path d={LINKEDIN_PATH} />
    </svg>
  );
}
