"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Bell, 
  Settings, 
  FileText, 
  LogOut, 
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { useNotifications } from '../../context/NotificationContext';
import { Button } from '../ui/Button';

export function TopBar() {
  const { user, logout } = useAuth();
  const { unreadCount, toggleCenter } = useNotifications();
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [rates, setRates] = useState<{ usd: number; eur: number } | null>(null);

  // Live Clock Update
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

  const triggerCommandPalette = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
  };

  return (
    <header className="h-14 w-full bg-white border-b border-border-gray px-6 flex items-center justify-between shrink-0 shadow-subtle z-30 select-none">
      {/* Left Section: Status & Quick Search */}
      <div className="flex items-center gap-3">
        {/* Plant Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-[8px] bg-[rgba(20,158,97,0.12)] text-[#026b3f] text-caption font-semibold">
          <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
          <span>Plant 01 • Operational</span>
        </div>

        {/* Global Search Button */}
        <button
          onClick={triggerCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[rgba(148,151,169,0.06)] hover:bg-[rgba(148,151,169,0.12)] border border-border-gray text-caption text-silver-blue hover:text-ink transition-colors cursor-pointer"
          title="Search anything (Cmd+K)"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Search projects, machines, tools...</span>
          <span className="md:hidden">Search...</span>
          <kbd className="font-mono text-[10px] bg-white border border-border-gray px-1.5 py-0.5 rounded shadow-subtle text-cool-gray">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Section: Time, FX, Logs, Settings, Notifications, User & Logout */}
      <div className="flex items-center gap-3">
        {/* Clock Widget */}
        {time && (
          <div className="hidden lg:flex flex-col text-right px-2.5 py-1 bg-[rgba(148,151,169,0.04)] border border-border-gray rounded-[8px]">
            <span className="text-caption font-bold font-mono text-ink leading-none">{time}</span>
            <span className="text-[10px] font-semibold text-primary font-mono tracking-wider leading-none mt-0.5">{date}</span>
          </div>
        )}

        {/* FX Rates */}
        {rates && (
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 bg-[rgba(148,151,169,0.04)] border border-border-gray rounded-[8px] text-caption font-mono text-ink">
            <span><strong className="text-silver-blue mr-1">USD</strong>₹{rates.usd.toFixed(1)}</span>
            <span className="text-border-gray">|</span>
            <span><strong className="text-silver-blue mr-1">EUR</strong>₹{rates.eur.toFixed(1)}</span>
          </div>
        )}

        {/* Activity Logs Button */}
        <Link
          href="/activity-log"
          className="h-9 px-3 rounded-[10px] text-cool-gray hover:text-ink hover:bg-[rgba(148,151,169,0.08)] flex items-center gap-1.5 transition-colors cursor-pointer border border-border-gray shadow-subtle text-caption font-medium"
          title="System Activity Logs"
        >
          <FileText className="w-4 h-4 text-silver-blue" />
          <span className="hidden sm:inline">Activity Logs</span>
        </Link>

        {/* Settings Button */}
        <Link
          href="/settings"
          className="h-9 px-3 rounded-[10px] text-cool-gray hover:text-ink hover:bg-[rgba(148,151,169,0.08)] flex items-center gap-1.5 transition-colors cursor-pointer border border-border-gray shadow-subtle text-caption font-medium"
          title="System Settings"
        >
          <Settings className="w-4 h-4 text-silver-blue" />
          <span className="hidden sm:inline">Settings</span>
        </Link>

        {/* Notification Bell */}
        <button
          onClick={toggleCenter}
          className="relative h-9 w-9 rounded-[10px] text-cool-gray hover:text-ink hover:bg-[rgba(148,151,169,0.08)] flex items-center justify-center transition-colors cursor-pointer border border-border-gray shadow-subtle"
          title="Notification Center"
        >
          <Bell className="w-4 h-4 text-silver-blue" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-accent-red text-white rounded-full text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-border-gray">
          <div className="w-8 h-8 rounded-full bg-primary-subtle border border-primary/20 text-primary font-bold flex items-center justify-center text-xs shadow-subtle">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>

          <div className="hidden 2xl:flex flex-col text-left">
            <span className="text-caption font-semibold text-ink leading-tight truncate max-w-[100px]">{user?.name || 'Administrator'}</span>
            <span className="text-[10px] text-silver-blue font-mono leading-tight truncate max-w-[100px]">{user?.role || 'Superuser'}</span>
          </div>

          <Button
            variant="white"
            size="sm"
            onClick={logout}
            title="Sign Out of ToolRoomOS"
            className="hover:text-accent-red ml-1"
          >
            <LogOut className="w-4 h-4 mr-1 text-silver-blue hover:text-accent-red" />
            <span className="hidden md:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
