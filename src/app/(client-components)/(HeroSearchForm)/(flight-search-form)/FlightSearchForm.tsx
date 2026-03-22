"use client";

import React, { FC, useState } from "react";
import { useRouter } from "next/navigation";
import LocationInput from "../LocationInput";
import { Popover, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Fragment } from "react";
import NcInputNumber from "@/components/NcInputNumber";
import FlightDateRangeInput from "./FlightDateRangeInput";
import ButtonSubmit from "@/shared/ButtonSubmit";
import { GuestsObject } from "../../type";

export type TypeDropOffLocationType = "roundTrip" | "oneWay" | "";

export interface FlightSearchInitialValues {
  flyingFrom?: string;
  flyingTo?: string;
  flyingFromIata?: string;
  flyingToIata?: string;
  departDate?: string;
  returnDate?: string;
  tripType?: TypeDropOffLocationType;
  cabin_class?: string;
  adults?: number;
  children?: number;
  infants?: number;
}

export interface FlightSearchFormProps {
  variant?: "hero" | "modal";
  initialValues?: FlightSearchInitialValues;
  /** Called after successful navigation (e.g. close modal) */
  onAfterSearch?: () => void;
}

const flightClass = [
  { name: "Economy", value: "economy" },
  { name: "Premium Economy", value: "premium_economy" },
  { name: "Business", value: "business" },
  { name: "First", value: "first" },
];

function defaultStartDate(): Date {
  return new Date(new Date().setDate(new Date().getDate()));
}

function defaultEndDate(): Date {
  return new Date(new Date().setDate(new Date().getDate() + 14));
}

