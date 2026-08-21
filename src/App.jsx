import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Outlet, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';
// Layout stays eager — it is the shell around every routed page.
import Layout from '@/components/Layout';

// Pages are route-level code-split: each becomes its own chunk, fetched on first visit.
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Database = lazy(() => import('@/pages/Database'));
const Designs = lazy(() => import('@/pages/Designs'));
const Theatre = lazy(() => import('@/pages/Theatre'));
const ThreatClock = lazy(() => import('@/pages/ThreatClock'));
const Dossier = lazy(() => import('@/pages/Dossier'));
const GameConstants = lazy(() => import('@/pages/GameConstants'));
const FleetAnalysis = lazy(() => import('@/pages/FleetAnalysis'));
const StealthAnalysis = lazy(() => import('@/pages/StealthAnalysis'));
const ResourcePlan = lazy(() => import('@/pages/ResourcePlan'));
const DriveSync = lazy(() => import('@/pages/DriveSync'));
const EconomyAnalysis = lazy(() => import('@/pages/EconomyAnalysis'));
const Compare = lazy(() => import('@/pages/Compare'));
const CombatLab = lazy(() => import('@/pages/CombatLab'));
const TechTree = lazy(() => import('@/pages/TechTree'));
const GameData = lazy(() => import('@/pages/GameData'));
const ImportData = lazy(() => import('@/pages/ImportData'));
const DataOps = lazy(() => import('@/pages/DataOps'));
const Install = lazy(() => import('@/pages/Install'));

// Pathless layout route rendered INSIDE <Layout/>'s <Outlet/>: the Suspense
// fallback and any page crash stay confined to the routed area, so the shell
// (nav, toaster) never unmounts. Keyed by pathname so a fault clears on navigation.
const RoutedArea = () => {
  const location = useLocation();
  return (
    <ErrorBoundary key={location.pathname}>
      <Suspense
        fallback={
          <div className="schematic-panel p-12 tech-label text-center animate-pulse">
            Loading module…
          </div>
        }
      >
        <Outlet />
      </Suspense>
    </ErrorBoundary>
  );
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Add your page Route elements here */}
      <Route element={<Layout />}>
        <Route element={<RoutedArea />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/resources" element={<ResourcePlan />} />
          <Route path="/sync" element={<DriveSync />} />
          <Route path="/database" element={<Database />} />
          <Route path="/designs" element={<Designs />} />
          <Route path="/theatre" element={<Theatre />} />
          <Route path="/threat" element={<ThreatClock />} />
          <Route path="/dossier" element={<Dossier />} />
          <Route path="/constants" element={<GameConstants />} />
          <Route path="/fleet" element={<FleetAnalysis />} />
          <Route path="/stealth" element={<StealthAnalysis />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/economy" element={<EconomyAnalysis />} />
          <Route path="/combat" element={<CombatLab />} />
          <Route path="/tech" element={<TechTree />} />
          <Route path="/data" element={<DataOps />} />
          <Route path="/install" element={<Install />} />
          <Route path="/gamedata" element={<GameData />} />
          <Route path="/import" element={<ImportData />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
