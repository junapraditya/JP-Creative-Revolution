
import React from 'react';
import type { Feature } from '../types';

interface SidebarProps {
  features: Feature[];
  selectedFeatureId: string | null;
  onSelectFeature: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const CloseIcon = (props: { className?: string }) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const JpLogo = () => (
    <div className="flex items-center gap-3">
      <div className="flex flex-col">
        <span className="font-black text-xl leading-none text-gray-900 tracking-tighter">JP CREATIVE</span>
        <span className="text-[10px] font-bold text-orange-600 tracking-[0.2em] uppercase">Revolution</span>
      </div>
    </div>
  );

export const Sidebar: React.FC<SidebarProps> = ({ features, selectedFeatureId, onSelectFeature, isOpen, onClose }) => {
  return (
    <>
      {/* Overlay untuk seluler */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
        aria-hidden="true"
      ></div>

      <aside className={`fixed inset-y-0 left-0 z-30 w-72 bg-white flex-shrink-0 border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out md:static md:inset-auto md:translate-x-0 md:shadow-md ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full p-6 flex flex-col">
          <div className="flex items-center justify-between pb-8">
            <JpLogo />
            <button onClick={onClose} className="md:hidden text-gray-500 hover:text-orange-600" aria-label="Tutup menu navigasi">
                <CloseIcon className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto">
            <h2 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Master Console</h2>
            <ul className="space-y-1.5">
              {features.map((feature) => (
                <li key={feature.id}>
                  <button
                    onClick={() => onSelectFeature(feature.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 group transform ${
                      selectedFeatureId === feature.id
                        ? 'bg-orange-600 text-white shadow-orange-200 shadow-lg'
                        : 'text-gray-600 hover:bg-orange-50 hover:text-orange-700'
                    }`}
                  >
                    <feature.icon className={`w-5 h-5 mr-3 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${selectedFeatureId === feature.id ? '' : 'text-gray-400 group-hover:text-orange-600'}`} />
                    <span>{feature.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div className="pt-4 border-t border-gray-100">
             <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-center">Premium Member Access</p>
             </div>
          </div>
        </div>
      </aside>
    </>
  );
};
