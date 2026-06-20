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
import { projects } from "@/data/projects";

export default function Home() {
  return (
    <>
      <SelectionRandomizer />
      <ClientOnly>
        <Preloader />
        <Header />
        <main>
          <Hero projects={projects} />
          <About />
          <WorkList projects={projects} />
          <WhyMe />
          <DesignCarousel projects={projects} />
          <SocialLinks />
        </main>
        <Footer />
      </ClientOnly>
    </>
  );
}
