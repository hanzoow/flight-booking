import Logo from "@/shared/Logo";
import MenuBar from "@/shared/MenuBar";
import Link from "next/link";
import { FC } from "react";
import { Route } from "@/routers/types";
import AvatarDropdown from "./AvatarDropdown";
import LangDropdown from "./LangDropdown";
import NotifyDropdown from "./NotifyDropdown";

export interface MainNav2Props {
  className?: string;
}

const MainNav2: FC<MainNav2Props> = ({ className = "" }) => {
  return (
    <div className={`MainNav2 relative z-10 ${className}`}>
      <div className="px-4 h-20 lg:container flex justify-between">
        <div className="hidden md:flex justify-start flex-1 items-center space-x-6 sm:space-x-8 lg:space-x-10">
          <Logo className="w-24 self-center" />
          <Link
            href={"/my-bookings" as Route}
            className="self-center whitespace-nowrap text-sm font-semibold text-neutral-700 transition-colors hover:text-primary-6000 dark:text-neutral-200 dark:hover:text-primary-400"
          >
            My Booking
          </Link>
        </div>

        <div className="hidden md:flex flex-shrink-0 justify-end flex-1 lg:flex-none text-neutral-700 dark:text-neutral-100">
          <div className="hidden lg:flex space-x-1">
            <LangDropdown />
            <NotifyDropdown />
            <AvatarDropdown />
          </div>
          <div className="flex space-x-2 lg:hidden">
            <NotifyDropdown />
            <AvatarDropdown />
            <MenuBar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainNav2;
