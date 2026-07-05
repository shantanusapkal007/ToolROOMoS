import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Building2, Save } from 'lucide-react';

import { useToast } from '../../../components/ui/Toast';

export const CompanyProfile = () => {
  const { success } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      success('Profile Saved', 'Company Profile saved successfully!');
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center p-6 border-b border-white/10 shrink-0 bg-white/5">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mr-4 border border-blue-500/20">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Company Profile</h2>
          <p className="text-sm text-slate-400">Manage organizational details and branding.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 hide-scrollbar">
        <form onSubmit={handleSave} className="max-w-3xl space-y-8">
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">General Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <Input label="Company Name" defaultValue="ToolRoom Inc." required />
              </div>
              <Input label="Registration Number (GST/VAT)" defaultValue="GST123456789" />
              <Input label="Tax ID" defaultValue="TAX-998877" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Contact Details</h3>
            <div className="grid grid-cols-2 gap-6">
              <Input label="Primary Email" type="email" defaultValue="admin@toolroom.com" />
              <Input label="Phone Number" type="tel" defaultValue="+1 (555) 123-4567" />
              <div className="col-span-2">
                <Input label="Headquarters Address" defaultValue="123 Manufacturing Way, Tech Park, CA" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Localization</h3>
            <div className="grid grid-cols-2 gap-6">
              <Select 
                label="Base Currency" 
                options={[
                  { label: 'USD ($)', value: 'USD' },
                  { label: 'EUR (&#8364;)', value: 'EUR' },
                  { label: 'GBP (&#163;)', value: 'GBP' },
                  { label: 'INR (&#8377;)', value: 'INR' },
                ]} 
                defaultValue="USD"
              />
              <Select 
                label="Timezone" 
                options={[
                  { label: 'UTC', value: 'UTC' },
                  { label: 'America/New_York', value: 'EST' },
                  { label: 'Asia/Kolkata', value: 'IST' },
                ]} 
                defaultValue="UTC"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />} isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
