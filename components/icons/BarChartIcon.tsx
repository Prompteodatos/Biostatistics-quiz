
import React from 'react';

const BarChartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 3v18h18" />
    <path d="M7 16V8" stroke="#38bdf8" />
    <path d="M12 16V4" stroke="#818cf8" />
    <path d="M17 16v-4" stroke="#a78bfa" />
    <path d="M5 8l6-3 5 5 4-4" stroke="#34d399" strokeWidth="2.5" />
  </svg>
);

export default BarChartIcon;
