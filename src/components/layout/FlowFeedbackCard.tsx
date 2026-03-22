import React, { FC, ReactNode } from "react";

export type FlowFeedbackVariant = "error" | "empty" | "warning";

const defaultIcons: Record<FlowFeedbackVariant, string> = {
  error: "las la-exclamation-circle mb-3 block text-4xl text-red-500",
  empty: "las la-search mb-3 block text-4xl text-neutral-300 dark:text-neutral-600",
  warning: "",
};

const variantBox: Record<FlowFeedbackVariant, string> = {
  error:
    "rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm dark:border-red-800 dark:bg-red-900/20",
  empty: "rounded-2xl bg-neutral-50 p-8 text-center dark:bg-neutral-800",
  warning:
    "rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100",
};

const titleClass: Record<FlowFeedbackVariant, string> = {
  error: "font-medium text-red-600 dark:text-red-400",
  empty: "text-lg text-neutral-500 dark:text-neutral-400",
  warning: "font-medium",
};

const descriptionClass: Record<FlowFeedbackVariant, string> = {
  error: "mt-1 text-sm text-red-500 dark:text-red-400",
  empty: "mt-1 text-sm text-neutral-400 dark:text-neutral-500",
  warning: "mt-2",
};

export interface FlowFeedbackCardProps {
  variant: FlowFeedbackVariant;
  title: string;
  description?: ReactNode;
  className?: string;
  /** Override default Line Awesome icon (omit icon when `null`) */
  iconClassName?: string | null;
  children?: ReactNode;
  role?: "alert" | "status";
}

/**
 * Consistent empty / error / warning panels across listing and booking flows.
 */
const FlowFeedbackCard: FC<FlowFeedbackCardProps> = ({
  variant,
  title,
  description,
  className = "",
  iconClassName,
  children,
  role,
}) => {
  if (variant === "warning") {
    return (
      <div className={`${variantBox.warning} ${className}`.trim()} role={role}>
        <p className={titleClass.warning}>{title}</p>
        {description != null && description !== "" && (
          <div className={descriptionClass.warning}>{description}</div>
        )}
        {children}
      </div>
    );
  }

  return (
    <div className={`${variantBox[variant]} ${className}`.trim()} role={role}>
      {iconClassName !== null && (
        <i
          className={iconClassName ?? defaultIcons[variant]}
          aria-hidden
        />
      )}
      <p className={titleClass[variant]}>{title}</p>
      {description != null && description !== "" && (
        <div className={descriptionClass[variant]}>{description}</div>
      )}
      {children}
    </div>
  );
};

export default FlowFeedbackCard;
