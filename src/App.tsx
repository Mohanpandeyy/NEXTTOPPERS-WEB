import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import Navbar from "@/components/layout/Navbar";
import Home from "@/pages/Home";
import Batches from "@/pages/Batches";
import BatchDetail from "@/pages/BatchDetail";
import MyClasses from "@/pages/MyClasses";
import AdminLayout from "@/pages/admin/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import AdminBatches from "@/pages/admin/AdminBatches";
import AdminPlaceholder from "@/pages/admin/AdminPlaceholder";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes with navbar */}
              <Route path="/" element={<><Navbar /><Home /></>} />
              <Route path="/batches" element={<><Navbar /><Batches /></>} />
              <Route path="/batch/:id" element={<><Navbar /><BatchDetail /></>} />
              <Route path="/my-classes" element={<><Navbar /><MyClasses /></>} />
              
              {/* Admin routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="batches" element={<AdminBatches />} />
                <Route path="lectures" element={<AdminPlaceholder />} />
                <Route path="timetables" element={<AdminPlaceholder />} />
                <Route path="users" element={<AdminPlaceholder />} />
                <Route path="media" element={<AdminPlaceholder />} />
                <Route path="settings" element={<AdminPlaceholder />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
