import React from 'react';
import { render, screen } from '@testing-library/react';
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
  Sliders: () => <div data-testid="sliders-icon" />
}));

// Mock the toast hook
jest.mock('../../ui/Toast', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn()
  })
}));

describe('BomConverter Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders initial upload state correctly', () => {
    render(<BomConverter projectId="123" project={{}} materials={[]} onSaveBOM={jest.fn()} />);
    
    expect(screen.getByText(/Drag & Drop Engineering BOM Excel/i)).toBeInTheDocument();
  });
});
