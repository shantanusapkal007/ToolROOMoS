import React, { useState } from 'react';
import { Settings, Save } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';

export const SystemPreferences = () => {
  const { success } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // Mock state for toggles
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    slackIntegration: false,
    autoBackup: true,
    maintenanceMode: false,
  });

  const togglePref = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      success('Preferences Updated', 'System preferences saved successfully!');
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0 bg-white/5">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mr-4 border border-orange-500/20">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">System Preferences</h2>
            <p className="text-sm text-slate-400">Configure global OS behavior and integrations.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 hide-scrollbar">
        <div className="max-w-3xl space-y-8">
          
          <div className="space-y-4 border border-white/10 p-6 rounded-2xl bg-[#0B1018]/50 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
            <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-4 mb-4">Notifications</h3>
            
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-white">Email Notifications</p>
                <p className="text-sm text-slate-400">Send system alerts via email.</p>
              </div>
              <Toggle checked={preferences.emailNotifications} onChange={() => togglePref('emailNotifications')} />
            </div>
            
            <div className="flex items-center justify-between py-3 border-t border-white/5">
              <div>
                <p className="font-medium text-white">Slack Integration</p>
                <p className="text-sm text-slate-400">Push workflow events to Slack channels.</p>
              </div>
              <Toggle checked={preferences.slackIntegration} onChange={() => togglePref('slackIntegration')} />
            </div>
          </div>

          <div className="space-y-4 border border-white/10 p-6 rounded-2xl bg-[#0B1018]/50 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
            <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-4 mb-4">System Maintenance</h3>
            
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-white">Automated Backups</p>
                <p className="text-sm text-slate-400">Run daily database snapshots.</p>
              </div>
              <Toggle checked={preferences.autoBackup} onChange={() => togglePref('autoBackup')} />
            </div>
            
            <div className="flex items-center justify-between py-3 border-t border-white/5">
              <div>
                <p className="font-medium text-red-400">Maintenance Mode</p>
                <p className="text-sm text-slate-400">Lock out all non-admin users for system updates.</p>
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
