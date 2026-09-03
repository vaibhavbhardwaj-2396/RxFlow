import { DemoBand, FinalCta } from "./closers";
import { Faq } from "./faq";
import { Hero } from "./hero";
import { MarketingFooter } from "./marketing-footer";
import { MarketingNav } from "./marketing-nav";
import { ComplexityAndPhases, NotAReminder, Pipeline } from "./narrative";
import { Pricing } from "./pricing";
import {
  GroupsAndAudience,
  RemindersAndPrescription,
  TodayAndCalendar,
} from "./product-tour";
import { RealExample } from "./real-example";
import { Trust } from "./trust";

export function MarketingHome({ demoEnabled }: { demoEnabled: boolean }) {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-canvas">
      <MarketingNav demoEnabled={demoEnabled} />
      <main id="main" className="flex-1">
        <Hero demoEnabled={demoEnabled} />
        <RealExample />
        <Pipeline />
        <NotAReminder />
        <ComplexityAndPhases />
        <TodayAndCalendar />
        <RemindersAndPrescription />
        <GroupsAndAudience />
        <Trust />
        <Pricing demoEnabled={demoEnabled} />
        <DemoBand demoEnabled={demoEnabled} />
        <Faq />
        <FinalCta demoEnabled={demoEnabled} />
      </main>
      <MarketingFooter />
    </div>
  );
}
