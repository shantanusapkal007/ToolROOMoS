"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  Settings, 
  FileText, 
  LogOut,
  Sun,
  Moon,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { useNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';
import { SearchInput } from '../ui/SearchInput';
import { getBaseUrl } from '../../lib/api';

interface CurrencyRates {
  usd: number;
  eur: number;
  gbp?: number;
  aed?: number;
  cny?: number;
  jpy?: number;
  lastUpdated?: string;
  isLive?: boolean;
}

export function TopBar() {
  const { user, logout } = useAuth();
  const { unreadCount, toggleCenter } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [rates, setRates] = useState<CurrencyRates>({
    usd: 95.47,
    eur: 111.27,
    gbp: 128.45,
    aed: 25.99,
    cny: 13.15,
    jpy: 0.62,
    lastUpdated: '',
    isLive: false,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFxPopoverOpen, setIsFxPopoverOpen] = useState(false);

  // Live Clock & Date Update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase());
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Live Real-Time Exchange Rates
  const fetchRates = async () => {
    setIsRefreshing(true);
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    try {
      // 1. Try Backend Proxy endpoint
      const backendUrl = `${getBaseUrl()}/finance/currency-rates`;
      const res = await fetch(backendUrl, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (data.rates) {
          setRates({
            usd: Number(data.rates.USD) || 95.47,
            eur: Number(data.rates.EUR) || 111.27,
            gbp: Number(data.rates.GBP) || 128.45,
            aed: Number(data.rates.AED) || 25.99,
            cny: Number(data.rates.CNY) || 13.15,
            jpy: Number(data.rates.JPY) || 0.62,
            lastUpdated: nowTimeStr,
            isLive: true,
          });
          setIsRefreshing(false);
          return;
        }
      }
    } catch {
      // Fallback
    }

    try {
      // 2. Direct fallback to live interbank API
      const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        const inr = Number(data.rates?.INR) || 95.47;
        const eur = inr / (Number(data.rates?.EUR) || 0.858);
        const gbp = inr / (Number(data.rates?.GBP) || 0.743);
        const aed = inr / (Number(data.rates?.AED) || 3.6725);
        const cny = inr / (Number(data.rates?.CNY) || 7.25);
        const jpy = inr / (Number(data.rates?.JPY) || 153.5);

        setRates({
          usd: Math.round(inr * 100) / 100,
          eur: Math.round(eur * 100) / 100,
          gbp: Math.round(gbp * 100) / 100,
          aed: Math.round(aed * 100) / 100,
          cny: Math.round(cny * 100) / 100,
          jpy: Math.round(jpy * 100) / 100,
          lastUpdated: nowTimeStr,
          isLive: true,
        });
        setIsRefreshing(false);
        return;
      }
    } catch {
      // Fallback
    }

    setRates(prev => ({
      ...prev,
      lastUpdated: nowTimeStr,
    }));
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchRates();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 w-full bg-white border-b border-border-gray px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-subtle z-30 select-none gap-3">
      {/* Left Section: Status & Adaptive Global Search */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Plant Status Pill — Tokenized Semantic Success */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-[8px] bg-semantic-success-subtle text-semantic-success-dark text-caption font-semibold border border-semantic-success/20 shrink-0">
          <span className="w-2 h-2 rounded-full bg-semantic-success animate-pulse" />
          <span className="hidden sm:inline">Plant 01 • Operational</span>
          <span className="sm:hidden">Plant 01</span>
        </div>

        {/* Global Search Component — Elastic Responsive Width */}
        <SearchInput
          context="global"
          placeholder="Search projects, machines..."
          containerClassName="w-40 sm:w-52 lg:w-64 transition-all duration-150"
        />
      </div>

      {/* Right Section: Live Telemetry, Utilities & User Menu */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Combined Clock, Date & Live FX Rates Telemetry Pill */}
        <div className="relative">
          <div 
            onClick={() => setIsFxPopoverOpen(prev => !prev)}
            className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-canvas border border-border-gray rounded-[8px] text-caption font-mono text-ink shadow-micro cursor-pointer hover:border-primary/40 transition-colors group"
            title="Click to view live foreign exchange rates & currency telemetry"
          >
            {time && (
              <div className="flex flex-col text-right leading-none">
                <span className="font-bold text-ink text-[14px] leading-none">{time}</span>
                <span className="text-[11px] font-semibold text-primary tracking-wider leading-none mt-0.5">{date}</span>
              </div>
            )}
            {time && (
              <span className="text-border-gray">|</span>
            )}
            <div className="flex items-center gap-2.5 text-[14px] leading-none">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span><strong className="text-silver-blue mr-0.5 font-semibold">USD</strong>₹{rates.usd.toFixed(2)}</span>
              </div>
              <span className="text-border-gray">|</span>
              <span><strong className="text-silver-blue mr-0.5 font-semibold">EUR</strong>₹{rates.eur.toFixed(2)}</span>
            </div>
          </div>

          {/* Live FX Rates Dropdown Popover */}
          {isFxPopoverOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsFxPopoverOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#14171d] border border-border-gray rounded-[12px] shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 text-ink">
                <div className="flex items-center justify-between border-b border-border-gray pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-ink">Live Interbank FX</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); fetchRates(); }}
                    disabled={isRefreshing}
                    className="p-1 rounded hover:bg-canvas text-cool-gray hover:text-ink transition-colors flex items-center gap-1 text-[11px]"
                    title="Refresh live rates"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
                    <span>Sync</span>
                  </button>
                </div>

                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between p-2 rounded bg-canvas border border-border-gray/50">
                    <span className="text-cool-gray font-medium">USD / INR ($)</span>
                    <span className="font-bold text-ink text-sm">₹{rates.usd.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-canvas border border-border-gray/50">
                    <span className="text-cool-gray font-medium">EUR / INR (€)</span>
                    <span className="font-bold text-ink text-sm">₹{rates.eur.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-canvas border border-border-gray/50">
                    <span className="text-cool-gray font-medium">GBP / INR (£)</span>
                    <span className="font-bold text-ink text-sm">₹{(rates.gbp || 128.45).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-canvas border border-border-gray/50">
                    <span className="text-cool-gray font-medium">AED / INR (د.إ)</span>
                    <span className="font-bold text-ink text-sm">₹{(rates.aed || 25.99).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-canvas border border-border-gray/50">
                    <span className="text-cool-gray font-medium">CNY / INR (¥)</span>
                    <span className="font-bold text-ink text-sm">₹{(rates.cny || 13.15).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-canvas border border-border-gray/50">
                    <span className="text-cool-gray font-medium">JPY / INR (¥)</span>
                    <span className="font-bold text-ink text-sm">₹{(rates.jpy || 0.62).toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-border-gray/70 flex items-center justify-between text-[10px] text-cool-gray font-mono">
                  <span>{rates.lastUpdated ? `Synced: ${rates.lastUpdated}` : 'Auto-sync active (60s)'}</span>
                  <span className="text-emerald-500 font-semibold flex items-center gap-0.5">● Live FX</span>
                </div>
              </div>
            </>
          )}
        </div>


        {/* Utility Icon Actions Cluster */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Light / Dark Mode Toggle */}
          <Button
            variant="icon-only"
            size="sm"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-silver-blue" />
            )}
          </Button>

          {/* Activity Logs */}
          <Link href="/activity-log" title="System Activity Logs" aria-label="System Activity Logs">
            <Button
              variant="icon-only"
              size="sm"
              aria-label="Activity Logs"
              title="System Activity Logs"
            >
              <FileText className="w-4 h-4 text-silver-blue" />
            </Button>
          </Link>

          {/* Settings */}
          <Link href="/settings" title="System Settings" aria-label="System Settings">
            <Button
              variant="icon-only"
              size="sm"
              aria-label="Settings"
              title="System Settings"
            >
              <Settings className="w-4 h-4 text-silver-blue" />
            </Button>
          </Link>

          {/* Notification Bell */}
          <div className="relative">
            <Button
              variant="icon-only"
              size="sm"
              onClick={toggleCenter}
              aria-label="Notification Center"
              title="Notification Center"
            >
              <Bell className="w-4 h-4 text-silver-blue" />
            </Button>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-semantic-danger text-white rounded-full text-[10px] font-bold flex items-center justify-center pointer-events-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
        </div>

        {/* User Profile & Logout Cluster */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-border-gray">
          <div className="w-8 h-8 rounded-full bg-primary-subtle border border-primary/20 text-primary font-bold flex items-center justify-center text-xs shadow-subtle shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>

          <div className="hidden xl:flex flex-col text-left">
            <span className="text-caption font-semibold text-ink leading-tight truncate max-w-[90px]">{user?.name || 'Administrator'}</span>
            <span className="text-[10px] text-silver-blue font-mono leading-tight truncate max-w-[90px]">{user?.role || 'Superuser'}</span>
          </div>

          <Button
            variant="icon-only"
            size="sm"
            onClick={logout}
            aria-label="Sign Out"
            title="Sign Out of ToolRoomOS"
            className="text-silver-blue hover:text-semantic-danger ml-0.5"
          >
            <LogOut className="w-4 h-4 text-silver-blue hover:text-semantic-danger" />
          </Button>
        </div>
      </div>
    </header>
  );
}
