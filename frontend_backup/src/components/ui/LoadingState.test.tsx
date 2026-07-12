import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { LoadingState } from './LoadingState';

describe('LoadingState Component', () => {
  it('renders the default message when no message is provided', () => {
    render(<LoadingState />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders the provided message', () => {
    render(<LoadingState message="Processing data..." />);
    expect(screen.getByText('Processing data...')).toBeInTheDocument();
  });
});
