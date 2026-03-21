import React from "react";
import BgGlassmorphism from "@/components/BgGlassmorphism";
import SectionSliderNewCategories from "@/components/SectionSliderNewCategories";
import SectionHeroArchivePage from "./(server-components)/SectionHeroArchivePage";

function PageHome() {
  return (
    <main className="nc-PageHome relative overflow-hidden">
      <BgGlassmorphism />

      <div className="container relative">
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
      </div>
    </main>
  );
}

export default PageHome;
