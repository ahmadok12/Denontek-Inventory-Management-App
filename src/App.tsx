import React, { useState } from 'react';
import { Home, BarChart2, Settings, Smartphone, Maximize2 } from 'lucide-react';
import type { TabType } from './types';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { HomeScreen } from './components/home/HomeScreen';
import { ReportsScreen } from './components/reports/ReportsScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);

  const { components, isComponentBelowReorder } = useInventory();
  const lowStockCount = components.filter((c) => isComponentBelowReorder(c.id)).length;

  const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'reports', label: 'Reports', icon: BarChart2, badge: lowStockCount > 0 ? lowStockCount : undefined },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-200/90 flex flex-col items-center justify-center sm:p-4 text-slate-900 font-sans">
      {/* Frame / Desktop Viewport Controller */}
      <div className="hidden sm:flex items-center gap-3 mb-3 text-xs text-slate-600 bg-white/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-300/80 shadow-xs">
        <span className="font-semibold text-slate-700">Denontek Mobile Simulator</span>
        <span className="text-slate-300">|</span>
        <button
          type="button"
          onClick={() => setIsPhoneFrame(!isPhoneFrame)}
          className="inline-flex items-center gap-1.5 font-medium hover:text-slate-900 cursor-pointer transition-colors"
        >
          {isPhoneFrame ? (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Expand to Fullscreen</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5 text-slate-500" />
              <span>Mobile Phone Frame</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container (Mobile Viewport) */}
      <div
        className={`w-full bg-white flex flex-col overflow-hidden transition-all duration-300 ${
          isPhoneFrame
            ? 'sm:max-w-[420px] sm:h-[860px] sm:rounded-[44px] sm:shadow-2xl sm:border-[10px] sm:border-slate-850 sm:ring-1 sm:ring-black/10'
            : 'max-w-md h-[100dvh] shadow-lg'
        } h-[100dvh]`}
      >


        {/* Tab Content Area */}
        <main className="flex-1 overflow-hidden relative flex flex-col">
          {activeTab === 'home' && <HomeScreen />}
          {activeTab === 'reports' && <ReportsScreen />}
          {activeTab === 'settings' && <SettingsScreen />}
        </main>

        {/* Bottom Navigation Bar */}
        <nav className="bg-white border-t border-slate-200/80 px-4 py-2 flex items-center justify-around shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1 px-4 rounded-xl transition-all cursor-pointer relative ${
                  isActive
                    ? 'text-slate-950 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-600 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                  {tab.badge && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-3.5 h-3.5 px-1 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-1 tracking-tight">
                  {tab.label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 bg-slate-900 rounded-full mt-0.5" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <InventoryProvider>
      <MainApp />
    </InventoryProvider>
  );
}
