"use client";

import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Building2, Save, MapPin, Mail, Phone, Globe, DollarSign } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';

export const CompanyProfile = () => {
  const { success } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      success('Profile Saved', 'Company Profile details updated successfully.');
    }, 600);
  };

  return (
    <div className="h-full flex flex-col relative min-h-0 bg-[#fbfbfd]">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-border-gray shrink-0 bg-white">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-subtle shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sub-heading font-bold text-ink tracking-tight">Company Profile & Legal Entity</h2>
            <p className="text-caption text-cool-gray mt-0.5">
              Manage enterprise registration numbers, fiscal headquarters, and currency localization.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0">
        <form onSubmit={handleSave} className="max-w-4xl space-y-6">
          {/* General Information Card */}
          <div className="p-6 bg-white rounded-[12px] border border-border-gray shadow-subtle space-y-4">
            <div className="flex items-center gap-2 border-b border-border-gray pb-3">
              <Building2 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-ink">General Entity Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input label="Registered Enterprise Name" defaultValue="ToolRoom Enterprise Precision Dies Ltd" required />
              </div>
              <Input label="GSTIN / VAT Registration" defaultValue="27AABCT3518Q1ZQ" />
              <Input label="Corporate PAN / Tax ID" defaultValue="AABCT3518Q" />
            </div>
          </div>

          {/* Contact & Address Card */}
          <div className="p-6 bg-white rounded-[12px] border border-border-gray shadow-subtle space-y-4">
            <div className="flex items-center gap-2 border-b border-border-gray pb-3">
              <MapPin className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-ink">Contact & Plant Headquarters</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Primary Operations Email" type="email" defaultValue="operations@toolroomos.com" />
              <Input label="Support & Hotline Phone" type="tel" defaultValue="+91 20 6712 9000" />
              <div className="sm:col-span-2">
                <Input label="Headquarters Address" defaultValue="Plot 44, MIDC Industrial Area, Chakan, Pune, Maharashtra 410501" />
              </div>
            </div>
          </div>

          {/* Localization & Currencies Card */}
          <div className="p-6 bg-white rounded-[12px] border border-border-gray shadow-subtle space-y-4">
            <div className="flex items-center gap-2 border-b border-border-gray pb-3">
              <Globe className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-ink">Localization & Fiscal Currencies</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select 
                label="Base Operating Currency" 
                options={[
                  { label: 'INR (₹) — Indian Rupee', value: 'INR' },
                  { label: 'USD ($) — US Dollar', value: 'USD' },
                  { label: 'EUR (€) — Euro', value: 'EUR' },
                  { label: 'GBP (£) — British Pound', value: 'GBP' },
                ]} 
                defaultValue="INR"
              />
              <Select 
                label="Operational Timezone" 
                options={[
                  { label: 'Asia/Kolkata (IST +5:30)', value: 'IST' },
                  { label: 'UTC (Coordinated Universal Time)', value: 'UTC' },
                  { label: 'America/New_York (EST)', value: 'EST' },
                  { label: 'Europe/London (GMT)', value: 'GMT' },
                ]} 
                defaultValue="IST"
              />
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving} className="h-9 px-5 font-semibold text-xs shadow-subtle">
              <Save className="w-4 h-4 mr-1.5" />
              <span>Save Company Profile</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
