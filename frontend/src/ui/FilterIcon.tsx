interface FilterIconProps {
  className?: string;
}

const FilterIcon = ({ className }: FilterIconProps) => (
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
    <path d="M3 4h14l-5.5 6v4l-3 2v-6L3 4z" />
  </svg>
);

export default FilterIcon;
