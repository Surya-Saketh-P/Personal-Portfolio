import { ScrollReveal } from "./ScrollReveal";

export function Experience() {
  return (
    <section
      id="experience"
      className="py-28 md:py-40 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto"
    >
      <ScrollReveal>
        <p className="font-sans text-[11px] tracking-[0.15em] uppercase text-white/35 mb-4">
          Background
        </p>
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-16 md:mb-24 tracking-tight">
          Experience
        </h2>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
        {/* Education */}
        <div>
          <ScrollReveal>
            <h3 className="font-sans text-[11px] tracking-[0.15em] uppercase text-white/30 mb-10">
              Education
            </h3>
          </ScrollReveal>

          <div className="space-y-10">
            <ScrollReveal>
              <div className="border-l-[2px] border-white/[0.08] pl-7 hover:border-white/30 transition-colors duration-500">
                <h4 className="font-display text-lg sm:text-xl md:text-2xl font-semibold mb-1 leading-snug">
                  Scaler School of Technology
                </h4>
                <p className="font-sans text-white/40 text-sm sm:text-base">
                  Computer Science — Four-Year Program
                </p>
                <p className="font-sans text-[11px] text-white/25 tracking-[0.1em] uppercase mt-2">
                  Expected 2029
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="border-l-[2px] border-white/[0.08] pl-7 hover:border-white/30 transition-colors duration-500">
                <h4 className="font-display text-lg sm:text-xl md:text-2xl font-semibold mb-1 leading-snug">
                  BITS Pilani
                </h4>
                <p className="font-sans text-white/40 text-sm sm:text-base">
                  Computer Science — Parallel Degree
                </p>
                <p className="font-sans text-[11px] text-white/25 tracking-[0.1em] uppercase mt-2">
                  Expected 2029
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Highlights */}
        <div>
          <ScrollReveal>
            <h3 className="font-sans text-[11px] tracking-[0.15em] uppercase text-white/30 mb-10">
              Highlights
            </h3>
          </ScrollReveal>

          <div className="space-y-10">
            <ScrollReveal>
              <div className="border-l-[2px] border-white/[0.08] pl-7 hover:border-white/30 transition-colors duration-500">
                <h4 className="font-display text-lg sm:text-xl md:text-2xl font-semibold mb-1 leading-snug">
                  Hackathon Organizer
                </h4>
                <p className="font-sans text-white/40 text-sm sm:text-base">
                  Scaler School of Technology
                </p>
                <p className="font-sans text-sm text-white/30 leading-relaxed mt-3">
                  Helped execute India's largest hackathon. Coordinated logistics and technical requirements with Meta, Hugging Face, PyTorch, and OpenENV.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="border-l-[2px] border-white/[0.08] pl-7 hover:border-white/30 transition-colors duration-500">
                <h4 className="font-display text-lg sm:text-xl md:text-2xl font-semibold mb-1 leading-snug">
                  Consistent Problem Solver
                </h4>
                <p className="font-sans text-white/40 text-sm sm:text-base">
                  LeetCode — Java
                </p>
                <p className="font-sans text-sm text-white/30 leading-relaxed mt-3">
                  Daily algorithmic problem solving focused on data structures, algorithms, and writing clean optimal solutions.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
