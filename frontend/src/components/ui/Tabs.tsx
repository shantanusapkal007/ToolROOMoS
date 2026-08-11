"use client";

import React from 'react';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  className?: string;
  ariaLabel?: string;
}

/**
 * Tabs / TabGroup Component matching ToolRoomOS Design System:
 * - Active State: solid `color.primary` fill, white text, subtle shadow.
 * - Inactive State: cool-gray text, hover background shift (`rgba(148,151,169,0.08)`), text ink on hover.
 * - Focus-Visible: 2px offset purple focus ring for keyboard navigation.
 */
export function Tabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = '',
  ariaLabel = 'Navigation Tabs',
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex items-center p-1 rounded-[10px] bg-white border border-border-gray gap-1 shadow-subtle overflow-x-auto select-none ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[8px] text-caption font-medium whitespace-nowrap transition-all duration-150 ease-in-out cursor-pointer ${
              isActive
                ? 'bg-primary text-white shadow-subtle font-semibold'
                : 'text-cool-gray hover:text-ink hover:bg-[rgba(148,151,169,0.08)]'
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {tab.icon && <span className="inline-flex shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-xs px-1.5 py-0.2 rounded-full font-mono font-medium ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-[rgba(148,151,169,0.12)] text-cool-gray group-hover:text-ink'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
