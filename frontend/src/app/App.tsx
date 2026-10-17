import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './providers/ThemeProvider';
import { ToastProvider } from '../components/feedback/Toast';
import { ErrorBoundary } from '../components/feedback/ErrorBoundary';
import { Navbar } from '../components/navigation/Navbar';
import { Sidebar } from '../components/navigation/Sidebar';
import { CommandPalette } from '../components/navigation/CommandPalette';

import { OverviewDashboard } from '../features/dashboard/OverviewDashboard';
import { HideDataWorkspace } from '../features/encode/HideDataWorkspace';
import { ExtractDataWorkspace } from '../features/extract/ExtractDataWorkspace';
import { CompareImagesView } from '../features/image-intelligence/CompareImagesView';
import { CapacityAnalyzer } from '../features/image-intelligence/CapacityAnalyzer';
import { ImageInspector } from '../features/image-intelligence/ImageInspector';
import { SecurityCenter } from '../features/security/SecurityCenter';
import { OperationHistoryView } from '../features/history/OperationHistoryView';
import { SteganographyExplorer } from '../features/learning/SteganographyExplorer';
import { SettingsView } from '../features/settings/SettingsView';
import { EncodeResponse } from '../types';

export const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  // Cross-workspace transfer state (e.g. from Encode success to Compare)
  const [transferOriginalFile, setTransferOriginalFile] = useState<File | null>(null);
  const [transferEncodedSrc, setTransferEncodedSrc] = useState<string | null>(null);

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

  const handleNavigateToCompare = (
    original: File,
    encodedBase64: string,
    _response: EncodeResponse
  ) => {
    setTransferOriginalFile(original);
    setTransferEncodedSrc(encodedBase64);
    setCurrentView('compare');
  };

  const renderActiveView = () => {
    switch (currentView) {
      case 'overview':
        return <OverviewDashboard onNavigate={setCurrentView} />;
      case 'hide':
        return (
          <HideDataWorkspace
            onNavigate={setCurrentView}
            onNavigateToCompare={handleNavigateToCompare}
          />
        );
      case 'extract':
        return <ExtractDataWorkspace />;
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
      case 'security':
        return <SecurityCenter />;
      case 'history':
        return <OperationHistoryView />;
      case 'learn':
        return <SteganographyExplorer />;
      case 'settings':
        return <SettingsView />;
      default:
        return <OverviewDashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-violet selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        currentView={currentView}
      />

      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 md:pl-64 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)] overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={setCurrentView}
      />
    </div>
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
