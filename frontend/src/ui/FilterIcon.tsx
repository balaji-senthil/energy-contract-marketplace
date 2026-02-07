interface FilterIconProps {
  className?: string;
}

const FilterIcon = ({ className }: FilterIconProps) => (
  <svg
    className={className}
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M3 4h14l-5.5 6v5.1c0 .2-.1.4-.3.5l-2.8 1.8c-.4.2-.9 0-.9-.5V10L3 4z" />
  </svg>
);

export default FilterIcon;
