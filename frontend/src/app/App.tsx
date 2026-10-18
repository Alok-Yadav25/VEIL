import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './providers/ThemeProvider';
import { ToastProvider } from '../components/feedback/Toast';
import { ErrorBoundary } from '../components/feedback/ErrorBoundary';
import { AppShell } from '../components/layout/AppShell';
import { CommandPalette } from '../components/navigation/CommandPalette';

import { StudioWorkspace, StudioStage, StudioMode } from '../features/studio/StudioWorkspace';
import { OverviewDashboard } from '../features/dashboard/OverviewDashboard';
import { CompareImagesView } from '../features/image-intelligence/CompareImagesView';
import { CapacityAnalyzer } from '../features/image-intelligence/CapacityAnalyzer';
import { ImageInspector } from '../features/image-intelligence/ImageInspector';
import { SecurityCenter } from '../features/security/SecurityCenter';
import { OperationHistoryView } from '../features/history/OperationHistoryView';
import { SteganographyExplorer } from '../features/learning/SteganographyExplorer';
import { SettingsView } from '../features/settings/SettingsView';
import { BitPlaneInspector } from '../features/image-intelligence/BitPlaneInspector';
import { MultiCarrierWorkspace } from '../features/sharding/MultiCarrierWorkspace';
import { ProvenanceWorkspace } from '../features/provenance/ProvenanceWorkspace';
import { EncodeResponse } from '../types';

const getInitialView = (): string => {
  if (typeof window === 'undefined') return 'overview';
  const path = window.location.pathname.replace(/^\/+/, '').toLowerCase();
  if (!path || path === 'overview') return 'overview';
  const validViews = [
    'studio',
    'compare',
    'security',
    'history',
    'faq',
    'learn',
    'analyzer',
    'inspector',
    'bitplane',
    'sharding',
    'provenance',
    'settings',
  ];
  if (validViews.includes(path)) {
    return path;
  }
  return 'overview';
};

export const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>(getInitialView);
  const [studioMode, setStudioMode] = useState<StudioMode>('hide');
  const [studioStage, setStudioStage] = useState<StudioStage>(2);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  // Cross-workspace transfer state (from Studio to Compare)
  const [transferOriginalFile, setTransferOriginalFile] = useState<File | null>(null);
  const [transferEncodedSrc, setTransferEncodedSrc] = useState<string | null>(null);

  // Sync browser popstate (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\/+/, '').toLowerCase();
      setCurrentView(path || 'overview');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Global Cmd/Ctrl + K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (viewId: string) => {
    let targetView = viewId;
    if (viewId === 'extract') {
      targetView = 'studio';
      setStudioMode('extract');
    } else if (viewId === 'hide' || viewId === 'studio') {
      targetView = 'studio';
      setStudioMode('hide');
    }
    setCurrentView(targetView);

    if (typeof window !== 'undefined') {
      const targetPath = targetView === 'overview' ? '/' : `/${targetView}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    }
  };

  const renderActiveView = () => {
    switch (currentView) {
      case 'studio':
      case 'hide':
        return (
          <StudioWorkspace
            key={`studio-${studioMode}`}
            initialMode={studioMode}
            onStageChange={setStudioStage}
            onModeChange={setStudioMode}
            onNavigateToView={setCurrentView}
          />
        );
      case 'overview':
        return <OverviewDashboard onNavigate={handleNavigate} />;
      case 'compare':
        return (
          <CompareImagesView
            initialOriginalFile={transferOriginalFile}
            initialEncodedSrc={transferEncodedSrc}
          />
        );
      case 'analyzer':
        return <CapacityAnalyzer />;
      case 'inspector':
        return <ImageInspector />;
      case 'bitplane':
        return <BitPlaneInspector />;
      case 'sharding':
        return <MultiCarrierWorkspace />;
      case 'provenance':
        return <ProvenanceWorkspace />;
      case 'security':
        return <SecurityCenter />;
      case 'history':
        return <OperationHistoryView onNavigate={handleNavigate} />;
      case 'faq':
      case 'learn':
        return <SteganographyExplorer />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <StudioWorkspace
            key={`studio-${studioMode}`}
            initialMode={studioMode}
            onStageChange={setStudioStage}
            onModeChange={setStudioMode}
            onNavigateToView={setCurrentView}
          />
        );
    }
  };

  return (
    <AppShell
      currentView={currentView}
      onNavigate={handleNavigate}
      onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      studioStage={studioStage}
      studioMode={studioMode}
      onStudioModeChange={(newMode) => {
        setStudioMode(newMode);
        if (currentView !== 'studio') setCurrentView('studio');
      }}
    >
      {renderActiveView()}

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
      />
    </AppShell>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
