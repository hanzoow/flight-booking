import React from "react";

/** Logo for light header: brand-colored plane + “Flight Booking” */
const LogoSvg = () => {
  return (
    <svg
      className="w-full block dark:hidden overflow-visible"
      viewBox="0 0 220 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <g transform="translate(2, 4)">
        <path
          d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
          fill="currentColor"
        />
      </g>
      <text
        x="32"
        y="21"
        fill="currentColor"
        fontSize="30"
        fontWeight="600"
        fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
      >
        Flight Booking
      </text>
    </svg>
  );
};

export default LogoSvg;
