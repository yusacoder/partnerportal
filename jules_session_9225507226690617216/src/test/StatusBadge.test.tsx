import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from '../components/StatusBadge';

describe('StatusBadge Component', () => {
  it('renders Normal status badge correctly', () => {
    render(<StatusBadge status="Normal" />);
    expect(screen.getByText('Normal')).toBeInTheDocument();
  });

  it('renders Şüpheli status badge correctly', () => {
    render(<StatusBadge status="Şüpheli" />);
    expect(screen.getByText('Şüpheli')).toBeInTheDocument();
  });

  it('renders Riskli status badge correctly', () => {
    render(<StatusBadge status="Riskli" />);
    expect(screen.getByText('Riskli')).toBeInTheDocument();
  });

  it('renders Askıda status badge correctly', () => {
    render(<StatusBadge status="Askıda" />);
    expect(screen.getByText('Askıda')).toBeInTheDocument();
  });

  it('renders ticket status Yeni correctly', () => {
    render(<StatusBadge status="Yeni" />);
    expect(screen.getByText('Yeni')).toBeInTheDocument();
  });
});
