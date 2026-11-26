"use client";

import React from 'react';

export function numberToWordsINR(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'Zero Rupees Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(num: number): string {
    if (num < 10) return singleDigits[num];
    if (num < 20) return teens[num - 10];
    const unit = num % 10;
    return tens[Math.floor(num / 10)] + (unit ? ' ' + singleDigits[unit] : '');
  }

  function convertThreeDigits(num: number): string {
    const hundred = Math.floor(num / 100);
    const rest = num % 100;
    let res = '';
    if (hundred) res += singleDigits[hundred] + ' Hundred';
    if (hundred && rest) res += ' and ';
    if (rest) res += convertTwoDigits(rest);
    return res;
  }

  const crore = Math.floor(rounded / 10000000);
  let remainder = rounded % 10000000;
  const lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  const thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  const parts: string[] = [];
  if (crore) parts.push(convertThreeDigits(crore) + ' Crore');
  if (lakh) parts.push(convertThreeDigits(lakh) + ' Lakh');
  if (thousand) parts.push(convertThreeDigits(thousand) + ' Thousand');
  if (remainder) parts.push(convertThreeDigits(remainder));

  return 'Rupees ' + parts.join(' ') + ' Only';
}

interface OfficialSheetShellProps {
  id: string;
  itemCount?: number;
  extraClassName?: string;
  children: React.ReactNode;
}

/**
 * Corporate stationery A4 shell matching the #163354 Navy & #E5EDF6 Ice-Blue specification.
 * For single-page orders (<= 14 rows), stretches vertically to anchor the footer at page bottom.
 * For large orders (> 14 rows), disables flex-height lock so multi-page table pagination and repeating headers work natively.
 */
