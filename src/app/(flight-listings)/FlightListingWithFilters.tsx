"use client";

import React, {
  FC,
  Fragment,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import FlightCard from "@/components/FlightCard";
import ButtonClose from "@/shared/ButtonClose";
import ButtonPrimary from "@/shared/ButtonPrimary";
import type { Offer } from "@/api/models";
import { Route } from "@/routers/types";
import {
  buildStopsFilterStats,
  getOutboundStopCount,
  getStopBucketId,
  type StopBucketId,
  type StopBucketStats,
  parseIsoDurationToMinutes,
} from "@/utils/flightStops";
import {
  cheapestOffer,
  groupOffersByOutbound,
  isRoundTripOffer,
  minTotalInOffers,
} from "@/utils/roundTripOffers";
import {
  buildPassengersOfferHrefFromListingQuery,
  copyListingParamsToQuery,
} from "@/utils/flightListingSearchParams";

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}

export interface FlightListingWithFiltersProps {
  className?: string;
  offers: Offer[];
  tripType?: "oneWay" | "roundTrip";
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const StopFilterRows: FC<{
  stats: StopBucketStats[];
  selected: Set<StopBucketId>;
  onToggle: (id: StopBucketId) => void;
}> = ({ stats, selected, onToggle }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold tracking-wider text-neutral-800 dark:text-neutral-200 uppercase">
        Stops
      </h3>
      <ul className="space-y-4">
        {stats.map((row) => {
          if (row.count === 0) return null;
          const checked = selected.has(row.id);
          return (
            <li key={row.id}>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(row.id)}
                  className="mt-1 h-5 w-5 rounded border-neutral-300 text-primary-6000 focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-800"
                />
                <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                  <div>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100 block">
                      {row.label}
                    </span>
                    {row.minTotalAmount != null && (
                      <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mt-0.5 block">
                        from {formatMoney(row.minTotalAmount, row.currency)}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400 whitespace-nowrap flex-shrink-0">
                    {row.count} flight{row.count !== 1 ? "s" : ""}
                  </span>
                </div>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const PlaceholderSection: FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="pt-6 border-t border-neutral-200 dark:border-neutral-700 space-y-3">
    <h3 className="text-xs font-bold tracking-wider text-neutral-800 dark:text-neutral-200 uppercase">
      {title}
    </h3>
    {children}
  </div>
);

const FiltersPanel: FC<{
  stats: StopBucketStats[];
  selectedStops: Set<StopBucketId>;
  onToggleStop: (id: StopBucketId) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}> = ({ stats, selectedStops, onToggleStop, searchQuery, onSearchChange }) => (
  <div className="space-y-0">
    <div className="relative mb-6">
      <i className="las la-search absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-lg" />
      <input
        type="search"
        placeholder="Search"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
      />
    </div>

    <StopFilterRows
      stats={stats}
      selected={selectedStops}
      onToggle={onToggleStop}
    />

    <PlaceholderSection title="Baggage">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Filter by baggage allowance — coming soon.
      </p>
    </PlaceholderSection>

    <PlaceholderSection title="Airlines">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Filter by airline — coming soon.
      </p>
    </PlaceholderSection>

    <PlaceholderSection title="Layover airport">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Filter by layover airport — coming soon.
      </p>
    </PlaceholderSection>
  </div>
);

const FlightListingWithFilters: FC<FlightListingWithFiltersProps> = ({
  className = "",
  offers,
  tripType = "roundTrip",
}) => {
  const urlSearchParams = useSearchParams();
  const listingUrlKey = urlSearchParams.toString();
  const listingSearchQuery = useMemo(
    () => copyListingParamsToQuery(urlSearchParams).toString(),
    [listingUrlKey, urlSearchParams]
  );

  const [selectedStops, setSelectedStops] = useState<Set<StopBucketId>>(
    new Set()
  );
  const [sortBy, setSortBy] = useState<"duration" | "price">("duration");
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOutboundKey, setSelectedOutboundKey] = useState<string | null>(
    null
  );

  const stopStats = useMemo(() => buildStopsFilterStats(offers), [offers]);

  const toggleStop = useCallback((id: StopBucketId) => {
    setSelectedStops((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const filteredAndSortedOffers = useMemo(() => {
    let list = [...offers];

    if (selectedStops.size > 0) {
      list = list.filter((o) =>
        selectedStops.has(getStopBucketId(getOutboundStopCount(o)))
      );
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((o) => {
        const slice = o.slices[0];
        if (!slice) return false;
        const carrier = slice.segments[0]?.operating_carrier?.name ?? "";
        const hay = [
          carrier,
          o.owner?.name ?? "",
          ...slice.segments.flatMap((s) => [
            s.origin?.iata_code,
            s.destination?.iata_code,
            s.origin?.name,
            s.destination?.name,
          ]),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    if (sortBy === "price") {
      list.sort(
        (a, b) =>
          parseFloat(a.total_amount) - parseFloat(b.total_amount) ||
          a.id.localeCompare(b.id)
      );
    } else {
      list.sort((a, b) => {
        const da = parseIsoDurationToMinutes(a.slices[0]?.duration);
        const db = parseIsoDurationToMinutes(b.slices[0]?.duration);
        return da - db || parseFloat(a.total_amount) - parseFloat(b.total_amount);
      });
    }

    return list;
  }, [offers, selectedStops, sortBy, searchQuery]);

  const useRoundTripWizard =
    tripType === "roundTrip" && offers.some(isRoundTripOffer);

  const outboundGroupEntries = useMemo(() => {
    if (!useRoundTripWizard) return [];
    const map = groupOffersByOutbound(filteredAndSortedOffers);
    const entries = Array.from(map.entries());
    entries.sort(([, oa], [, ob]) => {
      if (sortBy === "price") {
        return (
          minTotalInOffers(oa) - minTotalInOffers(ob) ||
          oa[0].id.localeCompare(ob[0].id)
        );
      }
      const da = parseIsoDurationToMinutes(oa[0]?.slices[0]?.duration);
      const db = parseIsoDurationToMinutes(ob[0]?.slices[0]?.duration);
      return (
        da - db ||
        minTotalInOffers(oa) - minTotalInOffers(ob) ||
        oa[0].id.localeCompare(ob[0].id)
      );
    });
    return entries;
  }, [filteredAndSortedOffers, sortBy, useRoundTripWizard]);

  const selectedGroupOffers = useMemo(() => {
    if (!selectedOutboundKey || !useRoundTripWizard) return [];
    const map = groupOffersByOutbound(filteredAndSortedOffers);
    return map.get(selectedOutboundKey) ?? [];
  }, [filteredAndSortedOffers, selectedOutboundKey, useRoundTripWizard]);

  useEffect(() => {
    if (selectedOutboundKey && selectedGroupOffers.length === 0) {
      setSelectedOutboundKey(null);
    }
  }, [selectedOutboundKey, selectedGroupOffers.length]);

  const returnOffersSorted = useMemo(() => {
    if (!useRoundTripWizard || !selectedOutboundKey) return [];
    let list = [...selectedGroupOffers];
    if (sortBy === "price") {
      list.sort(
        (a, b) =>
          parseFloat(a.total_amount) - parseFloat(b.total_amount) ||
          a.id.localeCompare(b.id)
      );
    } else {
      list.sort((a, b) => {
        const ra = parseIsoDurationToMinutes(a.slices[1]?.duration);
        const rb = parseIsoDurationToMinutes(b.slices[1]?.duration);
        return (
          ra - rb ||
          parseFloat(a.total_amount) - parseFloat(b.total_amount) ||
          a.id.localeCompare(b.id)
        );
      });
    }
    return list;
  }, [
    selectedGroupOffers,
    selectedOutboundKey,
    sortBy,
    useRoundTripWizard,
  ]);

  const minReturnGroupTotal = useMemo(
    () =>
      returnOffersSorted.length > 0
        ? minTotalInOffers(returnOffersSorted)
        : 0,
    [returnOffersSorted]
  );

  const selectedDepartureRepresentative = useMemo(
    () =>
      selectedGroupOffers.length > 0
        ? cheapestOffer(selectedGroupOffers)
        : null,
    [selectedGroupOffers]
  );

  const activeFilterCount = selectedStops.size + (searchQuery.trim() ? 1 : 0);

  const filterPanelProps = {
    stats: stopStats,
    selectedStops,
    onToggleStop: toggleStop,
    searchQuery,
    onSearchChange: setSearchQuery,
  };

  return (
    <div className={`nc-FlightListingWithFilters ${className}`}>
      {/* Mobile: filter trigger */}
      <div className="flex flex-col gap-3 mb-4 lg:hidden">
        <button
          type="button"
          onClick={() => setFilterModalOpen(true)}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-medium text-neutral-800 dark:text-neutral-100"
        >
          <i className="las la-sliders-h text-xl" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-primary-6000 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)] lg:gap-10 xl:gap-12">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 shadow-sm">
            <FiltersPanel {...filterPanelProps} />
          </div>
        </aside>

        {/* Main listing */}
        <div className="min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {offers.length === 0 ? (
                "No flights"
              ) : (
                (() => {
                  let count = filteredAndSortedOffers.length;
                  let unit = "flight";
                  if (useRoundTripWizard && !selectedOutboundKey) {
                    count = outboundGroupEntries.length;
                    unit = "outbound option";
                  } else if (useRoundTripWizard && selectedOutboundKey) {
                    count = returnOffersSorted.length;
                    unit = "return option";
                  }
                  const range =
                    count === 0 ? "0" : count === 1 ? "1" : `1 – ${count}`;
                  const pluralUnit =
                    count === 1 ? unit : unit === "flight" ? "flights" : `${unit}s`;
                  return (
                    <>
                      Showing{" "}
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {range}
                      </span>{" "}
                      of {count} {pluralUnit}
                    </>
                  );
                })()
              )}
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="flight-sort" className="text-sm text-neutral-500">
                Sort
              </label>
              <select
                id="flight-sort"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "duration" | "price")
                }
                className="rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm py-2 pl-3 pr-8 text-neutral-900 dark:text-neutral-100 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="duration">Shortest duration</option>
                <option value="price">Lowest price</option>
              </select>
            </div>
          </div>

          <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-4">
            All times are local. Round-trip: pick outbound first, then return. Taxes
            and fees may vary by airline.
          </p>

          {useRoundTripWizard &&
            selectedOutboundKey &&
            selectedDepartureRepresentative && (
              <div className="mb-8 space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Your departure flight to{" "}
                    <span className="text-primary-6000">
                      {selectedDepartureRepresentative.slices[0].destination
                        ?.name ??
                        selectedDepartureRepresentative.slices[0].destination
                          ?.iata_code}
                    </span>
                  </h2>
                  <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    {formatShortDate(
                      selectedDepartureRepresentative.slices[0].segments[0]
                        .departing_at
                    )}
                  </span>
                </div>
                <FlightCard
                  className="border-l-4 border-primary-6000 shadow-md"
                  data={selectedDepartureRepresentative}
                  primarySliceIndex={0}
                  listingSearchQuery={listingSearchQuery}
                  headlinePrice={{
                    currency: selectedDepartureRepresentative.total_currency,
                    amount: minReturnGroupTotal.toFixed(2),
                    subtitle: "Roundtrip per traveler (from)",
                  }}
                  footer={
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">
                        <button
                          type="button"
                          className="font-medium text-primary-6000 hover:underline"
                        >
                          Price breakdown
                        </button>{" "}
                        <span className="text-neutral-400">· coming soon</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedOutboundKey(null)}
                        className="inline-flex h-11 items-center justify-center rounded-full border-2 border-primary-6000 bg-white px-6 text-sm font-semibold text-primary-6000 hover:bg-primary-50 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                      >
                        Change selection
                      </button>
                    </div>
                  }
                />
              </div>
            )}

          {useRoundTripWizard && selectedOutboundKey && (
            <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Your return flight to{" "}
                <span className="text-primary-6000">
                  {selectedDepartureRepresentative?.slices[1]?.segments[
                    (selectedDepartureRepresentative?.slices[1]?.segments
                      .length ?? 1) - 1
                  ]?.destination?.name ??
                    selectedDepartureRepresentative?.slices[1]?.destination
                      ?.name ??
                    selectedDepartureRepresentative?.slices[1]?.destination
                      ?.iata_code}
                </span>
              </h2>
              <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                {selectedDepartureRepresentative?.slices[1]?.segments[0]
                  ?.departing_at
                  ? formatShortDate(
                      selectedDepartureRepresentative.slices[1].segments[0]
                        .departing_at
                    )
                  : ""}
              </span>
            </div>
          )}

          {useRoundTripWizard && !selectedOutboundKey && (
            <h2 className="mb-6 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Choose your outbound flight
            </h2>
          )}

          <div className="g:bg-neutral-50 lg:dark:bg-black/20 rounded-3xl grid grid-cols-1 gap-6">
            {offers.length === 0 ? (
              <div className="text-center py-16">
                <i className="las la-plane text-5xl text-neutral-300 dark:text-neutral-600 mb-4 block" />
                <p className="text-neutral-500 dark:text-neutral-400 text-lg">
                  No flights found for your search criteria.
                </p>
                <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-2">
                  Try adjusting your dates or destinations.
                </p>
              </div>
            ) : filteredAndSortedOffers.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                <p className="text-neutral-600 dark:text-neutral-300">
                  No flights match your filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStops(new Set());
                    setSearchQuery("");
                  }}
                  className="mt-3 text-sm text-primary-6000 font-medium hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : useRoundTripWizard && !selectedOutboundKey ? (
              outboundGroupEntries.length === 0 ? (
                <div className="text-center py-12 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                  <p className="text-neutral-600 dark:text-neutral-300">
                    No outbound flights match your filters.
                  </p>
                </div>
              ) : (
                outboundGroupEntries.map(([key, group]) => {
                  const rep = cheapestOffer(group);
                  if (!rep) return null;
                  const minT = minTotalInOffers(group);
                  return (
                    <FlightCard
                      key={key}
                      data={rep}
                      primarySliceIndex={0}
                      listingSearchQuery={listingSearchQuery}
                      headlinePrice={{
                        currency: rep.total_currency,
                        amount: minT.toFixed(2),
                        subtitle: "Roundtrip per traveler (from)",
                      }}
                      footer={
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setSelectedOutboundKey(key)}
                            className="inline-flex h-11 items-center justify-center rounded-full bg-primary-6000 px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
                          >
                            Select
                          </button>
                        </div>
                      }
                    />
                  );
                })
              )
            ) : useRoundTripWizard && selectedOutboundKey ? (
              returnOffersSorted.length === 0 ? (
                <div className="text-center py-12 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                  <p className="text-neutral-600 dark:text-neutral-300">
                    No return options for this departure.
                  </p>
                </div>
              ) : (
                returnOffersSorted.map((offer) => {
                  const total = parseFloat(offer.total_amount);
                  const delta = total - minReturnGroupTotal;
                  const deltaLabel =
                    delta < 0.005
                      ? `+ ${offer.total_currency} 0`
                      : `+ ${formatMoney(delta, offer.total_currency)}`;
                  return (
                    <FlightCard
                      key={offer.id}
                      data={offer}
                      primarySliceIndex={1}
                      headlinePrice={{
                        amount: offer.total_amount,
                        currency: offer.total_currency,
                        subtitle: `${deltaLabel} vs lowest return for this departure`,
                      }}
                      footer={
                        <div className="flex justify-end">
                          <Link
                            href={
                              buildPassengersOfferHrefFromListingQuery(
                                offer.id,
                                listingSearchQuery
                              ) as Route
                            }
                            className="inline-flex h-11 items-center justify-center rounded-full bg-primary-6000 px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
                          >
                            Select &amp; continue
                          </Link>
                        </div>
                      }
                    />
                  );
                })
              )
            ) : (
              filteredAndSortedOffers.map((offer) => (
                <FlightCard
                  key={offer.id}
                  data={offer}
                  listingSearchQuery={listingSearchQuery}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mobile filters modal */}
      <Transition appear show={filterModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-[200] lg:hidden"
          onClose={() => setFilterModalOpen(false)}
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
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white dark:bg-neutral-900 shadow-xl transition-all max-h-[90vh] flex flex-col">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
                    <Dialog.Title className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Filters
                    </Dialog.Title>
                    <ButtonClose onClick={() => setFilterModalOpen(false)} />
                  </div>
                  <div className="overflow-y-auto flex-1 px-5 py-5">
                    <FiltersPanel {...filterPanelProps} />
                  </div>
                  <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 flex-shrink-0">
                    <ButtonPrimary
                      className="w-full"
                      onClick={() => setFilterModalOpen(false)}
                    >
                      {(() => {
                        let n = filteredAndSortedOffers.length;
                        let label = "flight";
                        if (useRoundTripWizard && !selectedOutboundKey) {
                          n = outboundGroupEntries.length;
                          label = "outbound option";
                        } else if (useRoundTripWizard && selectedOutboundKey) {
                          n = returnOffersSorted.length;
                          label = "return option";
                        }
                        const pl =
                          n === 1
                            ? label
                            : label === "flight"
                              ? "flights"
                              : `${label}s`;
                        return `Show ${n} ${pl}`;
                      })()}
                    </ButtonPrimary>
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

export default FlightListingWithFilters;
