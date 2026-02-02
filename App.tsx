
import React, { useState } from 'react';
import { User, UserRole } from './types';
import Navbar from './components/Navbar';
import DashboardLayout from './components/DashboardLayout';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import AdminOverview from './components/Admin/AdminOverview';
import AdminReports from './components/Admin/AdminReports';
import AdminNGOManagement from './components/Admin/AdminNGOManagement';
import DonorOverview from './components/Donor/DonorOverview';
import DonorDonations from './components/Donor/DonorDonations';
import NGOOverview from './components/NGO/NGOOverview';
import NGOBrowse from './components/NGO/NGOBrowse';
import NGORequests from './components/NGO/NGORequests';
import AddFoodForm from './components/Donor/AddFoodForm';

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
          {/* Dashboard Main Entry Point */}
          {currentPage === 'dashboard' && (
            user.role === UserRole.ADMIN ? (
              <AdminOverview 
                onViewReports={() => setCurrentPage('reports')} 
                onManageNGOs={() => setCurrentPage('manage-ngos')} 
              />
            ) : 
            user.role === UserRole.DONOR ? (
              <DonorOverview 
                onAddClick={() => setCurrentPage('add-donation')} 
                onViewAll={() => setCurrentPage('my-donations')} 
              />
            ) : 
            <NGOOverview user={user} onBrowse={() => setCurrentPage('browse')} />
          )}
          
          {/* Donor Routes */}
          {currentPage === 'my-donations' && user.role === UserRole.DONOR && (
            <DonorDonations onAddClick={() => setCurrentPage('add-donation')} />
          )}
          {currentPage === 'add-donation' && user.role === UserRole.DONOR && (
            <AddFoodForm onCancel={() => setCurrentPage('dashboard')} />
          )}
          
          {/* NGO Routes */}
          {currentPage === 'browse' && user.role === UserRole.NGO && (
            <NGOBrowse user={user} onClaim={(id) => setCurrentPage('requests')} />
          )}
          {currentPage === 'requests' && user.role === UserRole.NGO && (
            <NGORequests onScan={() => alert('Camera requested for scanning QR...')} />
          )}
          
          {/* Admin Routes */}
          {currentPage === 'manage-ngos' && user.role === UserRole.ADMIN && (
            <AdminNGOManagement />
          )}
          {currentPage === 'reports' && user.role === UserRole.ADMIN && (
            <AdminReports />
          )}
        </DashboardLayout>
      );
    }
    
    return <LandingPage onStart={() => setCurrentPage('login')} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
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
