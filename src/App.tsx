// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { DataLoader } from './components/DataLoader';
import { DashboardPage } from './components/Dashboard/DashboardPage';
import { VulnerabilityDetailPage } from './components/VulnerabilityDetail';
import { ComparisonPage } from './components/ComparisonView';
import { useAppSelector } from './store/hooks';

function App() {
  const isLoading = useAppSelector((s) => s.vulnerabilities.isLoading);
  const totalLoaded = useAppSelector((s) => s.vulnerabilities.totalLoaded);
  const error = useAppSelector((s) => s.vulnerabilities.error);

  return (
    <>
      <DataLoader />

      {error && (
        <div className="fixed inset-0 bg-gray-950 flex items-center justify-center z-50">
          <div className="text-center space-y-3 px-8">
            <div className="text-red-500 text-xl font-semibold">
              Failed to load dataset
            </div>
            <p className="text-gray-400 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!isLoading && !error && totalLoaded > 0 && (
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/vulnerability/:id" element={<VulnerabilityDetailPage />} />
          <Route path="/compare" element={<ComparisonPage />} />
        </Routes>
      )}
    </>
  );
}

export default App;