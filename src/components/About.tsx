import { ScrollReveal } from "./ScrollReveal";

const row1 = [
  "React", "Node.js", "Express.js", "JavaScript", "Tailwind CSS",
  "HTML5", "CSS3", "Vite", "REST APIs", "Responsive UI",
];

const row2 = [
  "Java", "Python", "MongoDB", "MySQL", "Firebase",
  "Git", "GitHub", "Vercel", "JWT Auth", "System Design",
];

function MarqueeRow({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  // Duplicate for seamless loop
  const doubled = [...items, ...items];
  return (
    <div className="marquee-track overflow-hidden">
      <div className={`flex whitespace-nowrap ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`}>
        {doubled.map((skill, i) => (
          <span
            key={i}
            className="mx-5 md:mx-6 font-sans text-sm md:text-base text-white/20 hover:text-white/70 transition-colors duration-300 cursor-default select-none"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

export function About() {
  return (
    <section id="about" className="pt-28 md:pt-40 pb-20 relative z-10">
      {/* Content */}
      <div className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto mb-24">
        <ScrollReveal>
          <p className="font-sans text-[11px] tracking-[0.15em] uppercase text-white/35 mb-8">
            About
          </p>
        </ScrollReveal>

        <ScrollReveal>
          <h2 className="font-display text-[1.75rem] sm:text-4xl md:text-5xl lg:text-[3.5rem] font-medium leading-[1.2] text-white/70 max-w-4xl">
            I design and build things for the web — from{" "}
            <span className="text-white/95">responsive interfaces</span> to{" "}
            <span className="text-white/95">scalable backend systems</span>
            {" "}— and ship them to production.
          </h2>
        </ScrollReveal>

        <ScrollReveal>
          <p className="mt-10 font-sans text-base sm:text-lg md:text-xl text-white/35 max-w-3xl leading-relaxed">
            CS undergrad at Scaler School of Technology &amp; BITS Pilani.
            I write clean, maintainable code and obsess over architecture that lasts. 
            When I'm not building, I'm solving DSA problems on LeetCode in Java — daily.
          </p>
        </ScrollReveal>
      </div>

      {/* Skill marquee */}
      <div className="border-t border-b border-white/[0.04] py-8 md:py-10 space-y-5 select-none">
        <MarqueeRow items={row1} />
        <MarqueeRow items={row2} reverse />
      </div>
    </section>
  );
}