export function OfficialSheetShell({
  id,
  itemCount = 1,
  extraClassName = '',
  children,
}: OfficialSheetShellProps) {
  const isMultiPage = itemCount > 14;

  return (
    <div
      id={id}
      data-print-target="true"
      className={`printable-sheet pro-print-sheet ${isMultiPage ? 'pro-print-multipage' : ''} ${extraClassName} bg-white rounded-[10px] shadow-level-4 text-[#111827] w-full max-w-[230mm] ${
        isMultiPage ? '' : 'min-h-[265mm] print:min-h-[280mm] flex flex-col'
      } mx-auto print:max-w-none print:w-full print:shadow-none font-sans`}
    >
      <div
        className={`${
          isMultiPage ? 'block' : 'flex-1 flex flex-col'
        } relative rounded-[10px] border border-[#CBD5E1] bg-white p-4 sm:p-5 print:p-4`}
      >
        {/* Top-Right Subtle Geometric Corner Accent */}
        <svg
          aria-hidden="true"
          viewBox="0 0 210 110"
          className="pointer-events-none block m-0 absolute top-0 right-0 w-44 h-22 print:w-40 print:h-20 rounded-tr-[9px] z-0"
          preserveAspectRatio="none"
        >
          <polygon points="65,0 210,0 210,105" fill="#F1F5FA" />
          <polygon points="120,0 210,0 210,68" fill="#E5EDF6" />
        </svg>

        {/* Bottom-Left Subtle Geometric Corner Accent */}
        <svg
          aria-hidden="true"
          viewBox="0 0 210 110"
          className="pointer-events-none block m-0 absolute bottom-0 left-0 w-44 h-22 print:w-40 print:h-20 rounded-bl-[9px] z-0"
          preserveAspectRatio="none"
        >
          <polygon points="0,5 0,110 145,110" fill="#F1F5FA" />
          <polygon points="0,42 0,110 90,110" fill="#E5EDF6" />
        </svg>

        <div
          className={`relative z-10 ${
            isMultiPage ? 'space-y-2.5' : 'flex-1 flex flex-col space-y-2.5'
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

interface OfficialLetterheadProps {
  documentTitle: string;
  legalSubtitle: string;
}

export function OfficialLetterhead({ documentTitle, legalSubtitle }: OfficialLetterheadProps) {
  return (
    <div className="space-y-2.5 print:space-y-2 break-inside-avoid shrink-0">
      {/* Top Company Branding Row */}
      <div className="flex items-center gap-4 pt-0.5">
        <div className="w-24 sm:w-28 print:w-24 shrink-0 flex items-center justify-center">
          <img
            src="/Krupa_Logo.png"
            alt="Krupa Logo"
            className="h-14 sm:h-16 print:h-14 w-auto object-contain"
          />
        </div>

        {/* Crisp Crimson Vertical Divider */}
        <div className="w-[2px] h-14 print:h-12 bg-[#B91C1C] shrink-0" />

        <div className="flex-1 text-left pl-1">
          <h1 className="text-lg sm:text-[21px] print:text-[17px] font-extrabold uppercase tracking-wide text-[#C41E2E] leading-tight">
            KRUPA TOOLS &amp; STAMPINGS LTD.
          </h1>
          <p className="text-[11px] print:text-[9px] font-bold text-[#111827] mt-0.5 uppercase tracking-tight leading-snug">
            GUT NO.23 PLOT NO.45 KAMLAPUR MIDC, WALUJ AURANGABAD - 431136
          </p>
          <p className="text-[11px] print:text-[9px] font-bold text-[#111827] uppercase tracking-tight leading-snug">
            GST NO : 27AAKCK1751B1ZS | STATE: MAHARASHTRA (27)
          </p>
          <p className="text-[9.5px] print:text-[8px] font-semibold text-[#475569] uppercase tracking-tight mt-0.5 leading-snug">
            Manufacturers of Press Tools, Jig Fixtures, Moulds, Precision Tooling &amp; Outside Job Work
          </p>
        </div>
      </div>

      {/* Centered Navy Title Pill Flanked by Hairline Horizontal Rules */}
      <div className="space-y-1">
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-[1.5px] bg-[#94A3B8]/60" />
          <div className="bg-[#163354] text-white font-bold text-xs sm:text-sm print:text-[12px] uppercase tracking-[0.12em] px-8 sm:px-11 py-1.5 print:py-1 rounded-[7px] shrink-0">
            {documentTitle}
          </div>
          <div className="flex-1 h-[1.5px] bg-[#94A3B8]/60" />
        </div>
        <div className="text-center text-[10px] print:text-[8.5px] text-[#475569] font-medium tracking-tight">
          {legalSubtitle}
        </div>
      </div>
    </div>
  );
}

interface OfficialInstructionBarProps {
  text: string;
}

export function OfficialInstructionBar({ text }: OfficialInstructionBarProps) {
  return (
    <div className="bg-[#163354] text-white text-center font-bold text-[10.5px] print:text-[8.5px] uppercase tracking-wider py-2 px-3 print:py-1.5 rounded-[6px] break-inside-avoid shrink-0">
      {text}
    </div>
  );
}

/**
 * Stacked coins icon matching official printed voucher reference.
 */
export function CoinsStackIcon({ className = 'w-5 h-5 text-[#163354]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <ellipse cx="9" cy="6" rx="5" ry="2.2" />
      <path d="M4 6v4c0 1.2 2.2 2.2 5 2.2s5-1 5-2.2V6" />
      <path d="M4 10v4c0 1.2 2.2 2.2 5 2.2s5-1 5-2.2v-4" />
      <path d="M14.5 11.5c2.5 0 4.5.9 4.5 2v4c0 1.1-2 2-4.5 2s-4.5-.9-4.5-2v-1.2" />
      <path d="M19 13.5c0 1.1-2 2-4.5 2" />
    </svg>
  );
}

export interface SignatureBoxConfig {
  title: string;
  role?: string;
  caption: string;
}

interface OfficialSignatureStripProps {
  boxes: SignatureBoxConfig[];
}

export function OfficialSignatureStrip({ boxes }: OfficialSignatureStripProps) {
  const gridClass = boxes.length === 4 ? 'grid-cols-4' : 'grid-cols-3';
  return (
    <div className={`grid ${gridClass} text-center pt-1.5 pb-0.5 break-inside-avoid`}>
      {boxes.map((box, idx) => (
        <div
          key={idx}
          className={`flex flex-col justify-between h-20 sm:h-24 print:h-20 px-2 ${
            idx < boxes.length - 1 ? 'border-r border-[#CBD5E1]' : ''
          }`}
        >
          <div>
            <span className="font-bold text-[#111827] uppercase text-[9.5px] print:text-[8px] tracking-wider block">
              {box.title}
            </span>
            {box.role && (
              <span className="text-[10px] print:text-[8px] text-[#475569] mt-0.5 block font-medium">
                {box.role}
              </span>
            )}
          </div>
          <div className="flex-1" />
          <div className="pt-1 border-t border-[#94A3B8] mx-4 print:mx-3">
            <span className="text-[8.5px] print:text-[7.5px] text-[#475569] font-semibold uppercase tracking-wide">
              {box.caption}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
