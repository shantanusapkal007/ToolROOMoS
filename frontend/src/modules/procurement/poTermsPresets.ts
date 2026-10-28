export interface PoTermsPreset {
  id: string;
  name: string;
  description: string;
  terms: string[];
}

export const PO_TERMS_PRESETS: PoTermsPreset[] = [
  {
    id: 'raw-material',
    name: 'Raw Material & Tool Steels (Standard)',
    description: 'For alloy steels, blocks, rounds, die plates with MTC & heat traceability',
    terms: [
      'Material must strictly conform to technical specification, dimensions & chemical composition.',
      'Test certificate / inspection report (MTC) must accompany the delivery slip.',
      'Heat number and batch identification must be clearly hard-stamped or tagged on each piece.',
      "Rejected items or out-of-tolerance stock will be returned at supplier's expense.",
    ],
  },
  {
    id: 'bought-out',
    name: 'Standard Hardware & Bought-Out Items',
    description: 'For standard guide pillars, bushes, fasteners, springs, manifolds',
    terms: [
      'All items must be genuine OEM grade with valid manufacturer warranty.',
      'Delivery must be in original sealed packaging with part numbers clearly marked.',
      'Payment terms: 30 days following physical receipt and QA clearance.',
      'Immediate replacement within 48 hours for any transit damage or defects.',
    ],
  },
  {
    id: 'job-work',
    name: 'Job Work, Machining & Heat Treatment',
    description: 'For external machining, wire-cut, EDM, hardening or surface coating',
    terms: [
      'Machining/treatment must strictly follow the engineering drawing revision mentioned.',
      'Inspection report with critical dimensions must be provided on delivery.',
      'Scrap / offcuts of client-issued material must be returned with the processed parts.',
      'Rework due to machining defects will be performed free of charge by vendor.',
    ],
  },
  {
    id: 'custom',
    name: 'General Commercial PO',
    description: 'Standard baseline terms for general tooling procurement',
    terms: [
      'Material must strictly conform to technical specification & dimensions.',
      'Test certificate / inspection report must accompany the delivery slip.',
      "Rejected items will be returned at supplier's expense.",
    ],
  },
];

export const DEFAULT_PO_TERMS: string[] = PO_TERMS_PRESETS[0].terms;

export function normalizePoTerms(terms?: string[] | string | null): string[] {
  if (Array.isArray(terms) && terms.length > 0) {
    return terms.map(t => String(t).trim()).filter(Boolean);
  }
  if (typeof terms === 'string' && terms.trim().length > 0) {
    return terms.split('\n').map(t => t.trim().replace(/^[-*•\d.]+\s*/, '')).filter(Boolean);
  }
  return DEFAULT_PO_TERMS;
}
