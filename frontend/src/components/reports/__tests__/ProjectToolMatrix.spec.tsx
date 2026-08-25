import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectToolMatrix } from '../ProjectToolMatrix';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock Lucide icons
jest.mock('lucide-react', () => {
  const React = require('react');
  return new Proxy({}, {
    get: (_, iconName) => {
      const MockIcon = (props: any) => <div data-testid={`${String(iconName).toLowerCase()}-icon`} {...props} />;
      MockIcon.displayName = String(iconName);
      return MockIcon;
    }
  });
});

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href, ...rest }: any) => <a href={href} {...rest}>{children}</a>;
});

// Mock Toast
jest.mock('../../ui/Toast', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  }),
}));

// Mock hooks
const mockProjects = [
  {
    id: 'proj-1',
    projectNumber: 'PRJ-101',
    projectCode: 'PRJ-101',
    partName: 'DIE INSERT UPPER',
    name: 'DIE INSERT UPPER',
    toolName: 'DIE INSERT UPPER',
    currentStage: 'PRODUCTION',
    customer: {
      id: 'cust-1',
      customerCode: 'CUST-MSIL',
      companyName: 'Maruti Suzuki Ltd',
      gstNumber: '07AAAAA0000A1Z5',
    },
  },
  {
    id: 'proj-2',
    projectNumber: 'PRJ-102',
    projectCode: 'PRJ-102',
    partName: 'PUNCH HOLDER',
    name: 'PUNCH HOLDER',
    toolName: 'PUNCH HOLDER',
    currentStage: 'ENGINEERING',
    customer: 'Tata Motors',
  },
];

const mockRunningProjects = [
  {
    id: 'proj-1',
    projectCode: 'PRJ-101',
    name: 'DIE INSERT UPPER',
    toolName: 'DIE INSERT UPPER',
    category: 'TOOLING',
    currentStage: 'PRODUCTION',
  },
];

const mockLogs = [
  {
    id: 'log-1',
    type: 'MSDR',
    logDate: '2026-08-15',
    projectId: 'proj-1',
    projectCode: 'PRJ-101',
    projectName: 'DIE INSERT UPPER',
    projectToolName: 'DIE INSERT UPPER',
    section: 'MACHINE_SHOP',
    personName: 'Ramesh Sharma',
    machineOrTool: 'VMC-01',
    workStageOrOperation: 'Rough Milling Core',
    hoursSpent: 5.5,
    description: 'Milling upper pocket area',
    status: 'COMPLETED',
  },
  {
    id: 'log-2',
    type: 'DESIGNER',
    logDate: '2026-08-15',
    projectId: 'proj-2',
    projectCode: 'PRJ-102',
    projectName: 'PUNCH HOLDER',
    projectToolName: 'PUNCH HOLDER',
    section: 'ENGINEERING',
    personName: 'Anand Kumar',
    machineOrTool: 'CAD/CAM Station 2',
    workStageOrOperation: '3D Solid Modeling',
    hoursSpent: 6.0,
    description: '3D surface modeling completed',
    status: 'COMPLETED',
  },
];

jest.mock('@/hooks/useDailyReports', () => ({
  useGlobalDailyReports: () => ({
    data: mockLogs,
    isLoading: false,
    refetch: jest.fn(),
  }),
  useActiveRunningProjects: () => ({
    data: mockRunningProjects,
    isLoading: false,
  }),
  useCreateGlobalDesignerLog: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ success: true }),
    isPending: false,
  }),
  useCreateGlobalMsdrLog: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ success: true }),
    isPending: false,
  }),
}));

jest.mock('@/hooks/useProjects', () => ({
  useProjects: () => ({
    data: mockProjects,
    isLoading: false,
  }),
}));

jest.mock('@/hooks/useMasterLookups', () => ({
  useMasterLookups: (category: string) => {
    if (category === 'MACHINE') {
      return { options: [{ id: 'm1', label: 'VMC-01', code: 'VMC-01' }] };
    }
    if (category === 'EMPLOYEE') {
      return { options: [{ id: 'e1', label: 'Ramesh Sharma', code: 'EMP-01' }] };
    }
    return { options: [] };
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('ProjectToolMatrix Component', () => {
  test('renders summary KPI cards and active tools', () => {
    renderWithClient(<ProjectToolMatrix />);

    expect(screen.getByText(/Active Tools/i)).toBeInTheDocument();
    expect(screen.getByText(/In CAD\/CAM/i)).toBeInTheDocument();
    expect(screen.getByText(/In Machining/i)).toBeInTheDocument();
    expect(screen.getByText(/Logged Hours/i)).toBeInTheDocument();

    // Projects rendered
    expect(screen.getByText('PRJ-101')).toBeInTheDocument();
    expect(screen.getByText('PRJ-102')).toBeInTheDocument();
  });

  test('switches view mode between Matrix Grid, Tool Cards, and Workcenters', () => {
    renderWithClient(<ProjectToolMatrix />);

    // Default is Grid
    expect(screen.getByText('Tool / Project Info')).toBeInTheDocument();

    // Switch to Cards
    const cardsTab = screen.getByText('Tool Cards');
    fireEvent.click(cardsTab);
    expect(screen.getAllByText(/Total Time/i).length).toBeGreaterThan(0);

    // Switch to Workcenters
    const wcTab = screen.getByText('Workcenters');
    fireEvent.click(wcTab);
    expect(screen.getAllByText(/CAD\/CAM Design/i).length).toBeGreaterThan(0);
  });

  test('opens cell drilldown modal on clicking an active workcenter cell', () => {
    renderWithClient(<ProjectToolMatrix />);

    // Find hours button for 5.5h
    const cellBtn = screen.getAllByText(/5.5/i)[0];
    fireEvent.click(cellBtn);

    // Drilldown modal appears
    expect(screen.getByText(/Rough Milling Core/i)).toBeInTheDocument();
    expect(screen.getByText(/Milling upper pocket area/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Ramesh Sharma/i).length).toBeGreaterThan(0);

    // Close drilldown modal
    const closeBtn = screen.getByText(/Close Drilldown/i);
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/Close Drilldown/i)).not.toBeInTheDocument();
  });

  test('opens quick log modal and allows logging work', () => {
    renderWithClient(<ProjectToolMatrix />);

    // Click quick log button
    const quickLogBtns = screen.getAllByTitle(/Quick Log Toolroom Work/i);
    fireEvent.click(quickLogBtns[0]);

    // Modal appears
    expect(screen.getByText(/Quick Log Toolroom Work/i)).toBeInTheDocument();
    expect(screen.getByText(/Shopfloor MSDR/i)).toBeInTheDocument();

    // Close modal
    const cancelBtn = screen.getByText(/Cancel/i);
    fireEvent.click(cancelBtn);
    expect(screen.queryByText(/Quick Log Toolroom Work/i)).not.toBeInTheDocument();
  });

  test('filters projects by search term', () => {
    renderWithClient(<ProjectToolMatrix />);

    const searchInput = screen.getByPlaceholderText(/Search Tool #, Project, Part, Operator.../i);
    fireEvent.change(searchInput, { target: { value: 'PUNCH' } });

    expect(screen.getByText('PRJ-102')).toBeInTheDocument();
    expect(screen.queryByText('PRJ-101')).not.toBeInTheDocument();
  });
});
