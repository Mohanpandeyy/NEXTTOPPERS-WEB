import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SupabaseAuthProvider } from "@/hooks/useSupabaseAuth";
import Navbar from "@/components/layout/Navbar";
import Home from "@/pages/Home";
import Batches from "@/pages/Batches";
import BatchDetail from "@/pages/BatchDetail";
import MyClasses from "@/pages/MyClasses";
import Auth from "@/pages/Auth";
import AdminLayout from "@/pages/admin/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import AdminBatches from "@/pages/admin/AdminBatches";
import AdminSubjects from "@/pages/admin/AdminSubjects";
import AdminLectures from "@/pages/admin/AdminLectures";
import AdminTimetables from "@/pages/admin/AdminTimetables";
import AdminUsersNew from "@/pages/admin/AdminUsersNew";
import AdminMedia from "@/pages/admin/AdminMedia";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminCustomSections from "@/pages/admin/AdminCustomSections";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SupabaseAuthProvider>
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
            <Route path="/auth" element={<Auth />} />
            
            {/* Admin routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="batches" element={<AdminBatches />} />
              <Route path="subjects" element={<AdminSubjects />} />
              <Route path="lectures" element={<AdminLectures />} />
              <Route path="timetables" element={<AdminTimetables />} />
              <Route path="users" element={<AdminUsersNew />} />
              <Route path="sections" element={<AdminCustomSections />} />
              <Route path="media" element={<AdminMedia />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </SupabaseAuthProvider>
  </QueryClientProvider>
);

export default App;
