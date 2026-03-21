"use client";

import React, { FC } from "react";

export type ButtonSubmitVariant = "icon" | "full" | "compact";

export interface ButtonSubmitProps {
  className?: string;
  onClick?: () => void;
  text?: string;
  variant?: ButtonSubmitVariant;
  loading?: boolean;
  disabled?: boolean;
}

const SearchIcon: FC<{ className?: string }> = ({
  className = "h-6 w-6",
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const LoadingSpinner: FC = () => (
  <svg
    className="animate-spin h-5 w-5"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="3"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const variantStyles: Record<ButtonSubmitVariant, string> = {
  icon: "h-14 w-14 md:h-16 md:w-16 rounded-full",
  full: "h-14 w-full rounded-full font-medium",
  compact: "flex-shrink-0 px-4 py-2.5 rounded-xl",
};

const ButtonSubmit: FC<ButtonSubmitProps> = ({
  className = "",
  onClick,
  text = "Search",
  variant = "icon",
  loading = false,
  disabled = false,
}) => {
  const baseStyles =
    "bg-primary-6000 hover:bg-primary-700 text-neutral-50 flex items-center justify-center focus:outline-none transition-colors disabled:opacity-70 disabled:cursor-not-allowed";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {variant === "icon" && <SearchIcon />}
          {variant === "full" && (
            <>
              <SearchIcon className="h-5 w-5 mr-2" />
              <span>{text}</span>
            </>
          )}
          {variant === "compact" && (
            <>
              <SearchIcon />
              <span className="ml-2">{text}</span>
            </>
          )}
        </>
      )}
    </button>
  );
};

export default ButtonSubmit;
