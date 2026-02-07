interface SortIconProps {
  className?: string;
}

const SortIcon = ({ className }: SortIconProps) => (
  <svg
    className={className}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M7 4v12" />
    <path d="M4.5 6.5L7 4l2.5 2.5" />
    <path d="M13 16V4" />
    <path d="M10.5 13.5L13 16l2.5-2.5" />
  </svg>
);

export default SortIcon;
