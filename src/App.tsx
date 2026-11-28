import { useState, useEffect } from "react";
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
import { EntryGate } from "./components/EntryGate";
import { ReworkLanding } from "./components/ReworkLanding";

// Flip to false once the portfolio redesign is ready to launch.
// While true, pass ?preview=gate or ?preview=site in the URL to preview WIP views.
const UNDER_REWORK = false;

export default function App() {
  const [previewMode] = useState<"gate" | "site" | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const preview = params.get("preview");
    if (preview === "gate" || preview === "site") return preview;
    return null;
  });

  const [view, setView] = useState<"gate" | "site">(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("preview") === "site") return "site";
    if (params.get("preview") === "gate") return "gate";
    return params.get("v") === "site" ? "site" : "gate";
  });

  const [autoOpenChess, setAutoOpenChess] = useState(false);

  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      setView(params.get("v") === "site" ? "site" : "gate");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const handleEnter = (mode: "site" | "story") => {
    setView("site");
    const url = new URL(window.location.href);
    url.searchParams.set("v", "site");
    window.history.pushState({}, "", url.toString());

    if (mode === "story") {
      setAutoOpenChess(true);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("open-chess"));
      }, 300);
    }
  };

  const handleOpenGate = () => {
    setView("gate");
    const url = new URL(window.location.href);
    url.searchParams.delete("v");
    window.history.pushState({}, "", url.toString());
  };

  if (UNDER_REWORK && !previewMode) {
    return (
      <>
        <Cursor />
        <ReworkLanding />
      </>
    );
  }

  return (
    <>
      <Cursor />

      {view === "gate" ? (
        <EntryGate onEnter={handleEnter} />
      ) : (
        <SmoothScroll>
          <div className="min-h-screen font-sans relative flex flex-col bg-transparent animate-in fade-in duration-700">
            <DynamicBackground />
            <Navbar onOpenGate={handleOpenGate} />
            <main className="flex-1 relative z-10">
              <Hero />
              <About />
              <Projects />
              <Experience />
              <Contact />
              <ChessPopup autoOpen={autoOpenChess} />
            </main>
            <Footer />
          </div>
        </SmoothScroll>
      )}
    </>
  );
}
