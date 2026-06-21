import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import WorkList from "@/components/WorkList";
import Preloader from "@/components/Preloader";
import WhyMe from "@/components/WhyMe";
import DesignCarousel from "@/components/DesignCarousel";
import SocialLinks from "@/components/SocialLinks";
import Footer from "@/components/Footer";
import SelectionRandomizer from "@/components/SelectionRandomizer";
import ClientOnly from "@/components/ClientOnly";
import { getPortfolioContent } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function Home() {
  const content = await getPortfolioContent();

  return (
    <>
      <SelectionRandomizer />
      <ClientOnly>
        <Preloader />
        <Header />
        <main>
          <Hero />
          <About content={content.about} />
          <WorkList projects={content.projects} />
          <WhyMe />
          <DesignCarousel items={content.designArchive} />
          <SocialLinks links={content.socialLinks} />
        </main>
        <Footer />
      </ClientOnly>
    </>
  );
}
