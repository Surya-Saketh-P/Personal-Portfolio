import { ScrollReveal } from "./ScrollReveal";
import { Code2, Braces, FileCode, Server, Database, GitBranch, Atom, Flame, Triangle, Layout, LineChart } from "lucide-react";

export function About() {
  return (
    <section className="py-32 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto relative z-10">
      <ScrollReveal>
        <h3 className="text-2xl md:text-4xl lg:text-5xl font-display font-medium leading-tight text-white/60 max-w-5xl">
          I am an aspiring Software Engineer with a strong foundation in <span className="text-white">Data Structures, Algorithms</span>, and <span className="text-white">Full-Stack Web Development</span>. 
          <br/><br/>
          Passionate about building production-ready web applications with clean architecture, responsive interfaces, and scalable backend systems. Seeking opportunities to contribute and grow as an engineer.
        </h3>
      </ScrollReveal>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-white/10 pt-16">
        <ScrollReveal>
          <h4 className="font-sans text-muted uppercase tracking-wider text-xs md:text-sm mb-8">Core Languages</h4>
          <ul className="space-y-4 font-sans text-lg text-white/90">
            <li className="flex items-center gap-3"><Code2 size={20} className="text-white/40"/> Java (DSA)</li>
            <li className="flex items-center gap-3"><Braces size={20} className="text-white/40"/> JavaScript (ES6+)</li>
            <li className="flex items-center gap-3"><FileCode size={20} className="text-white/40"/> Python</li>
            <li className="flex items-center gap-3"><Layout size={20} className="text-white/40"/> HTML & CSS</li>
          </ul>
        </ScrollReveal>
        <ScrollReveal>
          <h4 className="font-sans text-muted uppercase tracking-wider text-xs md:text-sm mb-8">Frameworks & Libs</h4>
          <ul className="space-y-4 font-sans text-lg text-white/90">
            <li className="flex items-center gap-3"><Atom size={20} className="text-white/40"/> React.js</li>
            <li className="flex items-center gap-3"><Server size={20} className="text-white/40"/> Node.js & Express.js</li>
            <li className="flex items-center gap-3"><LineChart size={20} className="text-white/40"/> NumPy & Pandas</li>
            <li className="flex items-center gap-3"><Layout size={20} className="text-white/40"/> Tailwind CSS</li>
          </ul>
        </ScrollReveal>
        <ScrollReveal>
          <h4 className="font-sans text-muted uppercase tracking-wider text-xs md:text-sm mb-8">Tools & Databases</h4>
          <ul className="space-y-4 font-sans text-lg text-white/90">
            <li className="flex items-center gap-3"><GitBranch size={20} className="text-white/40"/> Git & GitHub</li>
            <li className="flex items-center gap-3"><Database size={20} className="text-white/40"/> MySQL</li>
            <li className="flex items-center gap-3"><Flame size={20} className="text-white/40"/> Firebase</li>
            <li className="flex items-center gap-3"><Triangle size={20} className="text-white/40"/> Vercel</li>
          </ul>
        </ScrollReveal>
      </div>
    </section>
  );
}
