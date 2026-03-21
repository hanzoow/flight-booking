"use client";

import { MapPinIcon } from "@heroicons/react/24/outline";
import React, { useState, useRef, useEffect, useLayoutEffect, FC } from "react";
import { createPortal } from "react-dom";
import ClearDataButton from "./ClearDataButton";
import { usePlaceSuggestions } from "@/hooks/usePlaceSuggestions";
import { Place } from "@/api/models";

export interface LocationInputProps {
  placeHolder?: string;
  desc?: string;
  className?: string;
  divHideVerticalLineClass?: string;
  autoFocus?: boolean;
  defaultValue?: string;
  onChange?: (value: string, place?: Place) => void;
  hasError?: boolean;
  errorMessage?: string;
  /**
   * When true, suggestions render in a document.body portal with fixed position
   * so they are not clipped by modal overflow (overflow-auto / overflow-hidden).
   */
  dropdownInPortal?: boolean;
}

function formatPlaceLabel(place: Place): string {
  const parts = [place.name];
  if (place.type === "airport" && place.city_name) {
    parts.push(place.city_name);
  }
  parts.push(place.iata_country_code);
  return `${parts.join(", ")} (${place.iata_code})`;
}

const LocationInput: FC<LocationInputProps> = ({
  autoFocus = false,
  placeHolder = "Location",
  desc = "Where are you going?",
  className = "nc-flex-1.5",
  divHideVerticalLineClass = "left-10 -right-0.5",
  defaultValue = "",
  onChange,
  hasError = false,
  errorMessage,
  dropdownInPortal = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownPortalRef = useRef<HTMLDivElement>(null);

  const [value, setValue] = useState(defaultValue);
  const [showPopover, setShowPopover] = useState(autoFocus);
  const [mounted, setMounted] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const { suggestions, loading } = usePlaceSuggestions(value);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setShowPopover(autoFocus);
  }, [autoFocus]);

  useLayoutEffect(() => {
    if (!showPopover || !dropdownInPortal || !mounted) {
      setDropdownRect(null);
      return;
    }

    const updatePosition = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const width = Math.min(Math.max(rect.width, 300), 560);
      const left = Math.min(
        rect.left,
        typeof window !== "undefined" ? window.innerWidth - width - 16 : rect.left
      );
      setDropdownRect({
        top: rect.bottom + 8,
        left: Math.max(8, left),
        width,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [showPopover, dropdownInPortal, mounted, value]);

  useEffect(() => {
    if (eventClickOutsideDiv) {
      document.removeEventListener("click", eventClickOutsideDiv);
    }
    showPopover && document.addEventListener("click", eventClickOutsideDiv);
    return () => {
      document.removeEventListener("click", eventClickOutsideDiv);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPopover]);

  useEffect(() => {
    if (showPopover && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showPopover]);

  const eventClickOutsideDiv = (event: MouseEvent) => {
    const target = event.target as Node;
    if (!containerRef.current) return;
    if (!showPopover) return;
    if (containerRef.current.contains(target)) return;
    if (dropdownPortalRef.current?.contains(target)) return;
    setShowPopover(false);
  };

  const handleSelectPlace = (place: Place) => {
    const label = formatPlaceLabel(place);
    setValue(label);
    onChange?.(label, place);
    setShowPopover(false);
  };

  const renderSuggestions = () => {
    if (loading) {
      return (
        <div className="px-4 sm:px-8 py-4 text-neutral-400 text-sm">
          Searching...
        </div>
      );
    }

    if (suggestions.length === 0 && value.length >= 2) {
      return (
        <div className="px-4 sm:px-8 py-4 text-neutral-400 text-sm">
          No results found
        </div>
      );
    }

    return suggestions.map((place) => (
      <span
        onClick={() => handleSelectPlace(place)}
        key={place.id}
        className="flex px-4 sm:px-8 items-center space-x-3 sm:space-x-4 py-4 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
      >
        <span className="block text-neutral-400">
          {place.type === "city" ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          )}
        </span>
        <div className="flex-grow">
          <span className="block font-medium text-neutral-700 dark:text-neutral-200">
            {place.name}
            <span className="ml-1 text-neutral-400 font-normal">
              ({place.iata_code})
            </span>
          </span>
          <span className="block text-sm text-neutral-400">
            {place.type === "airport" && place.city_name
              ? `${place.city_name}, `
              : ""}
            {place.iata_country_code}
            {place.type === "city" && place.airports
              ? ` · ${place.airports.length} airport${place.airports.length !== 1 ? "s" : ""}`
              : ""}
          </span>
        </div>
      </span>
    ));
  };

  const renderEmptyState = () => (
    <div className="px-4 sm:px-8 py-4 text-neutral-400 text-sm">
      Type at least 2 characters to search
    </div>
  );

  const dropdownClassName =
    "w-full min-w-[300px] sm:min-w-[500px] bg-white dark:bg-neutral-800 py-3 sm:py-6 rounded-3xl shadow-xl max-h-[min(24rem,calc(100vh-8rem))] overflow-y-auto border border-neutral-200 dark:border-neutral-700";

  const dropdownInner = (
    <>
      {value.length >= 2 ? renderSuggestions() : renderEmptyState()}
    </>
  );

  const portalDropdown =
    mounted &&
    typeof document !== "undefined" &&
    showPopover &&
    dropdownInPortal &&
    dropdownRect &&
    createPortal(
      <div
        ref={dropdownPortalRef}
        className={`${dropdownClassName} fixed z-[260]`}
        style={{
          top: dropdownRect.top,
          left: dropdownRect.left,
          width: dropdownRect.width,
        }}
        role="listbox"
      >
        {dropdownInner}
      </div>,
      document.body
    );

  return (
    <div className={`relative flex ${className}`} ref={containerRef}>
      <div
        onClick={() => setShowPopover(true)}
        className={`flex z-10 flex-1 relative [ nc-hero-field-padding ] flex-shrink-0 items-center space-x-3 cursor-pointer focus:outline-none text-left ${
          showPopover ? "nc-hero-field-focused" : ""
        } ${hasError && !showPopover ? "ring-2 ring-red-400 rounded-full" : ""}`}
      >
        <div className={hasError ? "text-red-400" : "text-neutral-300 dark:text-neutral-400"}>
          <MapPinIcon className="w-5 h-5 lg:w-7 lg:h-7" />
        </div>
        <div className="flex-grow">
          <input
            className={`block w-full bg-transparent border-none focus:ring-0 p-0 focus:outline-none xl:text-lg font-semibold truncate ${
              hasError
                ? "placeholder-red-400 focus:placeholder-red-300"
                : "placeholder-neutral-800 dark:placeholder-neutral-200 focus:placeholder-neutral-300"
            }`}
            placeholder={placeHolder}
            value={value}
            autoFocus={showPopover}
            onChange={(e) => {
              setValue(e.currentTarget.value);
            }}
            ref={inputRef}
          />
          <span className={`block mt-0.5 text-sm font-light ${hasError ? "text-red-400" : "text-neutral-400"}`}>
            <span className="line-clamp-1">{hasError && errorMessage ? errorMessage : !!value ? placeHolder : desc}</span>
          </span>
          {value && showPopover && (
            <ClearDataButton
              onClick={() => {
                setValue("");
                onChange?.("");
              }}
            />
          )}
        </div>
      </div>

      {showPopover && (
        <div
          className={`h-8 absolute self-center top-1/2 -translate-y-1/2 z-0 bg-white dark:bg-neutral-800 ${divHideVerticalLineClass}`}
        ></div>
      )}

      {showPopover && !dropdownInPortal && (
        <div className="absolute left-0 z-40 w-full min-w-[300px] sm:min-w-[500px] bg-white dark:bg-neutral-800 top-full mt-3 py-3 sm:py-6 rounded-3xl shadow-xl max-h-96 overflow-y-auto">
          {dropdownInner}
        </div>
      )}

      {portalDropdown}
    </div>
  );
};

export default LocationInput;
