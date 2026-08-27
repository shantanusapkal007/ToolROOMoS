import React from 'react';
import { render } from '@testing-library/react';
import { OfflineIndicator } from '../OfflineIndicator';
import { PwaRegister } from '../PwaRegister';

describe('PWA Components', () => {
  it('PwaRegister renders null without crashing', () => {
    const { container } = render(<PwaRegister />);
    expect(container.firstChild).toBeNull();
  });

  it('OfflineIndicator does not display banner when online', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    const { container } = render(<OfflineIndicator />);
    expect(container.firstChild).toBeNull();
  });
});
