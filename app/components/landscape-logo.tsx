import type { SVGProps } from "react";

type LandscapeLogoProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

export default function LandscapeLogo({
  title,
  ...props
}: LandscapeLogoProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <rect width="40" height="40" rx="11" fill="#141414" />
      <path
        d="M9 27.5 15 21.5 20 25l8.5-9.5"
        fill="none"
        stroke="#f15bc8"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 31.5h21"
        fill="none"
        stroke="#7458ff"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="28.5" cy="15.5" r="3.25" fill="#fff" />
    </svg>
  );
}
