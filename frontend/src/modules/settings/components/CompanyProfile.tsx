"use client";

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
    <div className="h-full flex flex-col relative min-h-0">
      <div className="flex items-center p-5 border-b border-border-gray shrink-0 bg-white">
        <div className="w-10 h-10 rounded-[10px] bg-primary-subtle text-primary flex items-center justify-center mr-3.5 border border-primary/20 shadow-subtle">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-section-heading font-bold text-ink tracking-tight">Company Profile</h2>
          <p className="text-caption text-silver-blue">Manage organizational details, registration numbers, and operational localization.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 hide-scrollbar bg-[#fbfbfd]">
        <form onSubmit={handleSave} className="max-w-3xl space-y-6 bg-white p-6 rounded-[12px] border border-border-gray shadow-subtle">
          
          <div className="space-y-4">
            <h3 className="text-body font-bold text-ink border-b border-border-gray pb-2.5">General Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input label="Company Name" defaultValue="ToolRoom Enterprise Precision Dies Ltd" required />
              </div>
              <Input label="Registration Number (GST/VAT)" defaultValue="27AABCT3518Q1ZQ" />
              <Input label="Tax ID / PAN" defaultValue="AABCT3518Q" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-body font-bold text-ink border-b border-border-gray pb-2.5">Contact Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Primary Email" type="email" defaultValue="operations@toolroomos.com" />
              <Input label="Phone Number" type="tel" defaultValue="+91 20 6712 9000" />
              <div className="sm:col-span-2">
                <Input label="Headquarters Address" defaultValue="Plot 44, MIDC Industrial Area, Chakan, Pune, MH 410501" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-body font-bold text-ink border-b border-border-gray pb-2.5">Localization</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select 
                label="Base Currency" 
                options={[
                  { label: 'INR (₹)', value: 'INR' },
                  { label: 'USD ($)', value: 'USD' },
                  { label: 'EUR (€)', value: 'EUR' },
                  { label: 'GBP (£)', value: 'GBP' },
                ]} 
                defaultValue="INR"
              />
              <Select 
                label="Timezone" 
                options={[
                  { label: 'Asia/Kolkata (IST +5:30)', value: 'IST' },
                  { label: 'UTC', value: 'UTC' },
                  { label: 'America/New_York (EST)', value: 'EST' },
                  { label: 'Europe/London (GMT)', value: 'GMT' },
                ]} 
                defaultValue="IST"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end border-t border-border-gray">
            <Button type="submit" variant="primary" size="md" isLoading={isSaving}>
              <Save className="w-4 h-4 mr-1.5" />
              <span>Save Company Profile</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
