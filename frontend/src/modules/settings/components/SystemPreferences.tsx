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
    projectNumberPrefix: 'KTD-',
    projectStartingNumber: 1,
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
            ...(data.projectNumberPrefix !== undefined && { projectNumberPrefix: String(data.projectNumberPrefix) }),
            ...(data.projectStartingNumber !== undefined && { projectStartingNumber: Number(data.projectStartingNumber) }),
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
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black/10"></div>
        <span className="ml-3 text-sm text-zinc-500 font-bold uppercase tracking-widest">Loading Preferences...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-6 border-b border-black/10 shrink-0 bg-black/5">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mr-4 border border-orange-500/20">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">System Preferences</h2>
            <p className="text-sm text-zinc-500">Configure global OS behavior and project numbering setup.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 hide-scrollbar">
        <div className="max-w-3xl space-y-8">

          {/* Project Numbering Configuration Card */}
          <div className="space-y-4 border border-black/10 p-6 rounded-2xl bg-[#F4F4F6]/50 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
            <h3 className="text-lg font-semibold text-zinc-900 border-b border-black/10 pb-4 mb-4">Project Numbering Setup</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-caption font-semibold text-zinc-800 mb-1">Project Number Prefix</label>
                <input 
                  type="text"
                  value={preferences.projectNumberPrefix}
                  onChange={(e) => setPreferences(prev => ({ ...prev, projectNumberPrefix: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-caption bg-white font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. KTD-"
                />
                <p className="text-micro text-zinc-500 mt-1">Default prefix attached to newly initialized projects.</p>
              </div>

              <div>
                <label className="block text-caption font-semibold text-zinc-800 mb-1">Starting / Next Project Number</label>
                <input 
                  type="number"
                  min="1"
                  value={preferences.projectStartingNumber}
                  onChange={(e) => setPreferences(prev => ({ ...prev, projectStartingNumber: parseInt(e.target.value, 10) || 1 }))}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-caption bg-white font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 33"
                />
                <p className="text-micro text-zinc-500 mt-1">Set to 33 to start project sequence from KTD-33.</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 border border-black/10 p-6 rounded-2xl bg-[#F4F4F6]/50 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
            <h3 className="text-lg font-semibold text-zinc-900 border-b border-black/10 pb-4 mb-4">Notifications</h3>
            
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-zinc-900">Email Notifications</p>
                <p className="text-sm text-zinc-500">Send system alerts via email.</p>
              </div>
              <Toggle checked={preferences.emailNotifications} onChange={() => togglePref('emailNotifications')} />
            </div>
            
            <div className="flex items-center justify-between py-3 border-t border-black/5">
              <div>
                <p className="font-medium text-zinc-900">Slack Integration</p>
                <p className="text-sm text-zinc-500">Push workflow events to Slack channels.</p>
              </div>
              <Toggle checked={preferences.slackIntegration} onChange={() => togglePref('slackIntegration')} />
            </div>
          </div>

          <div className="space-y-4 border border-black/10 p-6 rounded-2xl bg-[#F4F4F6]/50 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
            <h3 className="text-lg font-semibold text-zinc-900 border-b border-black/10 pb-4 mb-4">System Maintenance</h3>
            
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-zinc-900">Automated Backups</p>
                <p className="text-sm text-zinc-500">Run daily database snapshots.</p>
              </div>
              <Toggle checked={preferences.autoBackup} onChange={() => togglePref('autoBackup')} />
            </div>
            
            <div className="flex items-center justify-between py-3 border-t border-black/5">
              <div>
                <p className="font-medium text-red-400">Maintenance Mode</p>
                <p className="text-sm text-zinc-500">Lock out all non-admin users for system updates.</p>
              </div>
              <Toggle checked={preferences.maintenanceMode} onChange={() => togglePref('maintenanceMode')} danger />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button variant="primary" leftIcon={<Save className="w-4 h-4" />} onClick={handleSave} isLoading={isSaving}>
              Apply Changes
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
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B1018] ${
        checked 
          ? danger ? 'bg-red-500 focus:ring-red-500' : 'bg-blue-500 focus:ring-blue-500' 
          : 'bg-slate-700 focus:ring-slate-400'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
};
