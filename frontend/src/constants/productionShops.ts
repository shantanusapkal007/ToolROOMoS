import { useMasterLookups } from '../hooks/useMasterLookups';

export interface ProductionShopOption {

  id: string;
  label: string;
  shortLabel: string;
  description: string;
  iconName: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const PRODUCTION_SHOPS: ProductionShopOption[] = [
  {
    id: 'MACHINE_SHOP',
    label: 'Machine Shop',
    shortLabel: 'Machine Shop',
    description: 'VMC, CNC, Milling, Turning, Grinding & Precision Machining',
    iconName: 'Cpu',
    badgeBg: 'bg-primary-subtle',
    badgeText: 'text-primary-dark',
    badgeBorder: 'border-primary/20',
  },
  {
    id: 'FABRICATION',
    label: 'Fabrication Shop',
    shortLabel: 'Fabrication',
    description: 'Structural Welding, Sheet Metal, Laser Cutting & Assembly',
    iconName: 'Flame',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-700',
    badgeBorder: 'border-orange-200',
  },
  {
    id: 'PRESS_SHOP',
    label: 'Press Shop',
    shortLabel: 'Press Shop',
    description: 'Power Press, Stamping, Die Trial & Blanking Operations',
    iconName: 'Layers',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
  },
  {
    id: 'ASSEMBLY',
    label: 'Assembly & Fitting Shop',
    shortLabel: 'Assembly',
    description: 'Tool Assembly, Die Fitting, Polishing & Final Benchwork',
    iconName: 'Wrench',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
  },
  {
    id: 'HEAT_TREATMENT',
    label: 'Heat Treatment Shop',
    shortLabel: 'Heat Treat',
    description: 'Hardening, Tempering, Stress Relieving & Surface Coating',
    iconName: 'Zap',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
  },
  {
    id: 'QUALITY_INSPECTION',
    label: 'Quality & Inspection',
    shortLabel: 'Quality / QA',
    description: 'CMM Inspection, Hardness Testing & First Piece Approval',
    iconName: 'CheckCircle2',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-800',
    badgeBorder: 'border-cyan-200',
  },
  {
    id: 'OUTSOURCED',
    label: 'Outsourced / Job Work',
    shortLabel: 'Outsourced',
    description: 'External Subcontractors, Special Processes & Outsource VMC',
    iconName: 'Truck',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
  },
];

export const getProductionShopDetails = (code?: string): ProductionShopOption => {
  if (!code) {
    return {
      id: 'UNKNOWN',
      label: 'General Shop Floor',
      shortLabel: 'General',
      description: 'General Toolroom Shop Floor',
      iconName: 'Factory',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-700',
      badgeBorder: 'border-slate-200',
    };
  }

  // Exact match or fallback mapping
  const found = PRODUCTION_SHOPS.find(
    (s) => s.id === code || s.id.toLowerCase() === code.toLowerCase()
  );

  if (found) return found;

  if (code.startsWith('FABRICATION')) {
    return PRODUCTION_SHOPS.find((s) => s.id === 'FABRICATION')!;
  }

  return {
    id: code,
    label: code.replace(/_/g, ' '),
    shortLabel: code.replace(/_/g, ' '),
    description: 'Production Shop Section',
    iconName: 'Factory',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
  };
};

export function useDynamicProductionShops() {
  const { options, isLoading } = useMasterLookups('PRODUCTION_SECTION');
  
  const shops: ProductionShopOption[] = options.map((opt) => {
    const existing = PRODUCTION_SHOPS.find(s => s.id === opt.code);
    if (existing) return existing;

    return {
      id: opt.code,
      label: opt.label,
      shortLabel: opt.label,
      description: opt.description || 'Production Shopfloor Section',
      iconName: 'Factory',
      badgeBg: 'bg-primary-subtle',
      badgeText: 'text-primary-dark',
      badgeBorder: 'border-primary/20',
    };
  });

  return { shops, isLoading };
}

