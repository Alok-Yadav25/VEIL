import React from 'react';
import {
  LayoutDashboard,
  Lock,
  Unlock,
  SlidersHorizontal,
  BarChart2,
  Sparkles,
  Shield,
  Clock,
  BookOpen,
  Settings,
  HelpCircle,
  X,
  Share2,
  Layers,
  Award,
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpen,
  onClose,
}) => {
  const sections: NavSection[] = [
    {
      items: [
        {
          id: 'overview',
          label: 'Overview',
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
      ],
    },
    {
      title: 'WORKSPACE',
      items: [
        {
          id: 'hide',
          label: 'Hide Data',
          icon: <Lock className="w-4 h-4 text-brand-violet" />,
        },
        {
          id: 'extract',
          label: 'Extract Data',
          icon: <Unlock className="w-4 h-4 text-emerald-400" />,
        },
        {
          id: 'compare',
          label: 'Compare Images',
          icon: <SlidersHorizontal className="w-4 h-4 text-cyan-400" />,
        },
        {
          id: 'sharding',
          label: 'Secret Sharding',
          icon: <Share2 className="w-4 h-4 text-violet-400" />,
          badge: 'K of N',
        },
      ],
    },
    {
      title: 'IMAGE INTELLIGENCE',
      items: [
        {
          id: 'bitplane',
          label: 'Bit-Plane Slicer',
          icon: <Layers className="w-4 h-4 text-cyan-400" />,
          badge: 'Forensics',
        },
        {
          id: 'provenance',
          label: 'Image Provenance',
          icon: <Award className="w-4 h-4 text-emerald-400" />,
          badge: 'Ed25519',
        },
        {
          id: 'analyzer',
          label: 'Capacity Analyzer',
          icon: <BarChart2 className="w-4 h-4 text-indigo-400" />,
        },
        {
          id: 'inspector',
          label: 'Image Inspector',
          icon: <Sparkles className="w-4 h-4 text-amber-400" />,
        },
      ],
    },
    {
      title: 'TRUST & ACTIVITY',
      items: [
        {
          id: 'security',
          label: 'Security Center',
          icon: <Shield className="w-4 h-4 text-emerald-400" />,
        },
        {
          id: 'history',
          label: 'Operation History',
          icon: <Clock className="w-4 h-4 text-sky-400" />,
        },
      ],
    },
    {
      title: 'RESOURCES',
      items: [
        {
          id: 'learn',
          label: 'Steganography Explorer',
          icon: <BookOpen className="w-4 h-4 text-fuchsia-400" />,
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: <Settings className="w-4 h-4 text-slate-400" />,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800/80 p-4 flex flex-col justify-between overflow-y-auto transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Mobile close button */}
          <div className="flex items-center justify-between md:hidden pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Navigation
            </span>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Sections */}
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {section.title && (
                <h4 className="px-3 text-[10px] font-mono font-semibold tracking-wider text-slate-500 uppercase">
                  {section.title}
                </h4>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all select-none ${
                        isActive
                          ? 'bg-slate-800/90 text-slate-100 font-semibold shadow-sm border border-slate-700/60'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`p-1 rounded-lg transition-colors ${
                            isActive ? 'bg-slate-950 shadow-inner' : 'bg-transparent'
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <HelpCircle className="w-3.5 h-3.5 text-brand-cyan" />
              <span>Offline First</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              No cloud uploads. All stego & crypto operations run via local Java backend.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
