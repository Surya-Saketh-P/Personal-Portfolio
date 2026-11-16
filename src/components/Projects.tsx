import { ArrowUpRight, Github } from "lucide-react";
import { TiltCard } from "./TiltCard";
import { ScrollReveal } from "./ScrollReveal";

const projects = [
  {
    num: "01",
    title: "Study Dungeon",
    subtitle: "Active-Recall Learning RPG",
    tech: ["React", "Node.js", "Express", "MongoDB", "Gemini API"],
    desc: "Converts study notes and lecture PDFs into a turn-based retro RPG where academic concepts become monsters you fight. 100% deterministic server-side combat engine with anti-cheat grading. Parallel AI extraction pipeline with SHA-256 caching — cut dungeon generation from 5+ minutes to under 15 seconds. JWT auth, bcrypt, deployed across Vercel + Render + MongoDB Atlas.",
    github: "https://github.com/Surya-Saketh-P/Study_Dungeon",
    live: null,
  },
  {
    num: "02",
    title: "SmartApply",
    subtitle: "AI-Powered Resume Builder",
    tech: ["React", "Firebase", "Gemini API", "Vercel"],
    desc: "Full-stack resume builder that tailors resumes to specific job descriptions using the Google Gemini API. Secure Firebase authentication with real-time data persistence. Responsive UI, production-deployed, and actively used.",
    github: null,
    live: "https://smart-apply-resume-builder.vercel.app",
  },
];

export function Projects() {
  return (
    <section id="work" className="py-28 md:py-40 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">
      <ScrollReveal>
        <p className="font-sans text-[11px] tracking-[0.15em] uppercase text-white/35 mb-4">
          Selected Work
        </p>
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-16 md:mb-24 tracking-tight">
          Projects
        </h2>
      </ScrollReveal>

      <div className="flex flex-col gap-10 md:gap-14">
        {projects.map((proj) => (
          <ScrollReveal key={proj.num}>
            <TiltCard className="group">
              <div className="relative w-full rounded-2xl overflow-hidden bg-white/[0.015] border border-white/[0.04] p-7 sm:p-10 md:p-14 lg:p-16 transition-all duration-500 hover:bg-white/[0.03] hover:border-white/[0.08]">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-14">
                  {/* Decorative number */}
                  <span className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-white/[0.03] leading-none shrink-0 select-none pointer-events-none">
                    {proj.num}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[11px] tracking-[0.15em] uppercase text-white/30 mb-3">
                      {proj.subtitle}
                    </p>
                    <h3 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-5 tracking-tight">
                      {proj.title}
                    </h3>

                    {/* Tech tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {proj.tech.map((t) => (
                        <span
                          key={t}
                          className="font-sans text-[11px] sm:text-xs text-white/50 bg-white/[0.04] px-3 py-1.5 rounded-full border border-white/[0.06]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <p className="font-sans text-sm sm:text-base md:text-lg text-white/40 leading-relaxed max-w-2xl mb-8">
                      {proj.desc}
                    </p>

                    {/* Links */}
                    <div className="flex flex-wrap items-center gap-5">
                      {proj.live && (
                        <a
                          href={proj.live}
                          target="_blank"
                          rel="noreferrer"
                          className="group/link inline-flex items-center gap-2 font-sans text-sm font-medium text-white border border-white/15 rounded-full px-6 py-3 hover:bg-white hover:text-black hover:border-white transition-all duration-300 active:scale-[0.97]"
                        >
                          View Live
                          <ArrowUpRight
                            size={15}
                            className="transition-transform duration-300 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5"
                          />
                        </a>
                      )}
                      {proj.github && (
                        <a
                          href={proj.github}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 font-sans text-sm text-white/40 hover:text-white transition-colors duration-300"
                        >
                          <Github size={16} />
                          Source Code
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TiltCard>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
