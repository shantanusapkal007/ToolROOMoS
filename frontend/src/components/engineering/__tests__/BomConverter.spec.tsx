import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BomConverter } from '../BomConverter';

// Mock Lucide icons to prevent SVG rendering issues in Jest
jest.mock('lucide-react', () => ({
  Upload: () => <div data-testid="upload-icon" />,
  FileSpreadsheet: () => <div data-testid="file-icon" />,
  CheckCircle2: () => <div data-testid="check-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  Download: () => <div data-testid="download-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  Sliders: () => <div data-testid="sliders-icon" />,
  X: () => <div data-testid="x-icon" />,
  Maximize: () => <div data-testid="maximize-icon" />,
  ShoppingCart: () => <div data-testid="shopping-cart-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Lock: () => <div data-testid="lock-icon" />,
  Tag: () => <div data-testid="tag-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  Layers: () => <div data-testid="layers-icon" />,
  Check: () => <div data-testid="check-icon-plain" />,
  RotateCcw: () => <div data-testid="rotate-ccw-icon" />
}));

// Mock toast hook
const mockSuccess = jest.fn();
const mockError = jest.fn();
const mockWarning = jest.fn();

jest.mock('../../ui/Toast', () => ({
  useToast: () => ({
    success: mockSuccess,
    error: mockError,
    info: jest.fn(),
    warning: mockWarning
  })
}));

// Mock hooks
jest.mock('@/hooks/useEngineering', () => ({
  useProjectBOM: () => ({ data: null }),
}));

jest.mock('@/hooks/useMasterData', () => ({
  useMasterData: () => ({
    data: [
      { id: 'mat-1', materialCode: 'EN-31', materialGrade: 'EN-31 Tool Steel', standardCost: 280, defaultUom: 'KG', density: 7.85, gstPercent: 18 },
      { id: 'mat-2', materialCode: 'D2', materialGrade: 'D2 High Carbon Steel', standardCost: 400, defaultUom: 'KG', density: 7.85, gstPercent: 18 },
      { id: 'mat-3', materialCode: 'MS', materialGrade: 'Mild Steel', standardCost: 75, defaultUom: 'KG', density: 7.85, gstPercent: 18 },
    ]
  }),
  masterDataKeys: {
    all: ['master-data'],
    registry: (id: string) => ['master-data', id],
  },
}));

jest.mock('@/services/master-data.service', () => ({
  MasterDataService: {
    getRegistry: jest.fn().mockResolvedValue([
      { id: 'mat-1', materialCode: 'EN-31', materialGrade: 'EN-31 Tool Steel', standardCost: 280, defaultUom: 'KG', density: 7.85, gstPercent: 18 },
      { id: 'mat-2', materialCode: 'D2', materialGrade: 'D2 High Carbon Steel', standardCost: 400, defaultUom: 'KG', density: 7.85, gstPercent: 18 },
      { id: 'mat-3', materialCode: 'MS', materialGrade: 'Mild Steel', standardCost: 75, defaultUom: 'KG', density: 7.85, gstPercent: 18 },
    ]),
    createItem: jest.fn().mockImplementation((_, payload) => Promise.resolve({ id: 'mat-new', ...payload })),
  },
}));

const mockMaterials = [
  { id: 'mat-1', materialCode: 'EN-31', materialGrade: 'EN-31 Tool Steel', standardCost: 280, defaultUom: 'KG', density: 7.85, gstPercent: 18 },
  { id: 'mat-2', materialCode: 'D2', materialGrade: 'D2 High Carbon Steel', standardCost: 400, defaultUom: 'KG', density: 7.85, gstPercent: 18 },
  { id: 'mat-3', materialCode: 'MS', materialGrade: 'Mild Steel', standardCost: 75, defaultUom: 'KG', density: 7.85, gstPercent: 18 },
];

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderComponent = (props = {}) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BomConverter
        projectId="prj-123"
        project={{ projectNumber: 'KTD-433', name: 'Punch Die Tool' }}
        materials={mockMaterials}
        onSaveBOM={jest.fn()}
        {...props}
      />
    </QueryClientProvider>
  );
};

