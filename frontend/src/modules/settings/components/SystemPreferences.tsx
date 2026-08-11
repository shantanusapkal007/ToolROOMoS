"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
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
      <div className="h-full flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-caption text-silver-blue font-semibold uppercase tracking-wider">Loading Preferences...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative min-h-0">
      <div className="flex items-center justify-between p-5 border-b border-border-gray shrink-0 bg-white">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[10px] bg-primary-subtle text-primary flex items-center justify-center border border-primary/20 shadow-subtle">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-section-heading font-bold text-ink tracking-tight">System Preferences</h2>
            <p className="text-caption text-silver-blue">Configure global OS behavior, notification alerts, and automated maintenance backups.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 hide-scrollbar bg-[#fbfbfd]">
        <div className="max-w-3xl space-y-6">
          
          <div className="border border-border-gray p-5 rounded-[12px] bg-white shadow-subtle space-y-3">
            <h3 className="text-body font-bold text-ink border-b border-border-gray pb-3">Notifications & Alerts</h3>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-bold text-caption text-ink">Email Notifications</p>
                <p className="text-small text-silver-blue">Send critical system alerts and milestone notifications via email.</p>
              </div>
              <Toggle checked={preferences.emailNotifications} onChange={() => togglePref('emailNotifications')} />
            </div>
            
            <div className="flex items-center justify-between py-2 border-t border-border-gray">
              <div>
                <p className="font-bold text-caption text-ink">Slack Integration</p>
                <p className="text-small text-silver-blue">Push shopfloor job card and breakdown events to Slack channels.</p>
              </div>
              <Toggle checked={preferences.slackIntegration} onChange={() => togglePref('slackIntegration')} />
            </div>
          </div>

          <div className="border border-border-gray p-5 rounded-[12px] bg-white shadow-subtle space-y-3">
            <h3 className="text-body font-bold text-ink border-b border-border-gray pb-3">System Maintenance</h3>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-bold text-caption text-ink">Automated Backups</p>
                <p className="text-small text-silver-blue">Run daily database snapshots and store to cloud archive.</p>
              </div>
              <Toggle checked={preferences.autoBackup} onChange={() => togglePref('autoBackup')} />
            </div>
            
            <div className="flex items-center justify-between py-2 border-t border-border-gray">
              <div>
                <p className="font-bold text-caption text-semantic-danger-dark">Maintenance Mode</p>
                <p className="text-small text-silver-blue">Lock out all non-admin users for scheduled system maintenance.</p>
              </div>
              <Toggle checked={preferences.maintenanceMode} onChange={() => togglePref('maintenanceMode')} danger />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="primary" size="md" onClick={handleSave} isLoading={isSaving}>
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
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out ${
        checked 
          ? danger ? 'bg-semantic-danger' : 'bg-primary' 
          : 'bg-[#dedee5]'
      }`}
    >
      <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-subtle transition duration-200 ease-in-out ${
        checked ? 'translate-x-2' : '-translate-x-2'
      }`} />
    </button>
  );
};
