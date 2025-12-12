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
import TodayLive from "@/pages/TodayLive";
import Notifications from "@/pages/Notifications";
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
import AdminLiveClasses from "@/pages/admin/AdminLiveClasses";
import AdminNotifications from "@/pages/admin/AdminNotifications";
import NotFound from "@/pages/NotFound";
import VerifySuccess from "@/pages/VerifySuccess";
import PremiumContent from "@/pages/PremiumContent";

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
            <Route path="/today-live" element={<><Navbar /><TodayLive /></>} />
            <Route path="/notifications" element={<><Navbar /><Notifications /></>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/verify-success" element={<VerifySuccess />} />
            <Route path="/premium-content" element={<><Navbar /><PremiumContent /></>} />
            
            {/* Admin routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="batches" element={<AdminBatches />} />
              <Route path="subjects" element={<AdminSubjects />} />
              <Route path="lectures" element={<AdminLectures />} />
              <Route path="live-classes" element={<AdminLiveClasses />} />
              <Route path="notifications" element={<AdminNotifications />} />
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
