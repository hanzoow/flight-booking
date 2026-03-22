import Link from "next/link";
import React, { FC, ReactNode } from "react";
import { Route } from "@/routers/types";

const backLinkClass =
  "text-sm font-medium text-primary-6000 hover:underline";

export interface BookingFlowPageHeaderProps {
  title: string;
  description?: ReactNode;
  /** When set, renders “back” link above the title */
  backHref?: Route;
  backLabel?: string;
  /** Right column on `sm+` (e.g. price summary card) */
  trailing?: ReactNode;
  className?: string;
}

/**
 * Shared header block: optional back link, title, subtitle, optional trailing card.
 */
const BookingFlowPageHeader: FC<BookingFlowPageHeaderProps> = ({
  title,
  description,
  backHref,
  backLabel = "← Back",
  trailing,
  className = "",
}) => {
  return (
    <div
      className={`mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`.trim()}
    >
      <div>
        {backHref && (
          <Link href={backHref} className={backLinkClass}>
            {backLabel}
          </Link>
        )}
        <h1
          className={`text-2xl font-semibold text-neutral-900 dark:text-neutral-100 ${backHref ? "mt-2" : ""}`}
        >
          {title}
        </h1>
        {description != null && description !== "" && (
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
        )}
      </div>
      {trailing}
    </div>
  );
};

export default BookingFlowPageHeader;
