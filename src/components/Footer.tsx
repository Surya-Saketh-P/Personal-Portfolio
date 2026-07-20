export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="py-12 px-6 md:px-12 lg:px-24 border-t border-white/10 mt-auto relative z-20 bg-black/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="font-sans text-muted text-xs md:text-sm uppercase tracking-widest">
          © {currentYear} Surya Saketh. All rights reserved.
        </p>
        <div className="flex gap-8 font-sans text-muted text-xs md:text-sm uppercase tracking-widest">
          <a href="https://linkedin.com/in/surya-saketh" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">LinkedIn</a>
          <a href="https://github.com/Surya-Saketh-P" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
          <a href="https://leetcode.com/u/Surya_saketh/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">LeetCode</a>
          <a href="mailto:suryasaketh.prattipati@gmail.com" className="hover:text-white transition-colors">Email</a>
        </div>
      </div>
    </footer>
  );
}
