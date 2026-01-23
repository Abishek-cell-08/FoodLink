
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, UserRole, FoodDonation, DonationStatus } from './types';
import { MOCK_DONATIONS } from './constants';
import Navbar from './components/Navbar';
import DashboardLayout from './components/DashboardLayout';
import { Button, Input, Card, StatusBadge } from './components/UI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const LandingPage: React.FC<{ onStart: () => void }> = ({ onStart }) => (
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

const LoginPage: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>(UserRole.DONOR);
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const names = {
      [UserRole.DONOR]: 'Skyline Restaurant',
      [UserRole.NGO]: 'Help Hands Foundation',
      [UserRole.ADMIN]: 'Platform Super Admin'
    };
    onLogin({
      id: `u-${Math.random()}`,
      name: names[role],
      email: `${role.toLowerCase()}@wfl.com`,
      role,
      verified: true,
      performanceScore: 85
    });
  };

  return (
    <div className="max-w-md mx-auto py-20 px-6">
      <Card className="p-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
          <p className="text-slate-500 text-sm font-medium">Please sign in to your dashboard</p>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-xl">
          {Object.values(UserRole).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                role === r ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input label="Email Address" type="email" placeholder="john@example.com" required />
          <Input label="Password" type="password" placeholder="••••••••" required />
          <Button fullWidth size="lg">Sign In as {role}</Button>
        </form>

        <div className="text-center">
          <span className="text-sm text-slate-500">Don't have an account? </span>
          <button className="text-sm font-bold text-emerald-600 hover:underline">Register Now</button>
        </div>
      </Card>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const data = [
    { name: 'Mon', saved: 400, wasted: 240 },
    { name: 'Tue', saved: 300, wasted: 139 },
    { name: 'Wed', saved: 200, wasted: 980 },
    { name: 'Thu', saved: 278, wasted: 390 },
    { name: 'Fri', saved: 189, wasted: 480 },
    { name: 'Sat', saved: 239, wasted: 380 },
    { name: 'Sun', saved: 349, wasted: 430 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Impact Analytics</h2>
          <p className="text-slate-500">Real-time system health and waste reduction metrics</p>
        </div>
        <Button size="sm" variant="outline">Download Report</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Food Saved', val: '4,285 kg', change: '+12%', color: 'emerald' },
          { label: 'NGO Utilization', val: '88.5%', change: '+2.4%', color: 'indigo' },
          { label: 'Active Requests', val: '124', change: '-5', color: 'blue' },
          { label: 'Avg Pickup Time', val: '45m', change: '-10m', color: 'orange' }
        ].map((stat, i) => (
          <Card key={i} className="p-6">
            <div className="text-sm font-semibold text-slate-500 mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-slate-900">{stat.val}</div>
            <div className={`text-xs mt-2 font-bold ${stat.change.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>
              {stat.change} <span className="text-slate-400 font-normal">from last week</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Prediction vs Actual Demand</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip />
                <Area type="monotone" dataKey="saved" stroke="#10b981" fillOpacity={1} fill="url(#colorSaved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Area-wise NGO Engagement</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip />
                <Bar dataKey="wasted" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

const DonorDashboard: React.FC<{ onAddClick: () => void }> = ({ onAddClick }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Donor Dashboard</h2>
          <p className="text-slate-500">Track your contributions and live donation status</p>
        </div>
        <Button onClick={onAddClick}>+ Add Donation</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-emerald-600 text-white">
          <div className="text-emerald-100 text-sm font-medium">Total Food Contributed</div>
          <div className="text-3xl font-bold mt-1">452 kg</div>
          <div className="mt-4 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">Top 5% Donor</span>
          </div>
        </Card>
        <Card className="p-6 border-slate-200">
          <div className="text-slate-500 text-sm font-medium">Impact Score</div>
          <div className="text-3xl font-bold mt-1 text-slate-900">9.4/10</div>
          <div className="text-emerald-600 text-xs font-bold mt-2">↑ 0.5 this month</div>
        </Card>
        <Card className="p-6 border-slate-200">
          <div className="text-slate-500 text-sm font-medium">Active Allocations</div>
          <div className="text-3xl font-bold mt-1 text-slate-900">2 Pending</div>
          <div className="text-slate-400 text-xs mt-2 italic">Next pickup: Approx 2:00 PM</div>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Recent Donations</h3>
        <Card className="overflow-hidden border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-700">Food Type</th>
                <th className="px-6 py-4 font-bold text-slate-700">Quantity</th>
                <th className="px-6 py-4 font-bold text-slate-700">Time Window</th>
                <th className="px-6 py-4 font-bold text-slate-700">Status</th>
                <th className="px-6 py-4 font-bold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_DONATIONS.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{d.foodType}</td>
                  <td className="px-6 py-4 text-slate-600">{d.quantity}</td>
                  <td className="px-6 py-4 text-slate-600">{d.expiryWindow}</td>
                  <td className="px-6 py-4"><StatusBadge status={d.status} /></td>
                  <td className="px-6 py-4">
                    <Button variant="outline" size="sm">View QR</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
};

const NGO_Dashboard: React.FC<{ user: User, onScanClick: () => void }> = ({ user, onScanClick }) => {
  // Ranking Algorithm Logic:
  // Priority Score = (W_Urgency * (1/ExpiryHours)) + (W_Distance * (1/DistanceKm)) + (W_Performance * PerformanceScore)
  // Higher Score = Higher Priority
  const rankedDonations = useMemo(() => {
    const weights = { urgency: 0.6, distance: 0.3, performance: 0.1 };
    
    return MOCK_DONATIONS
      .filter(d => d.status === DonationStatus.PENDING)
      .map(d => {
        const urgencyPart = weights.urgency * (12 / Math.max(0.5, d.expiryHours)); // Normalized against 12h
        const distancePart = weights.distance * (10 / Math.max(0.1, d.distanceKm)); // Normalized against 10km
        const performancePart = weights.performance * (user.performanceScore || 50) / 100;
        
        const priorityScore = (urgencyPart + distancePart + performancePart) * 10;
        return { ...d, priorityScore: Math.min(100, Math.round(priorityScore * 10) / 10) };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }, [user]);

  const getPriorityColor = (score: number) => {
    if (score > 80) return 'text-red-600 bg-red-50 border-red-100';
    if (score > 50) return 'text-orange-600 bg-orange-50 border-orange-100';
    return 'text-blue-600 bg-blue-50 border-blue-100';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">NGO Hub</h2>
          <p className="text-slate-500">Smart-ranked food surplus based on your profile and donation urgency</p>
        </div>
        <Button variant="secondary" onClick={onScanClick}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
          Scan & Verify
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rankedDonations.map((d) => (
          <Card key={d.id} className="group relative p-6 flex flex-col h-full border-slate-200 hover:border-emerald-300 transition-all hover:shadow-md">
            <div className={`absolute -top-3 -right-3 px-3 py-1 rounded-full border shadow-sm text-xs font-bold flex flex-col items-center justify-center ${getPriorityColor(d.priorityScore)}`}>
              <span className="text-[10px] uppercase opacity-70">Priority</span>
              <span>{d.priorityScore}</span>
            </div>

            <div className="flex justify-between items-start mb-4">
              <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold uppercase">Ranked Choice</div>
              <span className="text-xs text-slate-400 font-medium">{d.distanceKm} km away</span>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-emerald-700 transition-colors">{d.foodType}</h3>
            <p className="text-sm text-slate-600 mb-4">{d.donorName}</p>
            
            <div className="space-y-3 mt-auto">
              <div className="flex justify-between text-sm py-2 border-y border-slate-100">
                <span className="text-slate-500">Quantity:</span>
                <span className="font-bold text-slate-900">{d.quantity}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                <span className="text-slate-500">Time Window:</span>
                <span className={`font-bold ${d.expiryHours <= 2 ? 'text-red-600' : 'text-slate-900'}`}>
                  {d.expiryWindow} {d.expiryHours <= 2 && ' (Critical)'}
                </span>
              </div>
              <div className="pt-2 flex gap-3">
                <Button fullWidth variant="secondary" className="group-hover:scale-[1.02] transition-transform">Claim Now</Button>
                <Button variant="outline" size="sm">View Map</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-12 bg-emerald-50 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 border border-emerald-100">
        <div className="flex-1 space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase">Dynamic Algorithm V2.0</div>
          <h3 className="text-xl font-bold text-emerald-900">Advanced Ranking Mechanism</h3>
          <p className="text-sm text-emerald-800 leading-relaxed">
            Our priority engine analyzes <strong>real-time expiry</strong>, <strong>logistics distance</strong>, and your <strong>historical fulfillment score</strong> to show you the most impactful donations first. 
            High-score donations are flagged to prevent food waste at the source.
          </p>
          <div className="flex items-center gap-4 text-xs font-bold text-emerald-600">
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Urgency Weight: 60%</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Proximity Weight: 30%</span>
          </div>
        </div>
        <div className="w-full md:w-64">
          <Card className="p-5 border-none shadow-lg bg-white">
             <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl mx-auto flex items-center justify-center text-emerald-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Your Impact Rank</div>
                  <div className="text-2xl font-black text-emerald-600">Top 12%</div>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Your high pickup rate increases your visibility for urgent surplus.</p>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const AddFoodForm: React.FC<{ onCancel: () => void }> = ({ onCancel }) => (
  <Card className="p-8 max-w-2xl mx-auto">
    <h2 className="text-2xl font-bold text-slate-900 mb-6">List Surplus Food</h2>
    <form className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Food Description" placeholder="e.g. Mixed Vegetarian Lunch" required />
        <Input label="Quantity" placeholder="e.g. 15 kg or 40 packets" required />
        <Input label="Expiry/Time Window (Hours)" type="number" placeholder="e.g. 3" required />
        <Input label="Pickup Location" placeholder="Kitchen Entrance B" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Dietary Information & Storage</label>
        <textarea 
          className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none min-h-[100px]"
          placeholder="Allergens, refrigeration needs, etc."
        />
      </div>
      <div className="flex gap-4">
        <Button className="flex-1" size="lg" type="button" onClick={onCancel}>Post Donation</Button>
        <Button variant="outline" size="lg" type="button" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  </Card>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('landing');

  const handleLogin = (u: User) => {
    setUser(u);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('landing');
  };

  const renderContent = () => {
    if (currentPage === 'landing' && !user) return <LandingPage onStart={() => setCurrentPage('login')} />;
    if (currentPage === 'login' && !user) return <LoginPage onLogin={handleLogin} />;
    
    if (user) {
      return (
        <DashboardLayout user={user} activePage={currentPage} onNavigate={setCurrentPage}>
          {currentPage === 'dashboard' && (
            user.role === UserRole.ADMIN ? <AdminDashboard /> : 
            user.role === UserRole.DONOR ? <DonorDashboard onAddClick={() => setCurrentPage('add-donation')} /> : 
            <NGO_Dashboard user={user} onScanClick={() => alert('Camera requested for scanning QR...')} />
          )}
          {currentPage === 'add-donation' && user.role === UserRole.DONOR && <AddFoodForm onCancel={() => setCurrentPage('dashboard')} />}
          {currentPage === 'my-donations' && user.role === UserRole.DONOR && <DonorDashboard onAddClick={() => setCurrentPage('add-donation')} />}
          {currentPage === 'browse' && user.role === UserRole.NGO && <NGO_Dashboard user={user} onScanClick={() => {}} />}
          {currentPage === 'manage-ngos' && user.role === UserRole.ADMIN && <div className="p-8 text-center text-slate-500">NGO Management Table View goes here...</div>}
          {currentPage === 'reports' && user.role === UserRole.ADMIN && <AdminDashboard />}
        </DashboardLayout>
      );
    }
    
    return <LandingPage onStart={() => setCurrentPage('login')} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar user={user} onLogout={handleLogout} onNavigate={setCurrentPage} />
      <main className="flex-1">
        {renderContent()}
      </main>
      <footer className="py-12 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">W</div>
              <span className="text-xl font-bold text-slate-900">WasteFoodLink</span>
            </div>
            <p className="text-sm text-slate-500 max-w-sm">
              An engineering initiative focused on solving food logistics challenges through technology and community-driven action.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900">Quick Links</h4>
            <ul className="text-sm text-slate-500 space-y-2">
              <li><button className="hover:text-emerald-600">Privacy Policy</button></li>
              <li><button className="hover:text-emerald-600">Terms of Service</button></li>
              <li><button className="hover:text-emerald-600">SDG Impact Report</button></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900">Contact</h4>
            <ul className="text-sm text-slate-500 space-y-2">
              <li>support@wastefoodlink.com</li>
              <li>Help Center</li>
              <li>API Documentation</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-12 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} WasteFoodLink. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default App;
