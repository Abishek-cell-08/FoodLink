import React, { useEffect, useState } from 'react';
import { Button } from './UI';

interface LandingPageProps {
  onStart: () => void;
}

const heroSlides = [
  {
    src: '/landing/pic2.jpg',
    desktopPosition: 'center center',
    mobilePosition: '58% center',
  },
  {
    src: '/landing/pic3.jpg',
    desktopPosition: 'center center',
    mobilePosition: '62% center',
  },
  {
    src: '/landing/pic4.jpg',
    desktopPosition: 'center center',
    mobilePosition: '52% center',
  },
  {
    src: '/landing/pic1.jpg',
    desktopPosition: 'center center',
    mobilePosition: '56% center',
  },
];

interface HeroSlidesProps {
  activeSlide: number;
  className?: string;
  mobile?: boolean;
}

const HeroSlides: React.FC<HeroSlidesProps> = ({ activeSlide, className = '', mobile = false }) => (
  <div className={`absolute inset-0 ${className}`}>
    {heroSlides.map((slide, index) => (
      <img
        key={slide.src}
        src={slide.src}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-[1600ms] ease-in-out ${
          index === activeSlide ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ objectPosition: mobile ? slide.mobilePosition : slide.desktopPosition }}
      />
    ))}
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.18),rgba(15,23,42,0.42))]" />
    <div
      className={`absolute inset-0 ${
        mobile
          ? 'bg-[linear-gradient(180deg,rgba(2,6,23,0.12)_0%,rgba(2,6,23,0.2)_28%,rgba(2,6,23,0.84)_72%,rgba(2,6,23,0.96)_100%)]'
          : 'bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_36%),linear-gradient(90deg,rgba(2,6,23,0.72)_0%,rgba(2,6,23,0.38)_42%,rgba(2,6,23,0.68)_100%)]'
      }`}
    />
  </div>
);

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
      <section className="relative flex min-h-[calc(100svh-4rem)] w-full items-center overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_22%),linear-gradient(180deg,#020617_0%,#020617_100%)]" />

        <div className="relative z-10 mx-auto flex w-full max-w-[1520px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="glass-surface relative flex w-full overflow-hidden rounded-[28px] border-white/10 bg-white/6 sm:rounded-[36px]">
            <div className="hidden md:block">
              <HeroSlides activeSlide={activeSlide} />
            </div>

            <div className="relative z-10 hidden w-full items-start px-10 py-20 md:flex md:min-h-[min(78svh,820px)] lg:px-16 lg:py-16 xl:px-20">
              <div className="flex max-w-3xl flex-col items-start text-left text-white">
                <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/16 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-50 backdrop-blur-xl sm:text-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]" />
                  Zero Hunger Initiative
                </div>

                <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.06em] text-white drop-shadow-[0_8px_24px_rgba(15,23,42,0.35)] sm:text-6xl md:text-7xl lg:text-8xl">
                  FeedForward
                </h1>

                <p className="mt-5 text-base font-medium leading-8 text-slate-100/92 sm:text-lg md:text-xl">
                  A zero hunger initiative
                </p>

                <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
                  <Button
                    size="lg"
                    onClick={onStart}
                    className="border border-emerald-400/30 bg-emerald-500 px-7 shadow-[0_18px_40px_-18px_rgba(16,185,129,0.9)] hover:bg-emerald-400"
                  >
                    Get Started
                  </Button>
                </div>

                <div className="mt-12 flex items-center gap-3">
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

            <div className="relative z-10 flex min-h-[min(78svh,680px)] w-full flex-col justify-end md:hidden">
              <HeroSlides activeSlide={activeSlide} className="md:hidden" mobile />

              <div className="relative flex w-full flex-1 items-end px-5 pb-7 pt-16">
                <div className="flex w-full flex-col items-start text-left text-white">
                  <div className="mb-4 inline-flex max-w-full items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[8px] font-semibold uppercase tracking-[0.18em] text-emerald-50 backdrop-blur-xl">
                    <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]" />
                    Zero Hunger Initiative
                  </div>

                  <h1 className="max-w-[10.5ch] text-[clamp(2.5rem,11.2vw,3.8rem)] font-black leading-[0.92] tracking-[-0.06em] text-white drop-shadow-[0_8px_24px_rgba(15,23,42,0.4)]">
                    FeedForward
                  </h1>

                  <p className="mt-3 max-w-[16rem] text-[13px] font-medium leading-5 text-slate-100/90">
                    A zero hunger initiative
                  </p>

                  <div className="mt-7 flex w-full flex-col gap-3">
                    <Button
                      size="lg"
                      onClick={onStart}
                      className="min-h-12 w-full border border-emerald-400/30 bg-emerald-500 px-6 text-[15px] shadow-[0_18px_40px_-18px_rgba(16,185,129,0.9)] hover:bg-emerald-400"
                    >
                      Get Started
                    </Button>
                  </div>

                  <div className="mt-6 flex items-center gap-3">
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
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
