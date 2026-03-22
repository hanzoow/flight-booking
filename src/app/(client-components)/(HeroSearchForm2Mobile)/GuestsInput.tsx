"use client";
import React, { useEffect, useState } from "react";
import NcInputNumber from "@/components/NcInputNumber";
import { FC } from "react";
import { GuestsObject } from "../type";

export interface GuestsInputProps {
  defaultValue?: GuestsObject;
  onChange?: (data: GuestsObject) => void;
  className?: string;
}

const GuestsInput: FC<GuestsInputProps> = ({
  defaultValue,
  onChange,
  className = "",
}) => {
  const [guestAdultsInputValue, setGuestAdultsInputValue] = useState(
    defaultValue?.guestAdults || 0
  );
  const [guestChildrenInputValue, setGuestChildrenInputValue] = useState(
    defaultValue?.guestChildren || 0
  );
  const [guestInfantsInputValue, setGuestInfantsInputValue] = useState(() => {
    const a = defaultValue?.guestAdults ?? 0;
    const i = defaultValue?.guestInfants ?? 0;
    return Math.min(i, a);
  });

  useEffect(() => {
    setGuestAdultsInputValue(defaultValue?.guestAdults || 0);
  }, [defaultValue?.guestAdults]);
  useEffect(() => {
    setGuestChildrenInputValue(defaultValue?.guestChildren || 0);
  }, [defaultValue?.guestChildren]);
  useEffect(() => {
    const a = defaultValue?.guestAdults ?? 0;
    const i = defaultValue?.guestInfants ?? 0;
    setGuestInfantsInputValue(Math.min(i, a));
  }, [defaultValue?.guestInfants, defaultValue?.guestAdults]);

  const handleChangeData = (value: number, type: keyof GuestsObject) => {
    if (type === "guestAdults") {
      const nextInfants = Math.min(guestInfantsInputValue, value);
      setGuestAdultsInputValue(value);
      setGuestInfantsInputValue(nextInfants);
      onChange?.({
        guestAdults: value,
        guestChildren: guestChildrenInputValue,
        guestInfants: nextInfants,
      });
      return;
    }
    if (type === "guestChildren") {
      setGuestChildrenInputValue(value);
      onChange?.({
        guestAdults: guestAdultsInputValue,
        guestChildren: value,
        guestInfants: guestInfantsInputValue,
      });
      return;
    }
    if (type === "guestInfants") {
      const capped = Math.min(value, guestAdultsInputValue, 20);
      setGuestInfantsInputValue(capped);
      onChange?.({
        guestAdults: guestAdultsInputValue,
        guestChildren: guestChildrenInputValue,
        guestInfants: capped,
      });
    }
  };

  return (
    <div className={`flex flex-col relative p-5 ${className}`}>
      <span className="mb-5 block font-semibold text-xl sm:text-2xl">
        {`Who's coming?`}
      </span>
      <NcInputNumber
        className="w-full"
        defaultValue={guestAdultsInputValue}
        onChange={(value) => handleChangeData(value, "guestAdults")}
        max={20}
        label="Adults"
        desc="Ages 13 or above"
      />
      <NcInputNumber
        className="w-full mt-6"
        defaultValue={guestChildrenInputValue}
        onChange={(value) => handleChangeData(value, "guestChildren")}
        max={20}
        label="Children"
        desc="Ages 2–12"
      />

      <NcInputNumber
        className="w-full mt-6"
        defaultValue={guestInfantsInputValue}
        onChange={(value) => handleChangeData(value, "guestInfants")}
        max={Math.min(20, guestAdultsInputValue)}
        label="Infants"
        desc="Ages 0–2 (not more than adults)"
      />
    </div>
  );
};

export default GuestsInput;
