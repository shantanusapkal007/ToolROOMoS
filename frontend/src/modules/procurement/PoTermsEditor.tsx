"use client";

import React, { useState } from 'react';
import { Plus, Trash2, RotateCcw, FileText, Check, List, AlignLeft } from 'lucide-react';
import { PO_TERMS_PRESETS, PoTermsPreset, DEFAULT_PO_TERMS } from './poTermsPresets';

interface PoTermsEditorProps {
  terms: string[];
  onChange: (terms: string[]) => void;
  className?: string;
  title?: string;
  subtitle?: string;
}

export function PoTermsEditor({
  terms,
  onChange,
  className = "",
  title = "Terms & Conditions",
  subtitle = "Dynamic clauses printed on the purchase order sheet and exported to Excel",
}: PoTermsEditorProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('raw-material');
  const [isBulkMode, setIsBulkMode] = useState<boolean>(false);
  const [bulkText, setBulkText] = useState<string>('');

  const currentTerms = terms && terms.length > 0 ? terms : DEFAULT_PO_TERMS;

  const handleApplyPreset = (preset: PoTermsPreset) => {
    setSelectedPresetId(preset.id);
    onChange([...preset.terms]);
  };

  const handleUpdateClause = (index: number, value: string) => {
    const updated = [...currentTerms];
    updated[index] = value;
    onChange(updated);
  };

  const handleAddClause = () => {
    onChange([...currentTerms, '']);
  };

  const handleRemoveClause = (index: number) => {
    const updated = currentTerms.filter((_, idx) => idx !== index);
    onChange(updated.length > 0 ? updated : ['']);
  };

  const handleResetToDefault = () => {
    const preset = PO_TERMS_PRESETS.find(p => p.id === 'raw-material') || PO_TERMS_PRESETS[0];
    handleApplyPreset(preset);
  };

  const handleToggleBulkMode = () => {
    if (!isBulkMode) {
      setBulkText(currentTerms.join('\n'));
      setIsBulkMode(true);
    } else {
      const parsed = bulkText
        .split('\n')
        .map(line => line.trim().replace(/^[-*•\d.]+\s*/, ''))
        .filter(Boolean);
      onChange(parsed.length > 0 ? parsed : DEFAULT_PO_TERMS);
      setIsBulkMode(false);
    }
  };

  return (
    <div className={`bg-canvas border border-border-gray rounded-[12px] p-4 space-y-3.5 ${className}`}>
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-border-gray">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[8px] bg-primary-subtle text-primary flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-xs font-semibold text-ink uppercase tracking-wider">{title}</h4>
          </div>
          {subtitle && (
            <p className="text-[11px] text-mute mt-0.5 ml-8">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleToggleBulkMode}
            className="px-2.5 py-1 text-[11px] font-medium text-cool-gray hover:text-ink bg-white border border-border-gray rounded-[8px] transition-colors flex items-center gap-1.5 cursor-pointer shadow-micro"
            title={isBulkMode ? "Switch to clause list" : "Edit as plain multi-line text"}
          >
            {isBulkMode ? <List className="w-3 h-3 text-primary" /> : <AlignLeft className="w-3 h-3 text-cool-gray" />}
            <span>{isBulkMode ? "Clause View" : "Bulk Edit / Paste"}</span>
          </button>
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-2.5 py-1 text-[11px] font-medium text-cool-gray hover:text-ink bg-white border border-border-gray rounded-[8px] transition-colors flex items-center gap-1.5 cursor-pointer shadow-micro"
            title="Reset to default toolroom terms"
          >
            <RotateCcw className="w-3 h-3 text-cool-gray" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-semibold text-mute uppercase tracking-wider">
          Quick Preset Templates
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {PO_TERMS_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`p-2 rounded-[10px] text-left transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-primary-subtle border-primary/40 text-primary'
                    : 'bg-white hover:bg-canvas text-ink border-border-gray'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold truncate">{preset.name}</span>
                  {isSelected && <Check className="w-3 h-3 text-primary shrink-0 ml-1" />}
                </div>
                <p className="text-[10px] text-mute line-clamp-1">{preset.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Terms Body: Either List View or Bulk View */}
      {isBulkMode ? (
        <div className="space-y-1.5">
          <label className="block text-[10px] font-semibold text-mute uppercase tracking-wider">
            Edit / Paste Terms (One clause per line)
          </label>
          <textarea
            rows={5}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="Enter each term on a new line..."
            className="w-full p-3 bg-white border border-border-gray rounded-[10px] text-xs text-ink placeholder:text-mute focus:outline-none focus:border-primary font-mono leading-relaxed"
          />
          <p className="text-[10px] text-mute">
            Tip: You can copy and paste numbered or bulleted terms directly from contracts or emails.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-semibold text-mute uppercase tracking-wider">
              Clauses ({currentTerms.length})
            </label>
            <button
              type="button"
              onClick={handleAddClause}
              className="text-[11px] font-semibold text-primary hover:text-primary-dark flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Clause</span>
            </button>
          </div>

          <div className="space-y-2">
            {currentTerms.map((term, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="w-6 h-7 rounded-[8px] bg-white border border-border-gray text-[11px] font-mono font-semibold text-cool-gray flex items-center justify-center shrink-0">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={term}
                  onChange={(e) => handleUpdateClause(index, e.target.value)}
                  placeholder={`Term #${index + 1}...`}
                  className="flex-1 px-3 py-1.5 bg-white border border-border-gray rounded-[10px] text-xs text-ink placeholder:text-mute focus:outline-none focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveClause(index)}
                  disabled={currentTerms.length <= 1}
                  className="w-7 h-7 rounded-[8px] bg-white hover:bg-semantic-danger-subtle text-cool-gray hover:text-semantic-danger border border-border-gray hover:border-semantic-danger/30 flex items-center justify-center shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Remove clause"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
