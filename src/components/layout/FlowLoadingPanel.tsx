import React, { FC, ReactNode } from "react";

export interface FlowLoadingPanelProps {
  message: string;
  className?: string;
  /** Optional extra content under the message */
  children?: ReactNode;
}

/** Centered spinner panel used while loading offers, orders, etc. */
const FlowLoadingPanel: FC<FlowLoadingPanelProps> = ({
  message,
  className = "",
  children,
}) => (
  <div
    className={`rounded-2xl border border-neutral-200 bg-white p-12 text-center dark:border-neutral-700 dark:bg-neutral-900 ${className}`.trim()}
  >
    <i className="las la-spinner la-spin text-4xl text-primary-6000" aria-hidden />
    <p className="mt-4 text-neutral-600 dark:text-neutral-300">{message}</p>
    {children}
  </div>
);

export default FlowLoadingPanel;
