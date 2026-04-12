import React from 'react';
import { Button } from './UI';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => (
  <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_32%),linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] flex flex-col">

    {/* 🔝 NAVBAR */}
    <header className="w-full max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
    </header>

    {/* 🌟 HERO */}
    <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-6">
      <div className="max-w-2xl space-y-5 text-center sm:space-y-6">

        {/* Badge */}
        <div className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700 sm:text-xs">
          Zero Hunger Initiative
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl md:text-5xl">
          Share Food. <br />
          <span className="text-emerald-600">Save Lives.</span>
        </h1>

        {/* Description */}
        <p className="mx-auto max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
          Connect surplus food with people in need through NGOs. 
          Reduce waste and make every meal count.
        </p>

        {/* CTA */}
        <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row sm:gap-4 sm:pt-4">
          <Button onClick={onStart}>
            Donate Food
          </Button>
          <Button variant="outline" onClick={onStart}>
            Join as NGO
          </Button>
        </div>

      </div>
    </main>

    {/* 🔻 FOOTER */}
    <footer className="text-center text-sm text-slate-400 pb-6">
      © 2026 WasteFoodLink
    </footer>

  </div>
);

export default LandingPage;