function parseYMD(s?: string): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const FlightSearchForm: FC<FlightSearchFormProps> = ({
  variant = "hero",
  initialValues,
  onAfterSearch,
}) => {
  const router = useRouter();

  const initTrip =
    initialValues?.tripType === "oneWay" || initialValues?.tripType === "roundTrip"
      ? initialValues.tripType
      : "roundTrip";

  const [dropOffLocationType, setDropOffLocationType] =
    useState<TypeDropOffLocationType>(initTrip);
  const [flightClassState, setFlightClassState] = useState(
    initialValues?.cabin_class && flightClass.some((c) => c.value === initialValues.cabin_class)
      ? initialValues.cabin_class!
      : "economy"
  );

  const [flyingFrom, setFlyingFrom] = useState(initialValues?.flyingFrom ?? "");
  const [flyingFromIata, setFlyingFromIata] = useState(
    initialValues?.flyingFromIata ?? ""
  );
  const [flyingTo, setFlyingTo] = useState(initialValues?.flyingTo ?? "");
  const [flyingToIata, setFlyingToIata] = useState(
    initialValues?.flyingToIata ?? ""
  );

  const [startDate, setStartDate] = useState<Date | null>(() =>
    parseYMD(initialValues?.departDate) ?? defaultStartDate()
  );
  const [endDate, setEndDate] = useState<Date | null>(() => {
    if (initTrip === "oneWay") {
      return parseYMD(initialValues?.returnDate) ?? null;
    }
    return parseYMD(initialValues?.returnDate) ?? defaultEndDate();
  });

  const [guestAdultsInputValue, setGuestAdultsInputValue] = useState(
    initialValues?.adults ?? 2
  );
  const [guestChildrenInputValue, setGuestChildrenInputValue] = useState(
    initialValues?.children ?? 1
  );
  const [guestInfantsInputValue, setGuestInfantsInputValue] = useState(() => {
    const adults = initialValues?.adults ?? 2;
    const infants = initialValues?.infants ?? 1;
    return Math.min(infants, adults);
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChangeData = (value: number, type: keyof GuestsObject) => {
    setErrors((prev) => {
      const { guests, ...rest } = prev;
      return rest;
    });
    if (type === "guestAdults") {
      setGuestAdultsInputValue(value);
      // Infants on lap: cannot exceed number of adults (IATA-style rule)
      setGuestInfantsInputValue((prev) => Math.min(prev, value));
      return;
    }
    if (type === "guestChildren") {
      setGuestChildrenInputValue(value);
      return;
    }
    if (type === "guestInfants") {
      const capped = Math.min(value, guestAdultsInputValue, 4);
      setGuestInfantsInputValue(capped);
    }
  };

  const totalGuests =
    guestChildrenInputValue + guestAdultsInputValue + guestInfantsInputValue;

  const renderGuest = () => {
    return (
      <Popover className="relative">
        {({ open }) => (
          <>
            <Popover.Button
              as="button"
              className={`
           ${open ? "" : ""}
            px-4 py-1.5 rounded-md inline-flex items-center font-medium hover:text-opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 text-xs`}
            >
              <span>{`${totalGuests || ""} Guests`}</span>
              <ChevronDownIcon
                className={`${
                  open ? "" : "text-opacity-70"
                } ml-2 h-4 w-4 group-hover:text-opacity-80 transition ease-in-out duration-150`}
                aria-hidden="true"
              />
            </Popover.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="absolute z-[110] w-full sm:min-w-[340px] max-w-sm bg-white dark:bg-neutral-800 top-full mt-3 left-1/2 -translate-x-1/2  py-5 sm:py-6 px-4 sm:px-8 rounded-3xl shadow-xl ring-1 ring-black/5 dark:ring-white/10">
                <NcInputNumber
                  className="w-full"
                  defaultValue={guestAdultsInputValue}
                  onChange={(value) => handleChangeData(value, "guestAdults")}
                  max={10}
                  min={1}
                  label="Adults"
                  desc="Ages 13 or above"
                />
                <NcInputNumber
                  className="w-full mt-6"
                  defaultValue={guestChildrenInputValue}
                  onChange={(value) => handleChangeData(value, "guestChildren")}
                  max={4}
                  label="Children"
                  desc="Ages 2–12"
                />

                <NcInputNumber
                  className="w-full mt-6"
                  defaultValue={guestInfantsInputValue}
                  onChange={(value) => handleChangeData(value, "guestInfants")}
                  max={Math.min(4, guestAdultsInputValue)}
                  label="Infants"
                  desc="Ages 0–2 (not more than adults)"
                />
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    );
  };

  const renderSelectClass = () => {
    return (
      <Popover className="relative">
        {({ open, close }) => (
          <>
            <Popover.Button
              className={`
           ${open ? "" : ""}
            px-4 py-1.5 rounded-md inline-flex items-center font-medium hover:text-opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 text-xs`}
            >
              <span>{flightClass.find((c) => c.value === flightClassState)?.name ?? flightClassState}</span>
              <ChevronDownIcon
                className={`${
                  open ? "" : "text-opacity-70"
                } ml-2 h-4 w-4 group-hover:text-opacity-80 transition ease-in-out duration-150`}
                aria-hidden="true"
              />
            </Popover.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="absolute z-[110] w-screen max-w-[200px] sm:max-w-[220px] px-4 top-full mt-3 transform -translate-x-1/2 left-1/2 sm:px-0  ">
                <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 ">
                  <div className="relative grid gap-8 bg-white dark:bg-neutral-800 p-7 ">
                    {flightClass.map((item) => (
                      <a
                        key={item.value}
                        href="##"
                        onClick={(e) => {
                          e.preventDefault();
                          setFlightClassState(item.value);
                          close();
                        }}
                        className="flex items-center p-2 -m-3 transition duration-150 ease-in-out rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50"
                      >
                        <p className="text-sm font-medium ">{item.name}</p>
                      </a>
                    ))}
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    );
  };

  const renderRadioBtn = () => {
    return (
      <div className=" py-5 [ nc-hero-field-padding ] flex flex-row flex-wrap border-b border-neutral-100 dark:border-neutral-700">
        <div
          className={`py-1.5 px-4 flex items-center rounded-full font-medium text-xs cursor-pointer mr-2 my-1 sm:mr-3 ${
            dropOffLocationType === "roundTrip"
              ? "bg-black shadow-black/10 shadow-lg text-white"
              : "border border-neutral-300 dark:border-neutral-700"
          }`}
          onClick={() => {
            setDropOffLocationType("roundTrip");
            setEndDate((prev) => prev ?? defaultEndDate());
          }}
        >
          Round-trip
        </div>
        <div
          className={`py-1.5 px-4 flex items-center rounded-full font-medium text-xs cursor-pointer mr-2 my-1 sm:mr-3 ${
            dropOffLocationType === "oneWay"
              ? "bg-black text-white shadow-black/10 shadow-lg"
              : "border border-neutral-300 dark:border-neutral-700"
          }`}
          onClick={() => setDropOffLocationType("oneWay")}
        >
          One-way
        </div>

        <div className="self-center border-r border-slate-200 dark:border-slate-700 h-8 mr-2 my-1 sm:mr-3"></div>

        <div className="mr-2 my-1 sm:mr-3 border border-neutral-300 dark:border-neutral-700 rounded-full">
          {renderSelectClass()}
        </div>
        <div className="my-1 border border-neutral-300 dark:border-neutral-700 rounded-full">
          {renderGuest()}
        </div>
        {errors.guests && (
          <p className="w-full mt-2 px-1 text-xs text-red-500" role="alert">
            {errors.guests}
          </p>
        )}
      </div>
    );
  };

  const formatDate = (date: Date): string => date.toISOString().split("T")[0];

  const validate = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    if (!flyingFromIata) newErrors.from = "Please select origin";
    if (!flyingToIata) newErrors.to = "Please select destination";
    if (!startDate) newErrors.departDate = "Please select departure date";
    if (dropOffLocationType !== "oneWay" && !endDate) {
      newErrors.returnDate = "Please select return date";
    }
    if (guestInfantsInputValue > guestAdultsInputValue) {
      newErrors.guests =
        "Number of infants cannot be greater than number of adults";
    }
    return newErrors;
  };

  const handleSearch = () => {
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const params = new URLSearchParams();
    params.set("origin", flyingFromIata);
    params.set("destination", flyingToIata);
    if (flyingFrom) params.set("from", flyingFrom);
    if (flyingTo) params.set("to", flyingTo);
    if (dropOffLocationType) params.set("tripType", dropOffLocationType);
    if (flightClassState) params.set("cabin_class", flightClassState);
    params.set("departDate", formatDate(startDate!));
    if (endDate && dropOffLocationType !== "oneWay") params.set("returnDate", formatDate(endDate));
    params.set("adults", String(guestAdultsInputValue));
    params.set("children", String(guestChildrenInputValue));
    params.set("infants", String(guestInfantsInputValue));

    router.push(`/listing-flights?${params.toString()}` as any);
    router.refresh();
    onAfterSearch?.();
  };

  const isModal = variant === "modal";
  const outerClass = isModal
    ? "w-full relative mt-0 rounded-2xl shadow-none border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
    : "w-full relative mt-8 rounded-3xl lg:rounded-[40px] xl:rounded-[49px] shadow-xl dark:shadow-2xl bg-white dark:bg-neutral-800";

  const renderForm = () => {
    return (
      <div className={outerClass}>
        {renderRadioBtn()}
        <div className="flex flex-col lg:flex-row flex-1 lg:rounded-full">
          <LocationInput
            placeHolder="Flying from"
            desc="Where do you want to fly from?"
            className="flex-1"
            defaultValue={flyingFrom}
            dropdownInPortal={isModal}
            hasError={!!errors.from}
            errorMessage={errors.from}
            onChange={(value, place) => {
              setFlyingFrom(value);
              setFlyingFromIata(place?.iata_code ?? "");
              if (place?.iata_code) setErrors((prev) => { const { from, ...rest } = prev; return rest; });
            }}
          />
          <div className="hidden lg:block self-center border-r border-slate-200 dark:border-slate-700 h-8"></div>
          <div className="lg:hidden mx-4 border-b border-neutral-100 dark:border-neutral-700"></div>
          <LocationInput
            placeHolder="Flying to"
            desc="Where you want to fly to?"
            className="flex-1"
            divHideVerticalLineClass=" -inset-x-0.5"
            defaultValue={flyingTo}
            dropdownInPortal={isModal}
            hasError={!!errors.to}
            errorMessage={errors.to}
            onChange={(value, place) => {
              setFlyingTo(value);
              setFlyingToIata(place?.iata_code ?? "");
              if (place?.iata_code) setErrors((prev) => { const { to, ...rest } = prev; return rest; });
            }}
          />
          <div className="hidden lg:block self-center border-r border-slate-200 dark:border-slate-700 h-8"></div>
          <div className="lg:hidden mx-4 border-b border-neutral-100 dark:border-neutral-700"></div>
          <FlightDateRangeInput
            selectsRange={dropOffLocationType !== "oneWay"}
            className="flex-1"
            startDate={startDate}
            endDate={endDate}
            onDateChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
              setErrors((prev) => {
                const { departDate, returnDate, ...rest } = prev;
                return rest;
              });
            }}
            hasError={!!errors.departDate || !!errors.returnDate}
            errorMessage={errors.departDate || errors.returnDate}
            onSubmit={handleSearch}
            hasButtonSubmit={!isModal}
            calendarInPortal={isModal}
          />
        </div>
        <div className={`${isModal ? "p-4" : "lg:hidden p-4 pt-0"}`}>
          <ButtonSubmit variant="full" onClick={handleSearch} />
        </div>
      </div>
    );
  };

  return renderForm();
};

export default FlightSearchForm;
