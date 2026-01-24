
import React from 'react';
import { Button, Card } from './UI';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => (
  <div className="flex flex-col items-center">
    <section className="w-full py-20 px-6 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
      <div className="flex-1 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Global Goal: Zero Hunger
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-tight">
          Ending <span className="text-emerald-600 underline decoration-emerald-200">Waste</span>,<br />Feeding <span className="text-indigo-600">Hope.</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-xl leading-relaxed">
          WasteFoodLink bridges the gap between surplus food providers and communities in need. Join the movement to reduce environmental impact and ensure no meal goes to waste.
        </p>
        <div className="flex flex-wrap gap-4 pt-4">
          <Button size="lg" onClick={onStart}>Become a Donor</Button>
          <Button size="lg" variant="outline" onClick={onStart}>Register as NGO</Button>
        </div>
        <div className="pt-10 flex items-center gap-8 border-t border-slate-200">
          <div>
            <div className="text-2xl font-bold text-slate-900">1.2M+</div>
            <div className="text-sm text-slate-500 font-medium">kg Food Saved</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">450+</div>
            <div className="text-sm text-slate-500 font-medium">Verified NGOs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">8.5M</div>
            <div className="text-sm text-slate-500 font-medium">Meals Shared</div>
          </div>
        </div>
      </div>
      <div className="flex-1 w-full max-w-lg">
        <div className="relative">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-100 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
          <Card className="relative p-2 overflow-hidden border-4 border-white shadow-2xl">
            <img 
              src="https://picsum.photos/seed/food/800/800" 
              alt="Community Impact" 
              className="rounded-lg w-full h-[500px] object-cover"
            />
            <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur p-4 rounded-xl border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">W</div>
                <div>
                  <div className="text-sm font-bold text-slate-900 tracking-tight">SDG 12: Responsible Consumption</div>
                  <div className="text-xs text-slate-500">Halve global per capita food waste by 2030.</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  </div>
);

export default LandingPage;
