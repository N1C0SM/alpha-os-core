import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { OnboardingGuard } from "@/components/auth/OnboardingGuard";
import { WebLayout } from "@/components/layout/WebLayout";

// Pages
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import TodayPage from "./pages/TodayPage";
import TrainingPage from "./pages/TrainingPage";
import ActiveWorkoutPage from "./pages/ActiveWorkoutPage";
import NutritionPage from "./pages/NutritionPage";
// HabitsPage removed from MVP
import ProfilePage from "./pages/ProfilePage";
import PersonalDataPage from "./pages/PersonalDataPage";
import GoalsPage from "./pages/GoalsPage";
import SchedulePage from "./pages/SchedulePage";
import SettingsPage from "./pages/SettingsPage";
import InstallPage from "./pages/InstallPage";
import PremiumPage from "./pages/PremiumPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SubscriptionProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Onboarding (requires auth but not onboarding completion) */}
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              } />
              
              {/* Protected routes with web layout */}
              <Route element={
                <ProtectedRoute>
                  <OnboardingGuard>
                    <WebLayout />
                  </OnboardingGuard>
                </ProtectedRoute>
              }>
                <Route path="/" element={<TodayPage />} />
                <Route path="/entreno" element={<TrainingPage />} />
                <Route path="/entreno/activo" element={<ActiveWorkoutPage />} />
                <Route path="/nutricion" element={<NutritionPage />} />
                <Route path="/perfil" element={<ProfilePage />} />
                <Route path="/perfil/datos" element={<PersonalDataPage />} />
                <Route path="/perfil/objetivos" element={<GoalsPage />} />
                <Route path="/perfil/horarios" element={<SchedulePage />} />
                <Route path="/perfil/config" element={<SettingsPage />} />
                <Route path="/instalar" element={<InstallPage />} />
                <Route path="/premium" element={<PremiumPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Route>
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
