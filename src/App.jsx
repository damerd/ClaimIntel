import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import ClaimIntelMark from '@/components/brand/ClaimIntelMark';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import NewClaimReview from '@/pages/NewClaimReview';
import ClaimReviewResults from '@/pages/ClaimReviewResults';
import SavedReviews from '@/pages/SavedReviews';
import SettingsDisclaimer from '@/pages/SettingsDisclaimer';
import Pricing from '@/pages/Pricing';
import Documentation from '@/pages/Documentation';
import RequestAccess from '@/pages/RequestAccess';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import Security from '@/pages/Security';
import TermsOfUse from '@/pages/TermsOfUse';
import DataDeletionRequest from '@/pages/DataDeletionRequest';
import AdminPanel from '@/pages/AdminPanel';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4">
        <ClaimIntelMark size={48} />
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new-review" element={<NewClaimReview />} />
          <Route path="/review/:id" element={<ClaimReviewResults />} />
          <Route path="/saved-reviews" element={<SavedReviews />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/documentation" element={<Documentation />} />
          <Route path="/request-access" element={<RequestAccess />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/security" element={<Security />} />
          <Route path="/terms" element={<TermsOfUse />} />
          <Route path="/data-deletion" element={<DataDeletionRequest />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/settings" element={<SettingsDisclaimer />} />
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
        <SonnerToaster richColors position="top-right" />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App