describe('BomConverter Component & Material Rate Confirmation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders initial upload state and manual BOM button', () => {
    renderComponent();
    expect(screen.getByText(/Drag & Drop Engineering BOM Excel/i)).toBeInTheDocument();
    expect(screen.getByText(/Create Manual BOM Sheet/i)).toBeInTheDocument();
  });

  test('initializes manual BOM and displays Material Rate Confirmation section', () => {
    renderComponent();
    const manualBtn = screen.getByText(/Create Manual BOM Sheet/i);
    fireEvent.click(manualBtn);

    expect(screen.getByText(/BOM mapping preview/i)).toBeInTheDocument();
    expect(screen.getByText(/Add Component Row/i)).toBeInTheDocument();
  });

  test('renders Material Rate Confirmation table when unique materials exist', async () => {
    renderComponent();
    const manualBtn = screen.getByText(/Create Manual BOM Sheet/i);
    fireEvent.click(manualBtn);

    // Type material for first row as text
    const matInputs = screen.getAllByPlaceholderText(/Material from Excel/i);
    if (matInputs.length > 0) {
      fireEvent.change(matInputs[0], { target: { value: 'EN-31' } });
    }

    await waitFor(() => {
      expect(screen.getByText(/Material Rate Confirmation/i)).toBeInTheDocument();
      expect(screen.getByText(/Confirm Rates & Continue/i)).toBeInTheDocument();
    });
  });

  test('allows editing Current BOM Rate and updating status', async () => {
    renderComponent();
    const manualBtn = screen.getByText(/Create Manual BOM Sheet/i);
    fireEvent.click(manualBtn);

    const matInputs = screen.getAllByPlaceholderText(/Material from Excel/i);
    if (matInputs.length > 0) {
      fireEvent.change(matInputs[0], { target: { value: 'EN-31' } });
    }

    await waitFor(() => {
      expect(screen.getByText(/Material Rate Confirmation/i)).toBeInTheDocument();
    });

    // Find the rate input in the confirmation table
    const rateInputs = screen.getAllByPlaceholderText(/Enter Rate/i);
    if (rateInputs.length > 0) {
      fireEvent.change(rateInputs[0], { target: { value: '320' } });
      await waitFor(() => {
        expect(screen.getAllByText(/Changed/i).length).toBeGreaterThanOrEqual(1);
      });
    }

    // Confirm rates
    const confirmBtn = screen.getByText(/Confirm Rates & Continue/i);
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalledWith(
        expect.stringContaining('Rates Confirmed'),
        expect.any(String)
      );
    });
  });

  test('correctly calculates cylindrical weight for Ø48X70 using π × (D/2)² × L', async () => {
    renderComponent();
    const manualBtn = screen.getByText(/Create Manual BOM Sheet/i);
    fireEvent.click(manualBtn);

    // Set Material to EN-31 (density 7.85)
    const matInputs = screen.getAllByPlaceholderText(/Material from Excel/i);
    fireEvent.change(matInputs[0], { target: { value: 'EN-31' } });

    // Set RM Dimensions: switch to Round with L='Ø', then enter Dia=48, Len=70
    const lInputs = screen.getAllByPlaceholderText('L');
    fireEvent.change(lInputs[1], { target: { value: 'Ø' } });

    const diaInput = screen.getByPlaceholderText('Dia');
    const lenInput = screen.getByPlaceholderText('Len');
    fireEvent.change(diaInput, { target: { value: '48' } });
    fireEvent.change(lenInput, { target: { value: '70' } });

    await waitFor(() => {
      // apWeight for Ø48X70 with density 7.85 is 0.99 kg
      expect(screen.getByDisplayValue('0.99')).toBeInTheDocument();
    });
  });

  test('correctly calculates rectangular weight for 80X50X14 using L × W × H', async () => {
    renderComponent();
    const manualBtn = screen.getByText(/Create Manual BOM Sheet/i);
    fireEvent.click(manualBtn);

    // Set Material to EN-31 (density 7.85)
    const matInputs = screen.getAllByPlaceholderText(/Material from Excel/i);
    fireEvent.change(matInputs[0], { target: { value: 'EN-31' } });

    // Set RM Dimensions: L='80', W='50', H='14'
    const lInputs = screen.getAllByPlaceholderText('L');
    const wInputs = screen.getAllByPlaceholderText('W');
    const hInputs = screen.getAllByPlaceholderText('H');

    // Index 1 corresponds to RM L, W, H
    fireEvent.change(lInputs[1], { target: { value: '80' } });
    fireEvent.change(wInputs[1], { target: { value: '50' } });
    fireEvent.change(hInputs[1], { target: { value: '14' } });

    await waitFor(() => {
      // apWeight for 80X50X14 with density 7.85 is 0.44 kg
      expect(screen.getByDisplayValue('0.44')).toBeInTheDocument();
    });
  });
});

