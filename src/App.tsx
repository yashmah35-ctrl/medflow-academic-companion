import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import SubjectDetail from "./pages/SubjectDetail";
import Schedule from "./pages/Schedule";
import ActiveLearning from "./pages/ActiveLearning";
import ErrorNotebook from "./pages/ErrorNotebook";
import Kholles from "./pages/Kholles";
import ExamsBlancs from "./pages/ExamsBlancs";
import Annales from "./pages/Annales";
import InteractiveModules from "./pages/InteractiveModules";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Chargement...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Index />} />
        <Route path="/subject/:subjectId" element={<SubjectDetail />} />
        <Route path="/subject/:subjectId/folder/:folderId" element={<SubjectDetail />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/learning" element={<ActiveLearning />} />
        <Route path="/errors" element={<ErrorNotebook />} />
        <Route path="/kholles" element={<Kholles />} />
        <Route path="/exams" element={<ExamsBlancs />} />
        <Route path="/annales" element={<Annales />} />
        <Route path="/modules" element={<InteractiveModules />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
