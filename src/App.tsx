import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { PomodoroProvider } from "@/hooks/usePomodoro";
import { CreditsProvider } from "@/hooks/useCredits";
import { PurchaseCreditsModal } from "@/components/credits/PurchaseCreditsModal";
import { PremiumPaywall } from "@/components/PremiumPaywall";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Cours from "./pages/Cours";
import SubjectDetail from "./pages/SubjectDetail";
import SubjectGroup from "./pages/SubjectGroup";
import Schedule from "./pages/Schedule";

import ErrorNotebook from "./pages/ErrorNotebook";
import Kholles from "./pages/Kholles";
import ExamsBlancs from "./pages/ExamsBlancs";
import Annales from "./pages/Annales";
import InteractiveModules from "./pages/InteractiveModules";
import Flashcards from "./pages/Flashcards";
import QCMCreator from "./pages/QCMCreator";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import AdminAnnouncements from "./pages/AdminAnnouncements";
import AdminAffiliates from "./pages/AdminAffiliates";
import Settings from "./pages/Settings";
import Pomodoro from "./pages/Pomodoro";
import Leaderboard from "./pages/Leaderboard";
import Battles from "./pages/Battles";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Chargement...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AdminBlockedRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  if (isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Index />} />
        <Route path="/cours" element={<Cours />} />
        <Route path="/subject/:subjectId" element={<SubjectDetail />} />
        <Route path="/subject/:subjectId/folder/:folderId" element={<SubjectDetail />} />
        <Route path="/subject-group/:groupName" element={<SubjectGroup />} />
        <Route path="/schedule" element={<Schedule />} />
        
        <Route path="/errors" element={<AdminBlockedRoute><PremiumPaywall><ErrorNotebook /></PremiumPaywall></AdminBlockedRoute>} />
        <Route path="/kholles" element={<AdminBlockedRoute><PremiumPaywall><Kholles /></PremiumPaywall></AdminBlockedRoute>} />
        <Route path="/exams" element={<AdminBlockedRoute><PremiumPaywall><ExamsBlancs /></PremiumPaywall></AdminBlockedRoute>} />
        <Route path="/annales" element={<AdminBlockedRoute><PremiumPaywall><Annales /></PremiumPaywall></AdminBlockedRoute>} />
        <Route path="/modules" element={<InteractiveModules />} />
        <Route path="/flashcards" element={<AdminBlockedRoute><Flashcards /></AdminBlockedRoute>} />
        <Route path="/qcm-creator" element={<AdminBlockedRoute><QCMCreator /></AdminBlockedRoute>} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/announcements" element={<AdminAnnouncements />} />
        <Route path="/affiliates" element={<AdminAffiliates />} />
        <Route path="/pomodoro" element={<AdminBlockedRoute><Pomodoro /></AdminBlockedRoute>} />
        <Route path="/classement" element={<AdminBlockedRoute><Leaderboard /></AdminBlockedRoute>} />
        <Route path="/battles" element={<AdminBlockedRoute><Battles /></AdminBlockedRoute>} />
        <Route path="/statistiques" element={<Navigate to="/settings" replace />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <CreditsProvider>
              <PomodoroProvider>
                <Toaster />
                <Sonner />
                <PurchaseCreditsModal />
                <AppRoutes />
              </PomodoroProvider>
            </CreditsProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
