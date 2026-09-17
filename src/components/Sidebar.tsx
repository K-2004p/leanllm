import React from 'react';
import { 
  LayoutDashboard, 
  History, 
  Sparkles, 
  Cpu, 
  Zap, 
  BookOpen, 
  TrendingUp, 
  Settings,
  ShieldCheck
} from 'lucide-react';
import { NavTab } from '../types';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  requestsCount: number;
}

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  requestsCount,
}) => {
  const navItems: NavItem[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'requests', label: 'History', icon: History, badge: requestsCount > 0 ? requestsCount : undefined },
    { id: 'optimization', label: 'Savings Features', icon: Sparkles },
    { id: 'models', label: 'AI Models', icon: Cpu },
    { id: 'cache', label: 'Fast Cache', icon: Zap },
    { id: 'rag', label: 'Knowledge Base', icon: BookOpen },
    { id: 'analytics', label: 'Savings Report', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 bg-[#0f172a] border-r border-[#334155]/60 flex flex-col justify-between select-none h-screen sticky top-0">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-5 border-b border-[#334155]/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-center text-emerald-400 font-bold text-base shadow-sm">
              ⚡
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>LeanLLM</span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                AI Cost &amp; Speed Optimizer
              </div>
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Live
          </span>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          <div className="px-3 pt-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${
                    isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-[#334155]/60 bg-[#0b1329] text-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">System Health</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Active &amp; Ready
          </span>
        </div>

        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div>
            <div>Mode</div>
            <div className="text-slate-200 font-semibold">Real AI Invocations</div>
          </div>
          <div className="text-right">
            <div>Optimization</div>
            <div className="text-emerald-400 font-semibold">Zero Hardcoding</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
