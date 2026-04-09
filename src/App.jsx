import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { setupIframeMessaging } from './lib/iframe-messaging';
import PageNotFound from './lib/PageNotFound';
import AppHome from './pages/AppHome';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

setupIframeMessaging();

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const ProtectedRoutes = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

  // Show loading spinner while checking auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors — redirect to public landing page
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      window.location.replace('/');
      return null;
    }
  }

  if (!isAuthenticated) {
    window.location.replace('/');
    return null;
  }

  // Render authenticated app
  return (
    <LayoutWrapper currentPageName={mainPageKey}>
      <Routes>
        <Route path="/" element={<MainPage />} />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route key={path} path={`/${path}`} element={<Page />} />
        ))}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </LayoutWrapper>
  );
};

const AppRouter = () => {
  const { isAuthenticated, isLoadingAuth, isLoadingPublicSettings } = useAuth();

  // While loading, show spinner
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <Routes>
        <Route path="/" element={<AppHome />} />
        <Route path="*" element={
          <div className="fixed inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
          </div>
        } />
      </Routes>
    );
  }

  // If authenticated, show protected routes
  if (isAuthenticated) {
    return <ProtectedRoutes />;
  }

  // Not authenticated — show public landing on "/", redirect everything else
  return (
    <Routes>
      <Route path="/" element={<AppHome />} />
      <Route path="*" element={<AppHome />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AppRouter />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App