import BgGlassmorphism from "@/components/BgGlassmorphism";
import React, { ElementType, FC, ReactNode } from "react";

export interface FlightFlowPageShellProps {
  /** Page-specific BEM / tracking class, e.g. `nc-ListingFlightsPage` */
  pageClassName: string;
  children: ReactNode;
  /** Inner wrapper, default `container relative` */
  containerClassName?: string;
  /** Use `main` on the home page for semantics */
  as?: ElementType;
}

/**
 * Shared shell for flight home, listing, booking, payment, and my-bookings flows:
 * full-width background treatment + centered container.
 */
const FlightFlowPageShell: FC<FlightFlowPageShellProps> = ({
  pageClassName,
  children,
  containerClassName = "container relative",
  as: Tag = "div",
}) => {
  return (
    <Tag className={`${pageClassName} relative overflow-hidden`}>
      <BgGlassmorphism />
      <div className={containerClassName}>{children}</div>
    </Tag>
  );
};

export default FlightFlowPageShell;
