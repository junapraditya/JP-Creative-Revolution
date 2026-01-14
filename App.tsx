
import React, { useState, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Welcome } from './components/Welcome';
import { FeaturePanel } from './components/FeaturePanel';
import { FEATURES } from './constants';
import type { Feature } from './types';

const MenuIcon = (props: { className?: string }) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

export default function App(): React.ReactElement {
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const selectedFeature = useMemo((): Feature | undefined => {
    return FEATURES.find(f => f.id === selectedFeatureId);
  }, [selectedFeatureId]);
  
  const handleSelectFeature = (id: string) => {
    setSelectedFeatureId(id);
    setSidebarOpen(false); // Tutup sidebar saat item dipilih di seluler
  };

  return (
    <div className="relative min-h-screen md:flex bg-gray-50 font-sans">
      <Sidebar
        features={FEATURES}
        selectedFeatureId={selectedFeatureId}
        onSelectFeature={handleSelectFeature}
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="flex-1 p-4 sm:p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-6xl mx-auto">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="md:hidden p-3 mb-6 text-orange-600 bg-white rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            aria-label="Buka menu navigasi"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
          {selectedFeature ? (
            <FeaturePanel key={selectedFeature.id} feature={selectedFeature} />
          ) : (
            <Welcome />
          )}
        </div>
      </main>
    </div>
  );
}
