import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

// Partner Pages
import { LoginPage } from './pages/partner/LoginPage';
import { InvitePage } from './pages/partner/InvitePage';
import { DashboardPage } from './pages/partner/DashboardPage';
import { StatusPage } from './pages/partner/StatusPage';
import { AnnouncementsPage } from './pages/partner/AnnouncementsPage';
import { AnnouncementDetailPage } from './pages/partner/AnnouncementDetailPage';
import { SupportTicketsPage } from './pages/partner/SupportTicketsPage';
import { NewTicketPage } from './pages/partner/NewTicketPage';
import { TicketDetailPage } from './pages/partner/TicketDetailPage';
import { ContactPage } from './pages/partner/ContactPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminPartnersPage } from './pages/admin/AdminPartnersPage';
import { AdminPartnerDetailPage } from './pages/admin/AdminPartnerDetailPage';
import { AdminAnnouncementsPage } from './pages/admin/AdminAnnouncementsPage';
import { AdminSupportPage } from './pages/admin/AdminSupportPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';

// Protected Route Wrapper for Partners
const ProtectedPartnerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-purple-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/partner/login" replace />;
  }

  return <>{children}</>;
};

// Protected Route Wrapper for Admin
const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-purple-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user || role !== 'admin') {
    return <Navigate to="/partner/login" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/partner/login" element={<LoginPage />} />
          <Route path="/partner/invite" element={<InvitePage />} />

          {/* Protected Partner Routes */}
          <Route
            path="/partner/dashboard"
            element={
              <ProtectedPartnerRoute>
                <DashboardPage />
              </ProtectedPartnerRoute>
            }
          />
          <Route
            path="/partner/status"
            element={
              <ProtectedPartnerRoute>
                <StatusPage />
              </ProtectedPartnerRoute>
            }
          />
          <Route
            path="/partner/announcements"
            element={
              <ProtectedPartnerRoute>
                <AnnouncementsPage />
              </ProtectedPartnerRoute>
            }
          />
          <Route
            path="/partner/announcements/:id"
            element={
              <ProtectedPartnerRoute>
                <AnnouncementDetailPage />
              </ProtectedPartnerRoute>
            }
          />
          <Route
            path="/partner/support"
            element={
              <ProtectedPartnerRoute>
                <SupportTicketsPage />
              </ProtectedPartnerRoute>
            }
          />
          <Route
            path="/partner/support/new"
            element={
              <ProtectedPartnerRoute>
                <NewTicketPage />
              </ProtectedPartnerRoute>
            }
          />
          <Route
            path="/partner/support/:id"
            element={
              <ProtectedPartnerRoute>
                <TicketDetailPage />
              </ProtectedPartnerRoute>
            }
          />
          <Route
            path="/partner/contact"
            element={
              <ProtectedPartnerRoute>
                <ContactPage />
              </ProtectedPartnerRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminDashboardPage />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/partners"
            element={
              <ProtectedAdminRoute>
                <AdminPartnersPage />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/partners/:id"
            element={
              <ProtectedAdminRoute>
                <AdminPartnerDetailPage />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/announcements"
            element={
              <ProtectedAdminRoute>
                <AdminAnnouncementsPage />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/support"
            element={
              <ProtectedAdminRoute>
                <AdminSupportPage />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedAdminRoute>
                <AdminSettingsPage />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedAdminRoute>
                <AdminAuditLogsPage />
              </ProtectedAdminRoute>
            }
          />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/partner/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/partner/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
