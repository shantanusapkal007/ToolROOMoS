"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Save, Bell, Shield, Database, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { api } from '../../../lib/api';

export const SystemPreferences = () => {
  const { success, error } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    slackIntegration: false,
    autoBackup: true,
    maintenanceMode: false,
  });

  useEffect(() => {
    let isMounted = true;
    async function loadPrefs() {
      try {
        setIsLoading(true);
        const res: any = await api.get('settings/preferences');
        const data = res.data || res;
        if (isMounted && data && typeof data === 'object') {
          setPreferences(prev => ({
            ...prev,
            ...(data.emailNotifications !== undefined && { emailNotifications: Boolean(data.emailNotifications) }),
            ...(data.slackIntegration !== undefined && { slackIntegration: Boolean(data.slackIntegration) }),
            ...(data.autoBackup !== undefined && { autoBackup: Boolean(data.autoBackup) }),
            ...(data.maintenanceMode !== undefined && { maintenanceMode: Boolean(data.maintenanceMode) }),
          }));
        }
      } catch (err) {
        console.error('Failed to load system preferences from backend', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadPrefs();
    return () => { isMounted = false; };
  }, []);

  const togglePref = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post('settings/preferences', { preferences });
      success('Preferences Updated', 'System preferences saved successfully!');
    } catch (err: any) {
      console.error('Failed to save preferences', err);
      if (err?.status === 403 || err?.response?.status === 403) {
        error('Access Denied', 'Admin privileges are required to modify system settings.');
      } else {
        error('Update Failed', 'Failed to save system preferences to backend.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-12 space-y-2">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        <span className="ml-3 text-xs text-cool-gray font-semibold uppercase tracking-wider">Loading Preferences...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative min-h-0 bg-[#fbfbfd]">
      <div className="flex items-center justify-between p-5 border-b border-border-gray shrink-0 bg-white">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-subtle shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sub-heading font-bold text-ink tracking-tight">System Preferences & Automations</h2>
            <p className="text-caption text-cool-gray mt-0.5">
              Configure global OS triggers, real-time event webhooks, and automated maintenance protocols.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0">
        <div className="max-w-4xl space-y-6">
          
          {/* Notifications Card */}
          <div className="border border-border-gray p-6 rounded-[12px] bg-white shadow-subtle space-y-4">
            <div className="flex items-center gap-2 border-b border-border-gray pb-3">
              <Bell className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-ink">Notifications & Event Alerts</h3>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-bold text-xs text-ink">Automated Email Notifications</p>
                <p className="text-[11px] text-cool-gray mt-0.5">Send critical PO approvals, GRN receipts, and stage completion alerts via email.</p>
              </div>
              <Toggle checked={preferences.emailNotifications} onChange={() => togglePref('emailNotifications')} />
            </div>
            
            <div className="flex items-center justify-between py-2 border-t border-border-gray/70">
              <div>
                <p className="font-bold text-xs text-ink">Slack & Teams Webhook Integration</p>
                <p className="text-[11px] text-cool-gray mt-0.5">Broadcast shop floor breakdown alarms and dispatch gates to communication channels.</p>
              </div>
              <Toggle checked={preferences.slackIntegration} onChange={() => togglePref('slackIntegration')} />
            </div>
          </div>

          {/* Maintenance & Backups Card */}
          <div className="border border-border-gray p-6 rounded-[12px] bg-white shadow-subtle space-y-4">
            <div className="flex items-center gap-2 border-b border-border-gray pb-3">
              <Database className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-ink">Database & Maintenance Governance</h3>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-bold text-xs text-ink">Automated Daily Database Snapshots</p>
                <p className="text-[11px] text-cool-gray mt-0.5">Perform incremental PostgreSQL backups and synchronize with MinIO bucket storage.</p>
              </div>
              <Toggle checked={preferences.autoBackup} onChange={() => togglePref('autoBackup')} />
            </div>
            
            <div className="flex items-center justify-between py-2 border-t border-border-gray/70">
              <div>
                <p className="font-bold text-xs text-rose-700">Maintenance Lockdown Mode</p>
                <p className="text-[11px] text-cool-gray mt-0.5">Restricts access to System Administrators only during schema migrations or audits.</p>
              </div>
              <Toggle checked={preferences.maintenanceMode} onChange={() => togglePref('maintenanceMode')} danger />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSaving} className="h-9 px-5 font-semibold text-xs shadow-subtle">
              <Save className="w-4 h-4 mr-1.5" />
              <span>Apply Preferences</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Toggle = ({ checked, onChange, danger = false }: { checked: boolean, onChange: () => void, danger?: boolean }) => {
  return (
    <button 
      onClick={onChange}
      type="button"
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out ${
        checked 
          ? danger ? 'bg-rose-600' : 'bg-primary' 
          : 'bg-slate-300'
      }`}
    >
      <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-subtle transition duration-200 ease-in-out ${
        checked ? 'translate-x-2' : '-translate-x-2'
      }`} />
    </button>
  );
};
