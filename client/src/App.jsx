// In client/src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// --- Page Imports ---
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import StudentManagementPage from "./pages/StudentManagementPage";
import EventManagementPage from "./pages/EventManagementPage";
import PublicEventPage from "./pages/PublicEventPage";
import VerificationPage from "./pages/VerificationPage";
import ClaimInvitePage from "./pages/ClaimInvitePage";
import AdminInvitePage from "./pages/AdminInvitePage";
import AdminRosterPage from "./pages/AdminRosterPage";
import StudentActivationPage from "./pages/StudentActivationPage";
import BrowseEventsPage from "./pages/BrowseEventsPage";
import StudentSetPasswordPage from "./pages/StudentSetPasswordPage";
import VerifierPortalPage from "./pages/VerifierPortalPage";
import Navbar from "./components/Navbar";
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// --- Route Protection Imports ---
import ProtectedRoute from "./components/ProtectedRoute";
import SuperAdminRoute from "./components/SuperAdminRoute";
import RoleRoute from "./components/RoleRoute";

import AdminAnalyticsPage from "./pages/AdminAnalyticsPage";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* --- Public Routes (No login needed) --- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/activate" element={<StudentActivationPage />} />
        <Route
          path="/activate-account/:token"
          element={<StudentSetPasswordPage />}
        />
        <Route path="/claim-invite/:token" element={<ClaimInvitePage />} />
        <Route path="/event/:id" element={<PublicEventPage />} />
        <Route path="/verify" element={<VerificationPage />} />
        <Route path="/verify/:certId" element={<VerificationPage />} />
        <Route path="/verifier" element={<VerifierPortalPage />} />{" "}
        {/* <-- ADD THIS */}
        <Route path="/" element={<LoginPage />} /> {/* Default to login */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        {/* --- General Protected Routes (Any logged-in user) --- */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        {/* --- Student Only Routes --- */}
        <Route
          path="/browse-events"
          element={
            <RoleRoute allowedRoles={["Student"]}>
              <BrowseEventsPage />
            </RoleRoute>
          }
        />
        {/* --- Faculty (Dept. Admin) & SuperAdmin Routes --- */}
        <Route
          path="/events"
          element={
            <RoleRoute allowedRoles={["SuperAdmin", "Faculty"]}>
              <EventManagementPage />
            </RoleRoute>
          }
        />
        {/* --- SuperAdmin Only Routes --- */}
        <Route
          path="/admin/invite"
          element={
            <SuperAdminRoute>
              <AdminInvitePage />
            </SuperAdminRoute>
          }
        />
        <Route
          path="/admin/roster"
          element={
            <SuperAdminRoute>
              <AdminRosterPage />
            </SuperAdminRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <SuperAdminRoute>
              <StudentManagementPage />
            </SuperAdminRoute>
          }
        />
        {/* --- SUPER ADMIN ROUTES --- */}
        <Route
          path="/admin/analytics" // <-- ADD THIS
          element={
            <SuperAdminRoute>
              <AdminAnalyticsPage />
            </SuperAdminRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
