import { ArrowUpRight, Atom, Flame, Triangle, Box, Gamepad2, Sparkles } from "lucide-react";
import { TiltCard } from "./TiltCard";
import { ScrollReveal } from "./ScrollReveal";

const projects = [
  {
    title: "SmartApply Resume Builder",
    role: "React, Firebase, Vercel",
    date: "Apr 2026",
    desc: "Built a responsive full-stack web application for resume creation. Integrated the Gemini API to generate personalized resumes tailored for specific job descriptions. Implemented secure Firebase authentication and real-time data management.",
    link: "https://smart-apply-resume-builder.vercel.app",
    tech: [
      { name: "React", icon: Atom },
      { name: "Firebase", icon: Flame },
      { name: "Gemini API", icon: Sparkles },
      { name: "Vercel", icon: Triangle }
    ]
  },
  {
    title: "Personal Finance Dashboard",
    role: "React, State Management",
    date: "Mar 2026",
    desc: "Developed a functional finance dashboard prototype during a hackathon. Architected state management for financial data visualization and insights, optimizing UI responsiveness under tight timelines.",
    link: "#",
    tech: [
      { name: "React", icon: Atom },
      { name: "State Management", icon: Box }
    ]
  },
  {
    title: "Interactive Game Dev",
    role: "Campfire Bengaluru Hackathon",
    date: "Mar 2026",
    desc: "Collaborated with a team in an intensive 24-hour hackathon to rapidly conceptualize, design, and complete a playable video game.",
    link: "#",
    tech: [
      { name: "Game Engine", icon: Gamepad2 }
    ]
  }
];

export function Projects() {
  return (
    <section className="py-32 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">
      <ScrollReveal>
        <h2 className="font-display text-4xl md:text-6xl font-bold mb-16 tracking-tight">SELECTED WORKS</h2>
      </ScrollReveal>
      
      <div className="flex flex-col gap-16 md:gap-32">
        {projects.map((proj, idx) => (
          <ScrollReveal key={idx}>
            <TiltCard className="group cursor-pointer">
              <div className="relative w-full h-[50vh] md:h-[70vh] rounded-2xl overflow-hidden bg-neutral-900 border border-white/5 flex flex-col justify-end p-8 md:p-16 transition-colors duration-500 group-hover:bg-neutral-800/80 group-hover:border-white/10">
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-0 opacity-80" />
                
                {/* Content popped out via translateZ in TiltCard */}
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                  <div className="max-w-3xl">
                    <p className="font-sans text-muted tracking-widest uppercase text-xs md:text-sm mb-6">{proj.date}</p>
                    <h3 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold mb-6">{proj.title}</h3>
                    
                    <div className="flex flex-wrap gap-3 mb-6">
                      {proj.tech.map((t, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs md:text-sm font-sans text-white/80 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
                          <t.icon size={16} className="text-white/50" />
                          <span>{t.name}</span>
                        </div>
                      ))}
                    </div>

                    <p className="font-sans text-base md:text-lg text-white/70 line-clamp-3 md:line-clamp-none max-w-2xl">{proj.desc}</p>
                  </div>
                  <a href={proj.link} target={proj.link !== "#" ? "_blank" : "_self"} rel="noreferrer" className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center opacity-0 -translate-x-6 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-out shrink-0 hover:scale-110">
                    <ArrowUpRight size={28} />
                  </a>
                </div>
              </div>
            </TiltCard>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
