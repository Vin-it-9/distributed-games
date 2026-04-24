import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Distributed Games",
  description:
    "Multiplayer quiz, guess, math, scramble and emoji games on Next.js + Socket.IO",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%232f81f7'/><stop offset='0.5' stop-color='%23a371f7'/><stop offset='1' stop-color='%23db61a2'/></linearGradient></defs><rect width='64' height='64' rx='14' fill='%230d1117'/><circle cx='20' cy='22' r='5' fill='url(%23g)'/><circle cx='44' cy='22' r='5' fill='url(%23g)'/><circle cx='20' cy='44' r='5' fill='url(%23g)'/><circle cx='44' cy='44' r='5' fill='url(%23g)'/><path d='M20 22 L44 44 M44 22 L20 44 M20 22 L44 22 M20 44 L44 44' stroke='url(%23g)' stroke-width='2' stroke-linecap='round' opacity='0.7'/></svg>",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0d1117",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Material Symbols for iconography. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,400..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="font-sans text-sm antialiased">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <header className="mb-6 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-gh-accent via-gh-purple to-gh-pink grid place-items-center shadow-glass">
                <span className="material-symbols-rounded ms-fill text-white text-[18px]">
                  stadia_controller
                </span>
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight gradient-text">
                  distributed-games
                </div>
                <div className="label mt-0.5 normal-case tracking-normal">
                  next.js · socket.io · in-memory rooms
                </div>
              </div>
            </a>
            <a
              href="https://github.com/Vin-it-9/distributed-games"
              className="chip"
              target="_blank"
              rel="noreferrer"
            >
              <span className="material-symbols-rounded text-[14px]">
                code
              </span>
              github
            </a>
          </header>
          {children}
          <footer className="mt-10 text-center text-[11px] text-gh-muted">
            built with next.js · socket.io · typescript · tailwind ·
            glassmorphism on github dark
          </footer>
        </div>
      </body>
    </html>
  );
}
