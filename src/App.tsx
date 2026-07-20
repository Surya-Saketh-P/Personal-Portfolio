import { Cursor } from "./components/Cursor";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { Projects } from "./components/Projects";
import { Experience } from "./components/Experience";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import { FloatingObjects } from "./components/FloatingObjects";
import { DynamicBackground } from "./components/DynamicBackground";
import { SmoothScroll } from "./components/SmoothScroll";
import { QuoteSection } from "./components/QuoteSection";

export default function App() {
  return (
    <SmoothScroll>
      <div className="min-h-screen selection:bg-white selection:text-black font-sans relative flex flex-col bg-transparent">
        <DynamicBackground />
        <Cursor />
        <FloatingObjects />
        <main className="flex-1 relative z-10">
          <Hero />
          <About />
          <Projects />
          <Experience />
          <Contact />
          <QuoteSection />
        </main>
        <Footer />
      </div>
    </SmoothScroll>
  );
}
