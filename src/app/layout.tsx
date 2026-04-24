import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Distributed Games",
  description:
    "Multiplayer quiz and number guessing demo built on Next.js + Socket.IO",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-mono text-sm antialiased">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold tracking-tight">
                distributed-games
              </div>
              <div className="label mt-0.5">
                next.js · socket.io · in-memory rooms
              </div>
            </div>
            <a
              href="https://github.com"
              className="chip"
              target="_blank"
              rel="noreferrer"
            >
              demo build
            </a>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
