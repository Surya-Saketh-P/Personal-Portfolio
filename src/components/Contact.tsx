import { ScrollReveal } from "./ScrollReveal";

export function Contact() {
  return (
    <section id="contact" className="py-32 md:py-48 px-6 md:px-12 lg:px-24 flex flex-col items-center text-center relative overflow-hidden">
      {/* Huge subtle divider */}
      <div className="w-px h-32 bg-gradient-to-b from-transparent via-white/20 to-transparent mb-24" />

      <ScrollReveal>
        <h2 className="font-display text-5xl md:text-8xl lg:text-[10rem] font-bold tracking-tighter leading-none mb-16 hover:scale-105 transition-transform duration-700 cursor-default">
          LET'S TALK
        </h2>
      </ScrollReveal>
      <ScrollReveal>
        <a 
          href="mailto:suryasaketh.prattipati@gmail.com"
          className="inline-flex items-center justify-center border border-white/20 rounded-full px-10 py-5 font-sans text-lg md:text-xl tracking-wide hover:bg-white hover:text-black hover:border-white transition-all duration-500 ease-out"
        >
          suryasaketh.prattipati@gmail.com
        </a>
      </ScrollReveal>
      
      <div className="mt-32 flex gap-12 font-sans text-muted tracking-widest uppercase text-sm">
        <a href="https://linkedin.com/in/surya-saketh" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">LinkedIn</a>
        <a href="https://github.com/Surya-Saketh-P" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
        <a href="https://leetcode.com/u/Surya_saketh/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">LeetCode</a>
      </div>
      
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[80vw] h-[80vw] md:w-[50vw] md:h-[50vw] bg-white/5 rounded-full blur-[100px] pointer-events-none z-[-1]" />
    </section>
  );
}
