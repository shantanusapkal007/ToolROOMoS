import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';
import { SearchInput } from '../SearchInput';
import { Select } from '../Select';
import { Tabs } from '../Tabs';
import { StatusBadge } from '../StatusBadge';

describe('Design System UI Components', () => {
  describe('Button Component', () => {
    it('renders primary variant correctly', () => {
      render(<Button variant="primary">Open Daily Report Sheet</Button>);
      const button = screen.getByRole('button', { name: /Open Daily Report Sheet/i });
      expect(button).toBeInTheDocument();
      expect(button.className).toContain('bg-primary');
      expect(button.className).toContain('text-white');
    });

    it('renders secondary variant correctly', () => {
      render(<Button variant="secondary">Export CSV</Button>);
      const button = screen.getByRole('button', { name: /Export CSV/i });
      expect(button).toBeInTheDocument();
      expect(button.className).toContain('border-border-gray');
      expect(button.className).toContain('text-ink');
    });

    it('renders icon-only variant with accessible aria-label', () => {
      render(
        <Button variant="icon-only" aria-label="Settings Gear">
          <span data-testid="icon">⚙</span>
        </Button>
      );
      const button = screen.getByRole('button', { name: /Settings Gear/i });
      expect(button).toBeInTheDocument();
      expect(button.className).toContain('aspect-square');
    });

    it('handles loading state with spinner and disables button', () => {
      render(<Button variant="primary" isLoading>Submit Log</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('handles disabled state', () => {
      render(<Button variant="primary" disabled>Disabled Action</Button>);
      const button = screen.getByRole('button', { name: /Disabled Action/i });
      expect(button).toBeDisabled();
    });
  });

  describe('SearchInput Component', () => {
    it('renders local context search input with placeholder', () => {
      render(
        <SearchInput
          context="local"
          placeholder="Search logs, tools..."
          value="test query"
          onChange={() => {}}
        />
      );
      const input = screen.getByPlaceholderText('Search logs, tools...');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('test query');
    });

    it('renders global context with shortcut badge and triggers palette', () => {
      const onGlobalTrigger = jest.fn();
      render(
        <SearchInput
          context="global"
          shortcutKey="⌘K"
          onGlobalTrigger={onGlobalTrigger}
        />
      );
      const button = screen.getByRole('button', { name: /Global search command palette/i });
      expect(button).toBeInTheDocument();
      expect(screen.getByText('⌘K')).toBeInTheDocument();

      fireEvent.click(button);
      expect(onGlobalTrigger).toHaveBeenCalledTimes(1);
    });
  });

  describe('Select Component', () => {
    it('renders dropdown options with rotating chevron indicator', () => {
      render(
        <Select
          label="Filter by Project"
          options={[
            { label: 'All Projects', value: 'ALL' },
            { label: 'Project Alpha', value: 'ALPHA' },
          ]}
          value="ALL"
          onChange={() => {}}
        />
      );
      expect(screen.getByText('Filter by Project')).toBeInTheDocument();
      expect(screen.getByText('All Projects')).toBeInTheDocument();
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    });
  });

  describe('Tabs Component', () => {
    it('renders tab list and triggers onChange callback', () => {
      const onChange = jest.fn();
      render(
        <Tabs
          activeTab="ALL"
          onChange={onChange}
          tabs={[
            { id: 'ALL', label: 'All Reports', count: 5 },
            { id: 'SHEET', label: 'Daily Report Sheet' },
            { id: 'MATRIX', label: 'Matrix' },
          ]}
        />
      );

      const allTab = screen.getByRole('tab', { name: /All Reports/i });
      const sheetTab = screen.getByRole('tab', { name: /Daily Report Sheet/i });

      expect(allTab).toHaveAttribute('aria-selected', 'true');
      expect(sheetTab).toHaveAttribute('aria-selected', 'false');

      fireEvent.click(sheetTab);
      expect(onChange).toHaveBeenCalledWith('SHEET');
    });
  });

  describe('StatusBadge Component', () => {
    it('renders semantic success status badge', () => {
      render(<StatusBadge status="COMPLETED" size="sm" />);
      const badge = screen.getByText('COMPLETED');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('bg-semantic-success-subtle');
      expect(badge.className).toContain('text-semantic-success-dark');
    });

    it('renders semantic warning status badge', () => {
      render(<StatusBadge status="MAINTENANCE" size="sm" />);
      const badge = screen.getByText('MAINTENANCE');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('bg-semantic-warning-subtle');
    });
  });
});
