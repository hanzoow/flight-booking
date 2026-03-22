import React, { FC } from "react";
import Link from "next/link";
import Logo from "@/shared/Logo";
import Navigation from "@/shared/Navigation/Navigation";
import SearchDropdown from "./SearchDropdown";
import ButtonPrimary from "@/shared/ButtonPrimary";
import MenuBar from "@/shared/MenuBar";
import SwitchDarkMode from "@/shared/SwitchDarkMode";
import { Route } from "@/routers/types";

const MY_BOOKINGS_HREF = "/my-bookings" as Route;

const myBookingLinkClass =
  "whitespace-nowrap text-sm font-semibold text-neutral-700 transition-colors hover:text-primary-6000 dark:text-neutral-200 dark:hover:text-primary-400";

export interface MainNav1Props {
  className?: string;
}

const MainNav1: FC<MainNav1Props> = ({ className = "" }) => {
  return (
    <div className={`nc-MainNav1 relative z-10 ${className}`}>
      <div className="relative px-4 lg:container">
        {/* Mobile & small screens: logo + My Booking + theme + menu */}
        <div className="flex h-20 items-center justify-between md:hidden">
          <Logo className="w-44 shrink-0 self-center" />
          <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
            <Link href={MY_BOOKINGS_HREF} className={myBookingLinkClass}>
              My Booking
            </Link>
            <SwitchDarkMode />
            <MenuBar />
          </div>
        </div>

        <div className="hidden h-20 items-center justify-between md:flex">
          <div className="flex min-w-0 flex-1 items-center justify-start space-x-4 sm:space-x-10">
            <Logo className="w-44 shrink-0 self-center" />
          </div>

          <div className="flex shrink-0 items-center justify-end text-neutral-700 dark:text-neutral-100 lg:flex-none">
            <div className="hidden items-center space-x-0.5 xl:flex">
              <SwitchDarkMode />
              <SearchDropdown className="flex items-center" />
              <Link href={MY_BOOKINGS_HREF} className={`${myBookingLinkClass} px-2`}>
                My Booking
              </Link>
              <div className="px-1" />
            </div>

            <div className="flex items-center gap-2 xl:hidden">
              <SwitchDarkMode />
              <Link href={MY_BOOKINGS_HREF} className={myBookingLinkClass}>
                My Booking
              </Link>
              <MenuBar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainNav1;
