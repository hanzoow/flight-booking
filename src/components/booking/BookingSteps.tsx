"use client";

import React, { FC } from "react";
import {
  ChartBarIcon,
  UserGroupIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";

const STEPS = [
  { id: "search", label: "Search Results", Icon: ChartBarIcon },
  { id: "travelers", label: "Traveler Details", Icon: UserGroupIcon },
  { id: "confirmation", label: "Confirmation", Icon: CheckCircleIcon },
] as const;

export interface BookingStepsProps {
  /** 0 = Search Results, 1 = Traveler Details, 2 = Confirmation */
  currentStepIndex: number;
  className?: string;
}

const BookingSteps: FC<BookingStepsProps> = ({
  currentStepIndex,
  className = "",
}) => {
  return (
    <nav
      aria-label="Booking progress"
      className={`w-full ${className}`}
    >
      <div className="relative max-w-5xl mx-auto px-2 sm:px-4">
        {/* Horizontal connector (desktop) */}
        <div
          className="pointer-events-none absolute left-[12%] right-[12%] top-[22px] hidden h-0.5 bg-neutral-200 dark:bg-neutral-700 sm:block"
          aria-hidden
        />

        <ol className="relative z-[1] flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
          {STEPS.map((step, index) => {
            const isActive = index === currentStepIndex;
            const Icon = step.Icon;

            return (
              <li
                key={step.id}
                className="flex flex-1 flex-row items-center gap-3 sm:flex-col sm:items-center sm:gap-0 sm:min-w-0"
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-colors ${
                    isActive
                      ? "bg-primary-6000"
                      : "bg-neutral-400 dark:bg-neutral-600"
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <span
                  className={`text-sm font-medium sm:mt-2 sm:text-center sm:leading-tight sm:px-1 ${
                    isActive
                      ? "text-primary-6000"
                      : "text-neutral-500 dark:text-neutral-400"
                  }`}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};

export default BookingSteps;
