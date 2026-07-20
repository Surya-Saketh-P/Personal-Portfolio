import { ScrollReveal } from "./ScrollReveal";

export function Experience() {
  return (
    <section className="py-32 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto border-t border-white/10 mt-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
        <div>
          <ScrollReveal>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-16 tracking-tight">EDUCATION</h2>
          </ScrollReveal>
          <div className="space-y-16">
            <ScrollReveal>
              <div className="flex flex-col gap-3 border-l-[3px] border-white/20 pl-8 hover:border-white transition-colors duration-500">
                <h3 className="font-display text-2xl md:text-3xl font-semibold">Scaler School of Technology</h3>
                <p className="font-sans text-muted text-lg">Four-Year Academic Program in Computer Science</p>
                <p className="font-sans text-sm text-white/40 tracking-wider uppercase">Expected 2029</p>
              </div>
            </ScrollReveal>
            <ScrollReveal>
              <div className="flex flex-col gap-3 border-l-[3px] border-white/20 pl-8 hover:border-white transition-colors duration-500">
                <h3 className="font-display text-2xl md:text-3xl font-semibold">BITS Pilani</h3>
                <p className="font-sans text-muted text-lg">Parallel Degree Program in Computer Science</p>
                <p className="font-sans text-sm text-white/40 tracking-wider uppercase">Expected 2029</p>
              </div>
            </ScrollReveal>
          </div>
        </div>

        <div>
          <ScrollReveal>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-16 tracking-tight">LEADERSHIP</h2>
          </ScrollReveal>
          <div className="space-y-16">
            <ScrollReveal>
              <div className="flex flex-col gap-4 border-l-[3px] border-white/20 pl-8 hover:border-white transition-colors duration-500">
                <div>
                  <h3 className="font-display text-2xl md:text-3xl font-semibold">Hackathon Organizer & Volunteer</h3>
                  <p className="font-sans text-muted mt-2 text-lg">Scaler School of Technology</p>
                </div>
                <p className="font-sans text-white/70 leading-relaxed text-base md:text-lg">
                  Played a pivotal role in arranging and executing India's largest hackathon. Collaborated with major tech entities including Meta, Hugging Face, PyTorch, and OpenENV to coordinate event logistics and technical requirements.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
