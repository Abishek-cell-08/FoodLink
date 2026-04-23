import React from 'react';
import { User, UserRole } from '../types';
import ChatAssistant from './ChatAssistant';
import { isNativeAppShell } from '../utils/platform';

interface SidebarItemProps {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  label,
  icon,
  active,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all duration-300 ${
      active
        ? 'bg-white text-emerald-700 font-semibold shadow-[0_16px_32px_-24px_rgba(16,185,129,0.9)] ring-1 ring-emerald-100'
        : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const OverviewIcon = ({ active }: { active: boolean }) => (
  <svg
    className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-slate-400'}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const DonationsIcon = ({ active }: { active: boolean }) => (
  <svg
    className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-slate-400'}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const AddDonationIcon = ({ active }: { active: boolean }) => (
  <svg
    className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-400'}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path d="M12 4v16m8-8H4" />
  </svg>
);

const AiIcon = ({ active }: { active: boolean }) => (
  <svg
    className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-slate-400'}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path d="M12 3l1.9 4.6L18 9.5l-4.1 1.6L12 16l-1.9-4.9L6 9.5l4.1-1.9L12 3zM19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16zM5 14l.9 2.1L8 17l-2.1.9L5 20l-.9-2.1L2 17l2.1-.9L5 14z" />
  </svg>
);

const BrowseIcon = ({ active }: { active: boolean }) => (
  <svg
    className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-slate-400'}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const RequestsIcon = ({ active }: { active: boolean }) => (
  <svg
    className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-slate-400'}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const ScanIcon = ({ active }: { active: boolean }) => (
  <svg
    className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-400'}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path d="M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zM12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01" />
  </svg>
);

const NgoManageIcon = ({ active }: { active: boolean }) => (
  <svg
    className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-slate-400'}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const DonorManageIcon = ({ active }: { active: boolean }) => (
  <svg
    className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-slate-400'}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path d="M5.121 17.804A7 7 0 0112 15a7 7 0 016.879 2.804M15 9a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ReportsIcon = ({ active }: { active: boolean }) => (
  <svg
    className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-slate-400'}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const AuditIcon = ({ active }: { active: boolean }) => (
  <svg
    className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-400'}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path d="M11 5h2m-1 0v14m-7-4h14M5 9h14" />
  </svg>
);

const MobileTabBar: React.FC<{
  role: UserRole;
  activePage: string;
  onNavigate: (page: string) => void;
}> = ({ role, activePage, onNavigate }) => {
  const donorItems = [
    {
      key: 'dashboard',
      label: 'Overview',
      icon: <OverviewIcon active={activePage === 'dashboard'} />,
    },
    {
      key: 'my-donations',
      label: 'Donations',
      icon: <DonationsIcon active={activePage === 'my-donations'} />,
    },
    {
      key: 'add-donation',
      label: 'New',
      icon: <AddDonationIcon active={activePage === 'add-donation'} />,
    },
    {
      key: 'ai',
      label: 'AI',
      icon: <AiIcon active={activePage === 'ai'} />,
    },
  ];

  const ngoItems = [
    {
      key: 'dashboard',
      label: 'Overview',
      icon: <OverviewIcon active={activePage === 'dashboard'} />,
    },
    {
      key: 'browse',
      label: 'Browse',
      icon: <BrowseIcon active={activePage === 'browse'} />,
    },
    {
      key: 'requests',
      label: 'Requests',
      icon: <RequestsIcon active={activePage === 'requests'} />,
    },
    {
      key: 'scan-qr',
      label: 'Scan',
      icon: <ScanIcon active={activePage === 'scan-qr'} />,
    },
    {
      key: 'ai',
      label: 'AI',
      icon: <AiIcon active={activePage === 'ai'} />,
    },
  ];

  const adminItems = [
    {
      key: 'dashboard',
      label: 'Overview',
      icon: <OverviewIcon active={activePage === 'dashboard'} />,
    },
    {
      key: 'manage-donors',
      label: 'Donors',
      icon: <DonorManageIcon active={activePage === 'manage-donors'} />,
    },
    {
      key: 'manage-ngos',
      label: 'NGOs',
      icon: <NgoManageIcon active={activePage === 'manage-ngos'} />,
    },
    {
      key: 'reports',
      label: 'Reports',
      icon: <ReportsIcon active={activePage === 'reports'} />,
    },
    {
      key: 'priority-audit',
      label: 'Audit',
      icon: <AuditIcon active={activePage === 'priority-audit'} />,
    },
    {
      key: 'ai',
      label: 'AI',
      icon: <AiIcon active={activePage === 'ai'} />,
    },
  ];

  const items =
    role === UserRole.NGO
      ? ngoItems
      : role === UserRole.ADMIN
        ? adminItems
        : donorItems;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 pb-4 pt-2.5 shadow-[0_-18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-4">
      <div className="mx-auto max-w-md overflow-x-auto pb-1">
        <div className="flex min-w-max items-center gap-1.5 rounded-[24px] bg-slate-950 px-1.5 py-1.5">
        {items.map((item) => {
          const active = activePage === item.key;
          const isPrimary = item.key === 'add-donation' || item.key === 'scan-qr';

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              className={`flex min-h-[60px] min-w-[64px] flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-2 text-[10px] font-semibold transition-all ${
                isPrimary
                  ? active
                    ? 'bg-emerald-500 text-white shadow-[0_12px_24px_rgba(16,185,129,0.35)]'
                    : 'bg-white/8 text-slate-300'
                  : active
                    ? 'bg-white text-emerald-700'
                    : 'text-slate-400'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );
};

const DashboardLayout: React.FC<{
  user: User;
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}> = ({ user, children, activePage, onNavigate, onLogout }) => {
  const useNativeMobileShell =
    isNativeAppShell() &&
    (user.role === UserRole.DONOR ||
      user.role === UserRole.NGO ||
      user.role === UserRole.ADMIN);

  const mobileItems =
    user.role === UserRole.NGO
      ? ['dashboard', 'browse', 'requests', 'scan-qr', 'ai']
      : user.role === UserRole.ADMIN
        ? ['dashboard', 'manage-donors', 'manage-ngos', 'reports', 'priority-audit', 'ai']
        : ['dashboard', 'my-donations', 'add-donation', 'ai'];

  if (useNativeMobileShell) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#eef7f2_100%)]">
        <header className="sticky top-0 z-30 border-b border-white/70 bg-white/85 px-4 pb-3.5 pt-4 backdrop-blur-xl sm:px-5 sm:pb-4 sm:pt-5">
          <div className="mx-auto flex max-w-md items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600 sm:text-[11px]">
                {user.role === UserRole.NGO
                  ? 'NGO App'
                  : user.role === UserRole.ADMIN
                    ? 'Admin App'
                    : 'Donor App'}
              </div>
              <div className="mt-1 text-lg font-black text-slate-950 sm:text-xl">
                Welcome, {user.name.split(' ')[0]}
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600 shadow-sm"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="mx-auto flex min-h-[calc(100vh-5.5rem)] max-w-md flex-col px-3.5 pb-24 pt-3.5 sm:px-4 sm:pb-28 sm:pt-4">
          {children}
        </main>

        <MobileTabBar
          role={user.role}
          activePage={mobileItems.includes(activePage) ? activePage : mobileItems[0]}
          onNavigate={onNavigate}
        />
      </div>
    );
  }

  return (
    <>
      <div className="section-shell mx-auto flex w-full max-w-[1480px] gap-6 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <aside className="glass-surface sticky top-[108px] hidden h-[calc(100vh-140px)] w-[300px] shrink-0 flex-col overflow-hidden rounded-[32px] p-4 lg:flex">
          <div className="rounded-[24px] bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(18,85,70,0.94))] p-5 text-white">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-200">
              {user.role} workspace
            </div>
            <div className="mt-3 text-2xl font-black tracking-[-0.04em]">
              {user.name}
            </div>
            <div className="mt-2 text-sm leading-6 text-slate-300">
              Focused, full-width operations with a cleaner navigation layer.
            </div>
          </div>

          <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
          <SidebarItem
            label="Overview"
            active={activePage === 'dashboard'}
            onClick={() => onNavigate('dashboard')}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            }
          />
          {user.role === UserRole.DONOR && (
            <>
              <SidebarItem
                label="My Donations"
                active={activePage === 'my-donations'}
                onClick={() => onNavigate('my-donations')}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                }
              />
              <SidebarItem
                label="New Donation"
                active={activePage === 'add-donation'}
                onClick={() => onNavigate('add-donation')}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 4v16m8-8H4" />
                  </svg>
                }
              />
            </>
          )}
          {user.role === UserRole.NGO && (
            <>
              <SidebarItem
                label="Browse Food"
                active={activePage === 'browse'}
                onClick={() => onNavigate('browse')}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
              <SidebarItem
                label="Active Requests"
                active={activePage === 'requests'}
                onClick={() => onNavigate('requests')}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
              />
            </>
          )}
          {user.role === UserRole.ADMIN && (
            <>
              <SidebarItem
                label="Donor Directory"
                active={activePage === 'manage-donors'}
                onClick={() => onNavigate('manage-donors')}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5.121 17.804A7 7 0 0112 15a7 7 0 016.879 2.804M15 9a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              />
              <SidebarItem
                label="NGO Management"
                active={activePage === 'manage-ngos'}
                onClick={() => onNavigate('manage-ngos')}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
              />
              <SidebarItem
                label="Impact Reports"
                active={activePage === 'reports'}
                onClick={() => onNavigate('reports')}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              />
              <SidebarItem
                label="Priority Audit"
                active={activePage === 'priority-audit'}
                onClick={() => onNavigate('priority-audit')}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M11 5h2m-1 0v14m-7-4h14M5 9h14" />
                  </svg>
                }
              />
            </>
          )}
          </div>

          <div className="mt-4 rounded-[24px] border border-white/70 bg-white/70 p-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Session
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-900">
              Signed in as {user.role.toLowerCase()}
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950"
            >
              Logout
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="page-fade min-h-[calc(100vh-160px)]">{children}</div>
        </main>
      </div>

      <ChatAssistant user={user} />
    </>
  );
};

export default DashboardLayout;
