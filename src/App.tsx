import { Cursor } from "./components/Cursor";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { Projects } from "./components/Projects";
import { Experience } from "./components/Experience";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import { DynamicBackground } from "./components/DynamicBackground";
import { SmoothScroll } from "./components/SmoothScroll";
import ChessPopup from "./components/ChessPopup";

export default function App() {
  return (
    <SmoothScroll>
      <div className="min-h-screen font-sans relative flex flex-col bg-transparent">
        <DynamicBackground />
        <Cursor />
        <Navbar />
        <main className="flex-1 relative z-10">
          <Hero />
          <About />
          <Projects />
          <Experience />
          <Contact />
          <ChessPopup />
        </main>
        <Footer />
      </div>
    </SmoothScroll>
  );
}
