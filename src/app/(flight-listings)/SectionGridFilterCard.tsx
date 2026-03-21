"use client";

import React, { FC } from "react";
import FlightListingWithFilters from "./FlightListingWithFilters";
import { Offer } from "@/api/models";

export interface SectionGridFilterCardProps {
  className?: string;
  offers: Offer[];
  tripType?: "oneWay" | "roundTrip";
}

const SectionGridFilterCard: FC<SectionGridFilterCardProps> = ({
  className = "",
  offers,
  tripType = "roundTrip",
}) => {
  return (
    <div
      className={`nc-SectionGridFilterCard ${className}`}
      data-nc-id="SectionGridFilterCard"
    >
      <FlightListingWithFilters offers={offers} tripType={tripType} />
    </div>
  );
};

export default SectionGridFilterCard;
