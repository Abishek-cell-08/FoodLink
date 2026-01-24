
import React from 'react';
import { Button, Card } from './UI';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';

interface AdminOverviewProps {
  onViewReports: () => void;
  onManageNGOs: () => void;
}

const AdminOverview: React.FC<AdminOverviewProps> = ({ onViewReports, onManageNGOs }) => {
  const miniData = [
    { name: 'M', val: 40 }, { name: 'T', val: 30 }, { name: 'W', val: 60 },
    { name: 'T', val: 45 }, { name: 'F', val: 70 }, { name: 'S', val: 85 }, { name: 'S', val: 90 }
  ];

  const alerts = [
    { type: 'CRITICAL', msg: '3 donations in Sector 5 expiring within 45 mins.', time: 'Just now' },
    { type: 'WARNING', msg: 'NGO "Community Kitchen" fulfillment rate dropped below 70%.', time: '12m ago' },
    { type: 'INFO', msg: 'High demand surge detected in West Side Corporate Hub.', time: '1h ago' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">System Health</h2>
          <p className="text-slate-500 text-sm">Real-time platform monitoring and proactive risk management</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onManageNGOs}>Audit NGOs</Button>
          <Button size="sm" onClick={onViewReports}>Full Reports</Button>
        </div>
      </div>

      {/* Real-time KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Saved (Today)', val: '142 kg', change: '+8%', color: 'emerald' },
          { label: 'Live Requests', val: '18', change: 'Active', color: 'indigo' },
          { label: 'Avg Pickup (Live)', val: '38m', change: '-4m', color: 'blue' },
          { label: 'System Fulfillment', val: '92.4%', change: 'Stable', color: 'orange' }
        ].map((stat, i) => (
          <Card key={i} className="p-5 border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</div>
            <div className="text-2xl font-black text-slate-900">{stat.val}</div>
            <div className={`text-[10px] font-bold mt-2 ${stat.change.startsWith('+') || stat.change === 'Active' ? 'text-emerald-600' : 'text-slate-500'}`}>
              {stat.change}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Proactive Alerts Panel */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            Critical System Flags
          </h3>
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <div key={i} className={`p-4 rounded-xl border flex items-start gap-4 transition-all hover:translate-x-1 ${
                alert.type === 'CRITICAL' ? 'bg-red-50 border-red-100 text-red-900' : 
                alert.type === 'WARNING' ? 'bg-amber-50 border-amber-100 text-amber-900' : 
                'bg-blue-50 border-blue-100 text-blue-900'
              }`}>
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                  alert.type === 'CRITICAL' ? 'bg-red-500' : alert.type === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1 text-sm font-medium">{alert.msg}</div>
                <div className="text-[10px] font-bold opacity-60 uppercase whitespace-nowrap">{alert.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mini Preview Charts */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-slate-900">Fulfillment Trend</h4>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">↑ 12%</span>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={miniData}>
                  <defs>
                    <linearGradient id="colAdmin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="val" stroke="#10b981" fillOpacity={1} fill="url(#colAdmin)" strokeWidth={2} />
                  <Tooltip hide />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Weekly View</span>
              <button onClick={onViewReports} className="text-[10px] font-bold text-emerald-600 hover:underline">Full Analytics →</button>
            </div>
          </Card>

          <Card className="p-6 bg-slate-50 border-dashed border-slate-300">
             <div className="text-center py-4 space-y-2">
                <div className="text-xs font-bold text-slate-500">System Capacity</div>
                <div className="text-3xl font-black text-slate-400">84%</div>
                <p className="text-[10px] text-slate-400 px-4">NGO bandwidth is reaching peak in Eastern sectors.</p>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
