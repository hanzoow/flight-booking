"use client";

import React, {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { FC } from "react";
import { createPortal } from "react-dom";
import DatePicker from "react-datepicker";
import { Popover, Transition } from "@headlessui/react";
import { CalendarIcon } from "@heroicons/react/24/outline";
import DatePickerCustomHeaderTwoMonth from "@/components/DatePickerCustomHeaderTwoMonth";
import DatePickerCustomDay from "@/components/DatePickerCustomDay";
import ClearDataButton from "../ClearDataButton";
import ButtonSubmit from "../ButtonSubmit";

export interface FlightDateRangeInputProps {
  className?: string;
  fieldClassName?: string;
  hasButtonSubmit?: boolean;
  selectsRange?: boolean;
  onSubmit?: () => void;
  /** Controlled: dates owned by parent */
  startDate: Date | null;
  endDate: Date | null;
  onDateChange: (startDate: Date | null, endDate: Date | null) => void;
  hasError?: boolean;
  errorMessage?: string;
  /** Higher z-index when used inside a modal */
  popoverPanelClassName?: string;
  /**
   * Render calendar in document.body (fixed) so it is not clipped by modal overflow.
   * Same idea as LocationInput dropdownInPortal.
   */
  calendarInPortal?: boolean;
}

const PORTAL_Z = 260;
const PORTAL_GAP = 8;
const VIEWPORT_MARGIN = 12;

type PortalPlacement = {
  top: number | undefined;
  bottom: number | undefined;
  left: number;
  width: number;
  maxHeight: number;
};

const FlightDateRangeInput: FC<FlightDateRangeInputProps> = ({
  className = "",
  fieldClassName = "[ nc-hero-field-padding ]",
  hasButtonSubmit = true,
  selectsRange = true,
  onSubmit,
  startDate,
  endDate,
  onDateChange,
  hasError = false,
  errorMessage,
  popoverPanelClassName = "",
  calendarInPortal = false,
}) => {
  const onChangeRangeDate = useCallback(
    (dates: [Date | null, Date | null]) => {
      const [start, end] = dates;
      onDateChange(start, end);
    },
    [onDateChange]
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [portalOpen, setPortalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelPlacement, setPanelPlacement] = useState<PortalPlacement | null>(
    null
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!calendarInPortal || !portalOpen || !mounted) {
      setPanelPlacement(null);
      return;
    }

    const updatePosition = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const width = Math.min(800, Math.max(280, vw - VIEWPORT_MARGIN * 2));
      const left = Math.max(
        VIEWPORT_MARGIN,
        Math.min(rect.left, vw - width - VIEWPORT_MARGIN)
      );

      // Space available below / above the trigger (within viewport)
      const spaceBelow =
        vh - rect.bottom - PORTAL_GAP - VIEWPORT_MARGIN;
      const spaceAbove = rect.top - PORTAL_GAP - VIEWPORT_MARGIN;

      // Rough min height for 2-month inline picker; flip if below is tight
      const minComfortableBelow = 340;
      const placeBelow =
        spaceBelow >= minComfortableBelow || spaceBelow >= spaceAbove;

      const maxCap = Math.min(vh * 0.92, vh - VIEWPORT_MARGIN * 2);

      if (placeBelow) {
        setPanelPlacement({
          top: rect.bottom + PORTAL_GAP,
          bottom: undefined,
          left,
          width,
          maxHeight: Math.min(maxCap, Math.max(220, spaceBelow)),
        });
      } else {
        setPanelPlacement({
          top: undefined,
          bottom: vh - rect.top + PORTAL_GAP,
          left,
          width,
          maxHeight: Math.min(maxCap, Math.max(220, spaceAbove)),
        });
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [calendarInPortal, portalOpen, mounted, startDate, endDate, selectsRange]);

  useEffect(() => {
    if (!calendarInPortal || !portalOpen) return;

    const onDocClick = (event: MouseEvent) => {
      const t = event.target as Node;
      if (containerRef.current?.contains(t)) return;
      if (portalRef.current?.contains(t)) return;
      setPortalOpen(false);
    };

    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [calendarInPortal, portalOpen]);

  useEffect(() => {
    if (!calendarInPortal || !portalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPortalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [calendarInPortal, portalOpen]);

  const renderCalendar = useCallback(
    () => (
      <div className="overflow-hidden rounded-3xl shadow-lg ring-1 ring-black ring-opacity-5 bg-white dark:bg-neutral-800 p-8">
        {selectsRange ? (
          <DatePicker
            selected={startDate}
            onChange={onChangeRangeDate}
            minDate={new Date()}
            startDate={startDate}
            endDate={endDate}
            selectsRange
            monthsShown={2}
            showPopperArrow={false}
            inline
            renderCustomHeader={(p) => (
              <DatePickerCustomHeaderTwoMonth {...p} />
            )}
            renderDayContents={(day, date) => (
              <DatePickerCustomDay dayOfMonth={day} date={date} />
            )}
          />
        ) : (
          <DatePicker
            selected={startDate}
            onChange={(date) => onDateChange(date, null)}
            minDate={new Date()}
            monthsShown={2}
            showPopperArrow={false}
            inline
            renderCustomHeader={(p) => (
              <DatePickerCustomHeaderTwoMonth {...p} />
            )}
            renderDayContents={(day, date) => (
              <DatePickerCustomDay dayOfMonth={day} date={date} />
            )}
          />
        )}
      </div>
    ),
    [
      selectsRange,
      startDate,
      endDate,
      onDateChange,
      onChangeRangeDate,
    ]
  );

  const renderInput = () => {
    const hasDate = selectsRange ? startDate && endDate : startDate;
    return (
      <>
        <div className={hasError ? "text-red-400" : "text-neutral-300 dark:text-neutral-400"}>
          <CalendarIcon className="w-5 h-5 lg:w-7 lg:h-7" />
        </div>
        <div className="flex-grow text-left">
          <span className={`block xl:text-lg font-semibold ${hasError && !hasDate ? "text-red-400" : ""}`}>
            {startDate?.toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
            }) || "Add dates"}
            {selectsRange && endDate
              ? " - " +
                endDate?.toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                })
              : ""}
          </span>
          <span className={`block mt-1 text-sm leading-none font-light ${hasError ? "text-red-400" : "text-neutral-400"}`}>
            {hasError && errorMessage
              ? errorMessage
              : selectsRange
                ? "Pick up - Drop off"
                : "Pick up date"}
          </span>
        </div>
      </>
    );
  };

  /** Modal / overflow parent: portal calendar */
  if (calendarInPortal) {
    const portalCalendar =
      mounted &&
      typeof document !== "undefined" &&
      portalOpen &&
      panelPlacement &&
      createPortal(
        <div
          ref={portalRef}
          className="fixed overflow-y-auto overscroll-contain rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-xl"
          style={{
            top: panelPlacement.top,
            bottom: panelPlacement.bottom,
            left: panelPlacement.left,
            width: panelPlacement.width,
            maxHeight: panelPlacement.maxHeight,
            zIndex: PORTAL_Z,
          }}
        >
          {renderCalendar()}
        </div>,
        document.body
      );

    return (
      <>
        <div
          ref={containerRef}
          className={`FlightDateRangeInput relative flex ${className}`}
        >
          <div
            className={`flex-1 z-10 flex items-center focus:outline-none ${
              portalOpen ? "nc-hero-field-focused" : ""
            } ${hasError && !portalOpen ? "ring-2 ring-red-400 rounded-full" : ""}`}
          >
            <button
              type="button"
              className={`flex-1 z-10 flex relative ${fieldClassName} items-center space-x-3 focus:outline-none text-left w-full`}
              onClick={() => setPortalOpen((o) => !o)}
            >
              {renderInput()}
              {startDate && portalOpen && (
                <span
                  className="contents"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  role="presentation"
                >
                  <ClearDataButton
                    onClick={() => onChangeRangeDate([null, null])}
                  />
                </span>
              )}
            </button>

            {hasButtonSubmit && (
              <div className="hidden lg:block pr-2 xl:pr-4">
                <ButtonSubmit onClick={onSubmit} />
              </div>
            )}
          </div>

          {portalOpen && (
            <div className="h-8 absolute self-center top-1/2 -translate-y-1/2 z-0 -left-0.5 right-10 bg-white dark:bg-neutral-800" />
          )}

          {portalCalendar}
        </div>
      </>
    );
  }

  /** Default: Headless Popover */
  return (
    <>
      <Popover className={`FlightDateRangeInput relative flex ${className}`}>
        {({ open }) => (
          <>
            <div
              className={`flex-1 z-10 flex items-center focus:outline-none ${open ? "nc-hero-field-focused" : ""} ${
                hasError && !open ? "ring-2 ring-red-400 rounded-full" : ""
              }`}
            >
              <Popover.Button
                className={`flex-1 z-10 flex relative ${fieldClassName} items-center space-x-3 focus:outline-none `}
              >
                {renderInput()}

                {startDate && open && (
                  <ClearDataButton
                    onClick={() => onChangeRangeDate([null, null])}
                  />
                )}
              </Popover.Button>

              {hasButtonSubmit && (
                <div className="hidden lg:block pr-2 xl:pr-4">
                  <ButtonSubmit onClick={onSubmit} />
                </div>
              )}
            </div>

            {open && (
              <div className="h-8 absolute self-center top-1/2 -translate-y-1/2 z-0 -left-0.5 right-10 bg-white dark:bg-neutral-800"></div>
            )}

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel
                className={`absolute left-1/2 z-[100] mt-3 top-full w-screen max-w-sm -translate-x-1/2 transform px-4 sm:px-0 lg:max-w-3xl ${popoverPanelClassName}`}
              >
                {renderCalendar()}
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </>
  );
};

export default FlightDateRangeInput;
