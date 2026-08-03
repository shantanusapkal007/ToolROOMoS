import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';


export interface CategoryOption {
  id: string;
  category: string;
  code: string;
  label: string;
  description?: string;
  isSystem?: boolean;
}

const DEFAULT_FALLBACKS: Record<string, CategoryOption[]> = {
  PRODUCTION_SECTION: [
    { id: 'ps-1', category: 'PRODUCTION_SECTION', code: 'MACHINE_SHOP', label: 'Machine Shop (CNC/VMC/EDM)', isSystem: true },
    { id: 'ps-2', category: 'PRODUCTION_SECTION', code: 'PRESS_SHOP', label: 'Press Shop & Tryout', isSystem: true },
    { id: 'ps-3', category: 'PRODUCTION_SECTION', code: 'TOOL_ROOM_FITTING', label: 'Tool Room Fitting & Assembly', isSystem: true },
    { id: 'ps-4', category: 'PRODUCTION_SECTION', code: 'FABRICATION_INDIAN', label: 'Fabrication (Domestic)', isSystem: true },
    { id: 'ps-5', category: 'PRODUCTION_SECTION', code: 'FABRICATION_EXPORT', label: 'Fabrication (Export)', isSystem: true },
    { id: 'ps-6', category: 'PRODUCTION_SECTION', code: 'QUALITY_INSPECTION', label: 'Quality & CMM Inspection', isSystem: true },
    { id: 'ps-7', category: 'PRODUCTION_SECTION', code: 'OUTSOURCED', label: 'Outsourced / Job Work', isSystem: true },
  ],
  CAD_TOOL: [
    { id: 'ct-1', category: 'CAD_TOOL', code: 'SOLIDWORKS', label: 'SolidWorks', isSystem: true },
    { id: 'ct-2', category: 'CAD_TOOL', code: 'UG_NX', label: 'Siemens UG NX', isSystem: true },
    { id: 'ct-3', category: 'CAD_TOOL', code: 'AUTOCAD', label: 'AutoCAD Mechanical', isSystem: true },
    { id: 'ct-4', category: 'CAD_TOOL', code: 'CATIA', label: 'Dassault CATIA', isSystem: true },
    { id: 'ct-5', category: 'CAD_TOOL', code: 'CREO', label: 'PTC Creo', isSystem: true },
  ],
  WORK_STAGE: [
    { id: 'ws-1', category: 'WORK_STAGE', code: '3D_CAD_MODELING', label: '3D CAD Modeling', isSystem: true },
    { id: 'ws-2', category: 'WORK_STAGE', code: '2D_DETAILING', label: '2D Detailing & Drafting', isSystem: true },
    { id: 'ws-3', category: 'WORK_STAGE', code: 'ELECTRODE_DESIGN', label: 'Electrode Design & Extract', isSystem: true },
    { id: 'ws-4', category: 'WORK_STAGE', code: 'CAM_TOOLPATH', label: 'CAM Toolpath Generation', isSystem: true },
    { id: 'ws-5', category: 'WORK_STAGE', code: 'FEA_SIMULATION', label: 'FEA & Mold Flow Simulation', isSystem: true },
    { id: 'ws-6', category: 'WORK_STAGE', code: 'TOLERANCE_STACKUP', label: 'Tolerance Stackup & DFM', isSystem: true },
    { id: 'ws-7', category: 'WORK_STAGE', code: 'REVISION_CHANGE', label: 'Revision Change / ECN', isSystem: true },
    { id: 'ws-8', category: 'WORK_STAGE', code: 'BOM_ASSEMBLY', label: 'BOM & Tool Assembly Layout', isSystem: true },
  ],
  UOM: [
    { id: 'uom-1', category: 'UOM', code: 'NOS', label: 'NOS (Numbers)', isSystem: true },
    { id: 'uom-2', category: 'UOM', code: 'SET', label: 'SET (Sets)', isSystem: true },
    { id: 'uom-3', category: 'UOM', code: 'PCS', label: 'PCS (Pieces)', isSystem: true },
    { id: 'uom-4', category: 'UOM', code: 'MTR', label: 'MTR (Meters)', isSystem: true },
    { id: 'uom-5', category: 'UOM', code: 'KG', label: 'KG (Kilograms)', isSystem: true },
    { id: 'uom-6', category: 'UOM', code: 'BOX', label: 'BOX (Boxes)', isSystem: true },
    { id: 'uom-7', category: 'UOM', code: 'LOT', label: 'LOT (Lots)', isSystem: true },
  ],
  ASSET_CONDITION: [
    { id: 'ac-1', category: 'ASSET_CONDITION', code: 'NEW', label: 'NEW (Brand New)', isSystem: true },
    { id: 'ac-2', category: 'ASSET_CONDITION', code: 'EXCELLENT', label: 'EXCELLENT (Like New)', isSystem: true },
    { id: 'ac-3', category: 'ASSET_CONDITION', code: 'GOOD', label: 'GOOD (Operational)', isSystem: true },
    { id: 'ac-4', category: 'ASSET_CONDITION', code: 'FAIR', label: 'FAIR (Worn / Minor Defect)', isSystem: true },
    { id: 'ac-5', category: 'ASSET_CONDITION', code: 'POOR', label: 'POOR (Requires Repair)', isSystem: true },
    { id: 'ac-6', category: 'ASSET_CONDITION', code: 'DAMAGED', label: 'DAMAGED (Out of Order)', isSystem: true },
  ],
};

export function useMasterLookups(category: string) {
  const queryKey = ['master-category-options', category];
  const query = useQuery<CategoryOption[]>({
    queryKey,
    queryFn: async () => {
      try {
        const res = await api.get(`/master-data/category-options?category=${encodeURIComponent(category)}`);
        if (res.data && res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          return res.data.data;
        }
      } catch (err) {
        console.warn(`Falling back to default list for category '${category}'`, err);
      }
      return DEFAULT_FALLBACKS[category.toUpperCase()] || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    options: query.data || DEFAULT_FALLBACKS[category.toUpperCase()] || [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export function useCreateCategoryOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { category: string; label: string; code?: string; description?: string }) => {
      const res = await api.post('/master-data/category-options', payload);
      return res.data?.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['master-category-options', variables.category] });
      queryClient.invalidateQueries({ queryKey: ['master-category-options'] });
    },
  });
}

export function useDeleteCategoryOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; category: string }) => {
      const res = await api.delete(`/master-data/category-options/${payload.id}`);
      return res.data?.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['master-category-options', variables.category] });
      queryClient.invalidateQueries({ queryKey: ['master-category-options'] });
    },
  });
}
