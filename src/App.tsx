import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';

import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { GenerateDriftPage } from './pages/GenerateDriftPage';
import { PredictionPage } from './pages/PredictionPage';
import { VisualizationPage } from './pages/VisualizationPage';
import { PerformancePage } from './pages/PerformancePage';
import { ComparisonPage } from './pages/ComparisonPage';
import { ReportPage } from './pages/ReportPage';
import { SettingsPage } from './pages/SettingsPage';
import DatasetUploader, { LoadedDataset } from "./DatasetUploader";

function AppContent() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isDashboard = location.pathname === '/dashboard' || (!isLanding && !['/upload', '/simulator', '/prediction', '/visualization', '/performance', '/comparison', '/reports', '/settings'].includes(location.pathname));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [loadedDataset, setLoadedDataset] = useState<LoadedDataset | null>(null);

  const handleDatasetLoaded = (dataset: LoadedDataset) => {
    setLoadedDataset(dataset);
    console.log(`Loaded ${dataset.files.length} images`);
    if (dataset.metadata) {
      console.log("Metadata rows:", dataset.metadata.length);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col">
      <Navbar />

      {isLanding ? (
        <main className="flex-1">
          <LandingPage />
        </main>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
            <div className="max-w-7xl mx-auto">
              {isDashboard && (
                <div className="mb-6">
                  <DatasetUploader onLoaded={handleDatasetLoaded} />
                </div>
              )}
              <Routes>
                <Route path="/dashboard" element={<DashboardPage loadedDataset={loadedDataset} />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/simulator" element={<GenerateDriftPage />} />
                <Route path="/prediction" element={<PredictionPage loadedDataset={loadedDataset} />} />
                <Route path="/visualization" element={<VisualizationPage />} />
                <Route path="/performance" element={<PerformancePage />} />
                <Route path="/comparison" element={<ComparisonPage />} />
                <Route path="/reports" element={<ReportPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<DashboardPage loadedDataset={loadedDataset} />} />
              </Routes>
            </div>
          </main>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
