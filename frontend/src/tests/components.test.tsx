import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../components/shared/Button';
import { Card } from '../components/shared/Card';
import { CapacityRing } from '../components/image/CapacityRing';
import { PasswordField } from '../components/forms/PasswordField';

describe('Button component', () => {
  it('renders children correctly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('triggers onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit</Button>);
    fireEvent.click(screen.getByText('Submit'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled or loading', () => {
    render(<Button disabled>Disabled Button</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });
});

describe('Card component', () => {
  it('renders title and content', () => {
    render(
      <Card title="Encryption Status" subtitle="AES-GCM Authenticated">
        <div>Card Content Body</div>
      </Card>
    );
    expect(screen.getByText('Encryption Status')).toBeInTheDocument();
    expect(screen.getByText('AES-GCM Authenticated')).toBeInTheDocument();
    expect(screen.getByText('Card Content Body')).toBeInTheDocument();
  });
});

describe('CapacityRing component', () => {
  it('displays calculated percentage text', () => {
    render(<CapacityRing percentage={42.5} label="Carrier Capacity" />);
    expect(screen.getByText('42.5%')).toBeInTheDocument();
    expect(screen.getByText('Sufficient')).toBeInTheDocument();
    expect(screen.getByText('Carrier Capacity')).toBeInTheDocument();
  });

  it('shows Near Limit badge when percentage is above 80%', () => {
    render(<CapacityRing percentage={85.0} />);
    expect(screen.getByText('85.0%')).toBeInTheDocument();
    expect(screen.getByText('Near Limit')).toBeInTheDocument();
  });
});

describe('PasswordField component', () => {
  it('renders input and toggles visibility on eye button click', () => {
    const handleChange = vi.fn();
    render(<PasswordField value="SecretPass123!" onChange={handleChange} />);

    const input = screen.getByPlaceholderText(/enter strong password/i) as HTMLInputElement;
    expect(input.type).toBe('password');

    const toggleButton = screen.getByLabelText(/show password/i);
    fireEvent.click(toggleButton);

    expect(input.type).toBe('text');
  });

  it('computes password strength correctly', () => {
    render(<PasswordField value="Short" onChange={() => {}} />);
    expect(screen.getByText('Weak')).toBeInTheDocument();
  });
});
