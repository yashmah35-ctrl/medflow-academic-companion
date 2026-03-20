import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import Index from "./pages/Index";
import SubjectDetail from "./pages/SubjectDetail";
import Schedule from "./pages/Schedule";
import ActiveLearning from "./pages/ActiveLearning";
import ErrorNotebook from "./pages/ErrorNotebook";
import Kholles from "./pages/Kholles";
import ExamsBlancs from "./pages/ExamsBlancs";
import Annales from "./pages/Annales";
import InteractiveModules from "./pages/InteractiveModules";
import Flashcards from "./pages/Flashcards";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import AdminAnnouncements from "./pages/AdminAnnouncements";
import Settings from "./pages/Settings";
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
  if (isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Index />} />
        <Route path="/subject/:subjectId" element={<SubjectDetail />} />
        <Route path="/subject/:subjectId/folder/:folderId" element={<SubjectDetail />} />
        <Route path="/schedule" element={<AdminBlockedRoute><Schedule /></AdminBlockedRoute>} />
        <Route path="/learning" element={<AdminBlockedRoute><ActiveLearning /></AdminBlockedRoute>} />
        <Route path="/errors" element={<AdminBlockedRoute><ErrorNotebook /></AdminBlockedRoute>} />
        <Route path="/kholles" element={<AdminBlockedRoute><Kholles /></AdminBlockedRoute>} />
        <Route path="/exams" element={<AdminBlockedRoute><ExamsBlancs /></AdminBlockedRoute>} />
        <Route path="/annales" element={<AdminBlockedRoute><Annales /></AdminBlockedRoute>} />
        <Route path="/modules" element={<AdminBlockedRoute><InteractiveModules /></AdminBlockedRoute>} />
        <Route path="/flashcards" element={<AdminBlockedRoute><Flashcards /></AdminBlockedRoute>} />
        <Route path="/settings" element={<AdminBlockedRoute><Settings /></AdminBlockedRoute>} />
        <Route path="/announcements" element={<AdminAnnouncements />} />
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
            <Toaster />
            <Sonner />
            <AppRoutes />
          </SubscriptionProvider>
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
