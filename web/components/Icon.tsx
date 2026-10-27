import type { SVGProps } from "react";
export type IconName =
  | "shield"
  | "arrow"
  | "grid"
  | "bag"
  | "wallet"
  | "settings"
  | "plus"
  | "check"
  | "code"
  | "clock"
  | "logout";
const paths: Record<IconName, string> = {
  shield: "M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3ZM8 12l3 3 5-6",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  bag: "M5 7h14l2 14H3L5 7Zm3 0V6a4 4 0 0 1 8 0v1",
  wallet: "M20 8V5H4a2 2 0 0 0 0 4h17v11H4a2 2 0 0 1-2-2V7m19 6h-6v4h6",
  settings: "M4 7h16M4 17h16M8 4v6m8 4v6",
  plus: "M12 5v14M5 12h14",
  check: "m5 12 4 4L19 6",
  code: "m8 6-6 6 6 6m8-12 6 6-6 6m-3-14-2 16",
  clock: "M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  logout: "M9 4H4v16h5m5-13 5 5-5 5m-6-5h11",
};
export function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
