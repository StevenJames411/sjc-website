const LOGO_URL =
  "https://imagedelivery.net/xaKlCos5cTg_1RWzIu_h-A/1afcb97f-5140-41e4-eef9-75003ad28b00/public";

export default function Nav() {
  return (
    <header className="sticky top-0 z-20 w-full" style={{ backgroundColor: "#1e3a6e" }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 text-white">
        <a href="/" className="flex items-center gap-3">
          <img src={LOGO_URL} alt="SJC logo" className="h-9 w-9 rounded-full" />
          <span className="text-base font-semibold tracking-tight">Steven James Consulting</span>
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          <a href="/" className="text-sm font-medium opacity-90 hover:opacity-100" aria-label="Home">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 11-1.06 1.06l-.22-.22V19.5A2.25 2.25 0 0117.69 21.75H15a.75.75 0 01-.75-.75v-5.25a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H6.31A2.25 2.25 0 014.06 19.5v-6.13l-.22.22a.75.75 0 11-1.06-1.06l8.69-8.69z" />
            </svg>
          </a>
          <a href="#contact" className="text-sm font-medium opacity-90 hover:opacity-100">Contact Us</a>
        </nav>
        <a href="#contact" className="text-sm font-medium md:hidden">Contact</a>
      </div>
    </header>
  );
}
