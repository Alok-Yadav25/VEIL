import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../app/providers/ThemeProvider';
import { ThemeSwitcher } from '../components/ui/ThemeSwitcher';
import { HeroSection } from '../components/landing/HeroSection';
import { FaqSection } from '../components/landing/FaqSection';

describe('ThemeSwitcher component', () => {
  it('renders with role="switch" and toggles theme on click', () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher variant="compact" />
      </ThemeProvider>
    );

    const switchBtn = screen.getByRole('switch');
    expect(switchBtn).toBeInTheDocument();
    
    // Initial state is dark (or light based on default)
    const initialChecked = switchBtn.getAttribute('aria-checked');
    
    fireEvent.click(switchBtn);
    
    const newChecked = switchBtn.getAttribute('aria-checked');
    expect(newChecked).not.toBe(initialChecked);
  });

  it('renders default variant with label when requested', () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher variant="default" showLabels />
      </ThemeProvider>
    );

    const switchBtn = screen.getByRole('switch');
    expect(switchBtn).toBeInTheDocument();
    expect(screen.getByText(/dark midnight|high contrast light/i)).toBeInTheDocument();
  });
});

describe('HeroSection component', () => {
  it('renders editorial headline and verified capability badges', () => {
    const handleNavigate = vi.fn();
    render(<HeroSection onNavigate={handleNavigate} />);

    expect(screen.getByText('Hide in plain sight.')).toBeInTheDocument();
    expect(screen.getByText('Privacy, embedded in pixels.')).toBeInTheDocument();
    expect(screen.getByText('Zero Remote Egress')).toBeInTheDocument();
    expect(screen.getByText('Authenticated AEAD')).toBeInTheDocument();
    expect(screen.getByText('Reed-Solomon FEC')).toBeInTheDocument();
    expect(screen.getByText('Shamir (K, N) Sharding')).toBeInTheDocument();
  });

  it('calls onNavigate when action buttons are clicked', () => {
    const handleNavigate = vi.fn();
    render(<HeroSection onNavigate={handleNavigate} />);

    const studioBtn = screen.getByRole('button', { name: /open the studio/i });
    fireEvent.click(studioBtn);
    expect(handleNavigate).toHaveBeenCalledWith('studio');

    const compareBtn = screen.getByRole('button', { name: /compare rasters/i });
    fireEvent.click(compareBtn);
    expect(handleNavigate).toHaveBeenCalledWith('compare');

    const faqBtn = screen.getByRole('button', { name: /technical faq/i });
    fireEvent.click(faqBtn);
    expect(handleNavigate).toHaveBeenCalledWith('learn');
  });
});

describe('FaqSection component', () => {
  it('renders technical FAQ items and expands upon click', () => {
    render(<FaqSection />);

    expect(screen.getByText(/Frequently Answered Technical Questions/i)).toBeInTheDocument();

    // Look for first question
    const q1 = screen.getByText(/How does VEIL hide data inside an image without making it visibly different/i);
    expect(q1).toBeInTheDocument();

    // Clicking expands the accordion
    fireEvent.click(q1);
    expect(screen.getAllByText(/Least Significant Bit/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Digital images store color values using 8 bits/i)).toBeInTheDocument();
  });

  it('filters questions via search input', () => {
    render(<FaqSection />);

    const searchInput = screen.getByPlaceholderText(/search steganography mechanics/i);
    fireEvent.change(searchInput, { target: { value: 'WhatsApp' } });

    expect(screen.getByText(/What happens if I save or upload the carrier as a JPEG/i)).toBeInTheDocument();
    expect(screen.queryByText(/What is Multi-Carrier Secret Sharding/i)).not.toBeInTheDocument();
  });
});
