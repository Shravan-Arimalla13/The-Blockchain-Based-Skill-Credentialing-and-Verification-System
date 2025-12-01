// In client/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner"; 

// --- Page Imports ---
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentManagementPage from './pages/StudentManagementPage';
import EventManagementPage from './pages/EventManagementPage';
import PublicEventPage from './pages/PublicEventPage';
import VerificationPage from './pages/VerificationPage';
import ClaimInvitePage from './pages/ClaimInvitePage';
import AdminInvitePage from './pages/AdminInvitePage';
import AdminRosterPage from './pages/AdminRosterPage';
import StudentActivationPage from './pages/StudentActivationPage';
import BrowseEventsPage from './pages/BrowseEventsPage';
import FacultyQuizManager from './pages/FacultyQuizManager';
import StudentQuizList from './pages/StudentQuizList';
import TakeQuizPage from './pages/TakeQuizPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import StudentSetPasswordPage from './pages/StudentSetPasswordPage'; // <-- THIS WAS MISSING

// --- Component Imports ---
import Navbar from './components/Navbar'; 
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminRoute from './components/SuperAdminRoute';
import RoleRoute from './components/RoleRoute';
import ErrorBoundary from './components/ErrorBoundary'; 

function App() {
  return (
    <Router>
      {/* Navbar sits OUTSIDE of Routes so it appears on every page */}
      <Navbar />
      
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/activate" element={<StudentActivationPage />} />
        <Route path="/activate-account/:token" element={<StudentSetPasswordPage />} />
        <Route path="/claim-invite/:token" element={<ClaimInvitePage />} />
        <Route path="/event/:id" element={<PublicEventPage />} />
        <Route path="/verify" element={<VerificationPage />} />
        <Route path="/verify/:certId" element={<VerificationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/" element={<LoginPage />} />

        {/* --- Protected Routes --- */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <DashboardPage />
              </ErrorBoundary>
            </ProtectedRoute>
          } 
        />
        
        {/* --- Student Routes --- */}
        <Route 
          path="/browse-events"
          element={<RoleRoute allowedRoles={['Student']}><BrowseEventsPage /></RoleRoute>}
        />
        <Route 
          path="/student/quizzes" 
          element={<RoleRoute allowedRoles={['Student']}><StudentQuizList /></RoleRoute>} 
        />
        <Route 
          path="/take-quiz/:quizId" 
          element={
            <RoleRoute allowedRoles={['Student']}>
              <ErrorBoundary>
                <TakeQuizPage />
              </ErrorBoundary>
            </RoleRoute>
          } 
        />

        {/* --- Faculty & SuperAdmin Routes --- */}
        <Route 
          path="/events" 
          element={<RoleRoute allowedRoles={['SuperAdmin', 'Faculty']}><EventManagementPage /></RoleRoute>} 
        />
        <Route 
          path="/faculty/quiz" 
          element={<RoleRoute allowedRoles={['SuperAdmin', 'Faculty']}><FacultyQuizManager /></RoleRoute>} 
        />

        {/* --- SuperAdmin Only Routes --- */}
        <Route 
          path="/admin/invite" 
          element={<SuperAdminRoute><AdminInvitePage /></SuperAdminRoute>} 
        />
        <Route 
          path="/admin/roster" 
          element={<SuperAdminRoute><AdminRosterPage /></SuperAdminRoute>} 
        />
        <Route 
          path="/admin/students" 
          element={<SuperAdminRoute><StudentManagementPage /></SuperAdminRoute>} 
        />
        <Route 
          path="/admin/analytics" 
          element={<SuperAdminRoute><AdminAnalyticsPage /></SuperAdminRoute>} 
        />

      </Routes>

      {/* --- TOASTER MUST BE HERE (Outside Routes) --- */}
      <Toaster position="top-center" richColors />
      
    </Router>
  );
}

export default App;