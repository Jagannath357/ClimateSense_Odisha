import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Sidebar, PageId } from './components/Sidebar';
import { Footer } from './components/Footer';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { PredictionPage } from './pages/PredictionPage';
import { HistoricalPage } from './pages/HistoricalPage';
import { GeospatialClimateMap } from './pages/GeospatialClimateMap';
import { TrendsPage } from './pages/TrendsPage';
import { AnomaliesPage } from './pages/AnomaliesPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { AboutPage } from './pages/AboutPage';

export const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [predictionPrefill, setPredictionPrefill] = useState<{
    district: string;
    date?: string | null;
  } | null>(null);

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <OverviewPage onNavigateToPrediction={() => setCurrentPage('prediction')} />;
      case 'prediction':
        return (
          <PredictionPage
            initialDistrict={predictionPrefill?.district}
            initialDate={predictionPrefill?.date}
          />
        );
      case 'historical':
        return <HistoricalPage />;
      case 'geospatial':
        return (
          <GeospatialClimateMap
            onNavigateToDistrictDetails={(districtId, referenceDate) => {
              setPredictionPrefill({ district: districtId, date: referenceDate });
              setCurrentPage('prediction');
            }}
          />
        );
      case 'trends':
        return <TrendsPage />;
      case 'anomalies':
        return <AnomaliesPage />;
      case 'performance':
        return <ModelPerformancePage />;
      case 'about':
        return <AboutPage />;
      default:
        return <OverviewPage onNavigateToPrediction={() => setCurrentPage('prediction')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0a0f1d] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar
        onMenuClick={() => setIsSidebarOpen(prev => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex-1 flex w-full">
        <Sidebar
          currentPage={currentPage}
          onPageSelect={(page) => setCurrentPage(page)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {renderPage()}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;

