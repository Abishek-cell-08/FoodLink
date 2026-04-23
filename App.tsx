import React, { useState } from 'react';
import { User, UserRole } from './types';
import Navbar from './components/Navbar';
import DashboardLayout from './components/DashboardLayout';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import AdminOverview from './components/Admin/AdminOverview';
import AdminReports from './components/Admin/AdminReports';
import AdminNGOManagement from './components/Admin/AdminNGOManagement';
import AdminPriorityIntelligence from './components/Admin/AdminPriorityIntelligence';
import AdminDonorManagement from './components/Admin/AdminDonorManagement';
import DonorOverview from './components/Donor/DonorOverview';
import DonorDonations from './components/Donor/DonorDonations';
import NGOOverview from './components/NGO/NGOOverview';
import NGOBrowse from './components/NGO/NGOBrowse';
import NGORequests from './components/NGO/NGORequests';
import NGOScanQR from './components/NGO/NGOScanQR';
import AddFoodForm from './components/Donor/AddFoodForm';
import RegisterPage from './components/RegisterPage';
import ChatAssistant from './components/ChatAssistant';
import { appStorage, isNativeAppShell } from './utils/platform';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('landing');

  const handleLogin = (nextUser: User) => {
    setUser(nextUser);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    appStorage.remove('token');
    setUser(null);
    setCurrentPage('landing');
  };

  const useNativeMobileShell =
    Boolean(user) &&
    isNativeAppShell() &&
    (user?.role === UserRole.DONOR ||
      user?.role === UserRole.NGO ||
      user?.role === UserRole.ADMIN);

  const renderContent = () => {
    if (currentPage === 'landing' && !user) {
      return <LandingPage onStart={() => setCurrentPage('login')} />;
    }

    if (currentPage === 'login' && !user) {
      return (
        <LoginPage
          onLogin={handleLogin}
          onRegisterClick={() => setCurrentPage('register')}
        />
      );
    }

    if (currentPage === 'register' && !user) {
      return <RegisterPage onBackToLogin={() => setCurrentPage('login')} />;
    }

    if (user) {
      return (
        <DashboardLayout
          user={user}
          activePage={currentPage}
          onNavigate={setCurrentPage}
          onLogout={handleLogout}
        >
          {currentPage === 'dashboard' && (
            user.role === UserRole.ADMIN ? (
              <AdminOverview
                onViewReports={() => setCurrentPage('reports')}
                onManageNGOs={() => setCurrentPage('manage-ngos')}
                onViewDonors={() => setCurrentPage('manage-donors')}
              />
            ) : user.role === UserRole.DONOR ? (
              <DonorOverview
                onAddClick={() => setCurrentPage('add-donation')}
                onViewAll={() => setCurrentPage('my-donations')}
              />
            ) : (
              <NGOOverview
                onBrowse={() => setCurrentPage('browse')}
              />
            )
          )}

          {currentPage === 'my-donations' && user.role === UserRole.DONOR && (
            <DonorDonations onAddClick={() => setCurrentPage('add-donation')} />
          )}

          {currentPage === 'add-donation' && user.role === UserRole.DONOR && (
            <AddFoodForm onCancel={() => setCurrentPage('dashboard')} />
          )}

          {currentPage === 'ai' &&
            (user.role === UserRole.DONOR ||
              user.role === UserRole.NGO ||
              user.role === UserRole.ADMIN) && (
            <ChatAssistant user={user} mode="embedded" />
          )}

          {currentPage === 'browse' && user.role === UserRole.NGO && (
            <NGOBrowse
              user={user}
              onClaim={() => setCurrentPage('requests')}
            />
          )}

          {currentPage === 'requests' && user.role === UserRole.NGO && (
            <NGORequests onScan={() => setCurrentPage('scan-qr')} />
          )}

          {currentPage === 'scan-qr' && user.role === UserRole.NGO && (
            <NGOScanQR
              onSuccess={() => setCurrentPage('requests')}
              onCancel={() => setCurrentPage('requests')}
            />
          )}

          {currentPage === 'manage-ngos' && user.role === UserRole.ADMIN && (
            <AdminNGOManagement />
          )}

          {currentPage === 'manage-donors' && user.role === UserRole.ADMIN && (
            <AdminDonorManagement />
          )}

          {currentPage === 'reports' && user.role === UserRole.ADMIN && (
            <AdminReports />
          )}

          {currentPage === 'priority-audit' && user.role === UserRole.ADMIN && (
            <AdminPriorityIntelligence />
          )}
        </DashboardLayout>
      );
    }

    return <LandingPage onStart={() => setCurrentPage('login')} />;
  };

  return (
    <div className="app-shell flex min-h-screen flex-col text-slate-900">
      {!useNativeMobileShell && (
        <Navbar user={user} onLogout={handleLogout} onNavigate={setCurrentPage} />
      )}

      <main className="flex-1">{renderContent()}</main>

      {!useNativeMobileShell && (
        <footer className="section-shell px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          <div className="glass-surface mx-auto grid max-w-[1440px] grid-cols-1 gap-10 rounded-[36px] px-6 py-8 sm:px-8 lg:grid-cols-4 lg:px-10 lg:py-10">
            <div className="space-y-5 lg:col-span-2">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a,#14926f)] text-white shadow-[0_18px_40px_-20px_rgba(15,23,42,0.5)]">
                  W
                </div>
                <div>
                  <span className="block text-xl font-black tracking-[-0.03em] text-slate-900">
                    WasteFoodLink
                  </span>
                  <span className="text-sm text-slate-500">
                    Elegant infrastructure for food rescue
                  </span>
                </div>
              </div>
              <p className="max-w-xl text-sm leading-7 text-slate-500">
                A cleaner digital layer for coordinating donors, NGOs, and administrators.
                Designed to reduce friction, surface the right actions, and turn food recovery
                into a calm, trustworthy workflow.
              </p>
              <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                <span className="rounded-full border border-slate-200 bg-white/70 px-4 py-2">Responsive</span>
                <span className="rounded-full border border-slate-200 bg-white/70 px-4 py-2">Minimal</span>
                <span className="rounded-full border border-slate-200 bg-white/70 px-4 py-2">Production-ready</span>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">Platform</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><button className="transition-colors hover:text-emerald-600">Impact Dashboard</button></li>
                <li><button className="transition-colors hover:text-emerald-600">Operational Analytics</button></li>
                <li><button className="transition-colors hover:text-emerald-600">Verification Flow</button></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">Support</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li>support@wastefoodlink.com</li>
                <li>Help Center</li>
                <li>Admin Console</li>
              </ul>
            </div>
          </div>
          <div className="mx-auto max-w-[1440px] px-2 pt-5 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} WasteFoodLink. All rights reserved.
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
