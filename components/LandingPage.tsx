import React, { useEffect, useState } from 'react';
import { Button } from './UI';

interface LandingPageProps {
  onStart: () => void;
}

const heroSlides = [
  '/landing/pic2.jpg',
  '/landing/pic3.jpg',
  '/landing/pic4.jpg',
  '/landing/pic1.jpeg',
];

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % heroSlides.length);
    }, 3500);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="bg-slate-950">
      <section className="relative flex min-h-[calc(100vh-4rem)] w-full items-center overflow-hidden bg-slate-950">
        
        {/* Background Slides */}
        <div className="absolute inset-0">
          {heroSlides.map((slide, index) => (
            <div
              key={slide}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[1600ms] ease-in-out ${
                index === activeSlide ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ backgroundImage: `url(${slide})` }}
            />
          ))}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.18),rgba(15,23,42,0.42))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_36%),linear-gradient(90deg,rgba(2,6,23,0.72)_0%,rgba(2,6,23,0.38)_42%,rgba(2,6,23,0.68)_100%)]" />
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto flex w-full max-w-7xl px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
          <div className="flex max-w-3xl flex-col items-start text-left text-white">

            <div className="mb-5 inline-flex rounded-full border border-white/20 bg-white/14 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-100 backdrop-blur-md sm:text-xs">
              Zero Hunger Initiative
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-[0.95] tracking-[-0.04em] text-white drop-shadow-[0_8px_24px_rgba(15,23,42,0.35)] sm:text-5xl md:text-6xl lg:text-7xl">
              Share Food.
              <br />
              <span className="text-emerald-200">Save Lives.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-100/92 drop-shadow-[0_2px_14px_rgba(15,23,42,0.35)] sm:text-lg md:text-xl">
              Connect surplus food with people in need through NGOs. Reduce waste,
              speed up response, and make every meal count.
            </p>

            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
              <Button
                size="lg"
                onClick={onStart}
                className="border border-emerald-400/30 bg-emerald-500 px-7 shadow-[0_18px_40px_-18px_rgba(16,185,129,0.9)] hover:bg-emerald-400"
              >
                Donate Food
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={onStart}
                className="border-white/35 bg-white/10 px-7 text-white backdrop-blur-md hover:bg-white/18 hover:text-white"
              >
                Join as NGO
              </Button>
            </div>

            {/* Indicators */}
            <div className="mt-10 flex items-center gap-3">
              {heroSlides.map((_, index) => (
                <span
                  key={index}
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    index === activeSlide
                      ? 'w-10 bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)]'
                      : 'w-2.5 bg-white/45'
                  }`}
                />
              ))}
            </div>

          </div>
        </div>

      </section>
    </div>
  );
};

export default LandingPage;