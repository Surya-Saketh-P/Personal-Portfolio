import { ScrollReveal } from "./ScrollReveal";
import { Quote } from "lucide-react";

export function QuoteSection() {
  return (
    <section className="py-24 px-6 md:px-12 lg:px-24 max-w-5xl mx-auto relative z-10 mb-12">
      <ScrollReveal>
        <div className="relative border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md rounded-2xl p-10 md:p-16 flex flex-col md:flex-row items-center gap-8 md:gap-16">
          <div className="absolute top-8 left-8">
             <Quote size={64} className="text-white/[0.03] rotate-180" />
          </div>
          <div className="absolute bottom-8 right-8">
             <Quote size={64} className="text-white/[0.03]" />
          </div>
          
          <div className="relative z-10 w-full flex flex-col">
            <h3 className="font-display text-2xl md:text-3xl lg:text-4xl text-white/80 italic leading-relaxed text-center md:text-left font-light tracking-wide">
              "If the pain doesn't kill me, it will only make me stronger."
            </h3>
            <p className="mt-8 font-sans text-muted text-center md:text-right text-lg md:text-xl font-medium tracking-wide">
              — Sung Jin-Woo, <span className="italic">Solo Leveling</span>
            </p>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
