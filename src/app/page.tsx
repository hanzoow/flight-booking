import React from "react";
import SectionSliderNewCategories from "@/components/SectionSliderNewCategories";
import { FlightFlowPageShell } from "@/components/layout";
import SectionHeroArchivePage from "./(server-components)/SectionHeroArchivePage";

function PageHome() {
  return (
    <FlightFlowPageShell as="main" pageClassName="nc-PageHome">
      <SectionHeroArchivePage
        currentPage="Flights"
        currentTab="Flights"
        heading="Search Flights"
        subHeading="Find the best flight deals worldwide"
        className="pt-10 pb-24 lg:pb-28 lg:pt-16"
      />

      <SectionSliderNewCategories
        heading="Explore top destinations ✈"
        subHeading="Explore thousands of destinations around the world"
        categoryCardType="card4"
        itemPerRow={4}
      />
    </FlightFlowPageShell>
  );
}

export default PageHome;
