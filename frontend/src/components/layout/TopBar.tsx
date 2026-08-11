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
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { useNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';
import { SearchInput } from '../ui/SearchInput';

export function TopBar() {
  const { user, logout } = useAuth();
  const { unreadCount, toggleCenter } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [rates, setRates] = useState<{ usd: number; eur: number }>({ usd: 95.4, eur: 110.1 });

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

  // Live Exchange Rates
  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then((res) => res.json())
      .then((data) => {
        const inr = data.rates?.INR || 95.4;
        const eur = inr / (data.rates?.EUR || 0.86);
        setRates({ usd: inr, eur });
      })
      .catch(() => {
        setRates({ usd: 95.4, eur: 110.1 });
      });
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
        <div className="hidden md:flex items-center gap-2.5 px-2.5 py-1 bg-neutral-50/60 border border-border-gray rounded-[8px] text-caption font-mono text-ink">
          {time && (
            <div className="flex flex-col text-right leading-none">
              <span className="font-bold text-ink text-[12px] leading-none">{time}</span>
              <span className="text-[9px] font-semibold text-primary tracking-wider leading-none mt-0.5">{date}</span>
            </div>
          )}
          {time && (
            <span className="text-border-gray">|</span>
          )}
          <div className="flex items-center gap-2 text-[12px] leading-none">
            <span><strong className="text-silver-blue mr-0.5">USD</strong>₹{rates.usd.toFixed(1)}</span>
            <span className="text-border-gray">|</span>
            <span><strong className="text-silver-blue mr-0.5">EUR</strong>₹{rates.eur.toFixed(1)}</span>
          </div>
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
