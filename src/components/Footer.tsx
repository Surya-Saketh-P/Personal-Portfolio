export function Footer() {
  return (
    <footer className="py-8 px-6 md:px-12 lg:px-24 border-t border-white/[0.04] relative z-20">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
        <p className="font-sans text-white/20 text-[11px] tracking-[0.08em]">
          © {new Date().getFullYear()} Surya Saketh
        </p>
        <p className="font-sans text-white/12 text-[11px] tracking-[0.08em]">
          Designed &amp; built with intention
        </p>
      </div>
    </footer>
  );
}
