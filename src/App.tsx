import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

import MainLayout from "@/layouts/MainLayout";
import AuthLayout from "@/layouts/AuthLayout";
import DashboardLayout from "@/layouts/DashboardLayout";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Onboarding from "@/pages/Onboarding";
import PropertySearch from "@/pages/PropertySearch";
import PropertyDetail from "@/pages/PropertyDetail";
import BookInspection from "@/pages/BookInspection";
import AgentDashboard from "@/pages/AgentDashboard";
import LandlordDashboard from "@/pages/LandlordDashboard";

import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public pages */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/book/:id" element={<BookInspection />} />
            </Route>

            {/* Auth pages */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/property/:id" element={<PropertyDetail />} />
              <Route path="/onboarding" element={<Onboarding />} />
            </Route>

            {/* Dashboards */}
            <Route element={<DashboardLayout />}>
              <Route
                path="/listings"
                element={
                  <ProtectedRoute allowedRoles={["tenant", "agent", "landlord"]}>
                    <PropertySearch />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agent-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["agent"]}>
                    <AgentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/landlord-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["landlord"]}>
                    <LandlordDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/book-inspection" element={<BookInspection />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
