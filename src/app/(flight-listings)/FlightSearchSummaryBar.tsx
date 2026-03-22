"use client";

import React, { FC, Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import ButtonClose from "@/shared/ButtonClose";
import FlightSearchForm, {
  FlightSearchInitialValues,
} from "@/app/(client-components)/(HeroSearchForm)/(flight-search-form)/FlightSearchForm";

export interface FlightSearchSummaryBarProps {
  className?: string;
  from?: string;
  to?: string;
  origin?: string;
  destination?: string;
  departDate?: string;
  returnDate?: string;
  tripType?: string;
  cabinLabel?: string;
  cabin_class?: string;
  adults?: number;
  children?: number;
  infants?: number;
  totalGuests?: number;
  resultsCount?: number;
}

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

const FlightSearchSummaryBar: FC<FlightSearchSummaryBarProps> = ({
  className = "",
  from,
  to,
  origin,
  destination,
  departDate,
  returnDate,
  tripType = "roundTrip",
  cabinLabel = "Economy",
  cabin_class = "economy",
  adults = 1,
  children = 0,
  infants = 0,
  totalGuests = 1,
  resultsCount,
}) => {
  const [editOpen, setEditOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const departLabel = departDate ? formatDateLabel(departDate) : "";
  const returnLabel = returnDate ? formatDateLabel(returnDate) : "";
  const isRoundTrip = tripType !== "oneWay";

  const openEditModal = () => {
    setFormKey((k) => k + 1);
    setEditOpen(true);
  };

  console.log('resultsCountresultsCount', resultsCount?.toString())

  const initialValues: FlightSearchInitialValues = {
    flyingFrom: from,
    flyingTo: to,
    flyingFromIata: origin,
    flyingToIata: destination,
    departDate,
    returnDate,
    tripType: tripType === "oneWay" ? "oneWay" : "roundTrip",
    cabin_class,
    adults,
    children,
    infants,
  };

  return (
    <div className={`${className}`}>
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {from && to && (
              <div className="flex flex-wrap items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-full px-3 py-1.5">
                <i className="las la-plane-departure text-primary-6000"></i>
                <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate max-w-[120px] sm:max-w-none">
                  {from}
                </span>
                <i className="las la-long-arrow-alt-right text-neutral-400"></i>
                <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate max-w-[120px] sm:max-w-none">
                  {to}
                </span>
              </div>
            )}

            {departLabel && (
              <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full px-3 py-1.5">
                <i className="las la-calendar text-primary-6000"></i>
                <span className="text-neutral-700 dark:text-neutral-300">
                  {departLabel}
                  {isRoundTrip && returnLabel && <> — {returnLabel}</>}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full px-3 py-1.5">
              <span className="text-neutral-700 dark:text-neutral-300">
                {cabinLabel}
              </span>
              <span className="text-neutral-300 dark:text-neutral-600">·</span>
              <span className="text-neutral-700 dark:text-neutral-300">
                {totalGuests} guest{totalGuests !== 1 ? "s" : ""}
              </span>
              <span className="text-neutral-300 dark:text-neutral-600">·</span>
              <span className="text-neutral-700 dark:text-neutral-300">
                {isRoundTrip ? "Round-trip" : "One-way"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={openEditModal}
            className="flex-shrink-0 flex items-center gap-2 bg-primary-6000 hover:bg-primary-700 text-white rounded-full px-5 py-2 text-sm font-medium transition-colors self-start lg:self-auto"
          >
            <i className="las la-search text-base"></i>
            <span>Edit Search</span>
          </button>
        </div>
      </div>

      <Transition appear show={editOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-[200]"
          onClose={() => setEditOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 dark:bg-black/60" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full min-h-[50vh] transform overflow-visible rounded-3xl bg-neutral-100 dark:bg-neutral-900 p-6 shadow-xl transition-all">
                  <div className="relative flex items-start justify-between gap-4 mb-4">
                    <Dialog.Title className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 pr-10">
                      Edit your search
                    </Dialog.Title>
                    <span className="absolute right-0 top-0">
                      <ButtonClose onClick={() => setEditOpen(false)} />
                    </span>
                  </div>
                  <div className="max-h-[min(100vh,900px)] overflow-y-auto overflow-x-hidden rounded-2xl">
                    <FlightSearchForm
                      key={formKey}
                      variant="modal"
                      initialValues={initialValues}
                      onAfterSearch={() => setEditOpen(false)}
                    />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default FlightSearchSummaryBar;
