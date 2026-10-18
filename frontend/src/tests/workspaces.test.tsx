import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BitPlaneInspector } from '../features/image-intelligence/BitPlaneInspector';
import { MultiCarrierWorkspace } from '../features/sharding/MultiCarrierWorkspace';
import { ProvenanceWorkspace } from '../features/provenance/ProvenanceWorkspace';

describe('BitPlaneInspector Component', () => {
  it('renders bit plane lab title and instructions', () => {
    render(<BitPlaneInspector />);
    expect(screen.getByText('Bit-Plane Slicer & Steganalysis Lab')).toBeInTheDocument();
    expect(screen.getByText(/Decompose carrier raster pixels into 8 independent binary bit planes/i)).toBeInTheDocument();
  });
});

describe('MultiCarrierWorkspace Component', () => {
  it('renders multi-carrier secret distribution workspace', () => {
    render(<MultiCarrierWorkspace />);
    expect(screen.getByText('Multi-Carrier Secret Distribution')).toBeInTheDocument();
    expect(screen.getByText('1. Split Secret (K of N)')).toBeInTheDocument();
    expect(screen.getByText('2. Reconstruct Secret')).toBeInTheDocument();
  });
});

describe('ProvenanceWorkspace Component', () => {
  it('renders image provenance studio and key options', () => {
    render(<ProvenanceWorkspace />);
    expect(screen.getByText('Image Provenance & Authenticity Lab')).toBeInTheDocument();
    expect(screen.getByText('1. Sign Image')).toBeInTheDocument();
    expect(screen.getByText('2. Verify Authenticity')).toBeInTheDocument();
  });
});
