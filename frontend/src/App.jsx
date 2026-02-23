import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Onboarding from './pages/auth/Onboarding';

// Participant Pages
import Dashboard from './pages/participant/Dashboard';
import BrowseEvents from './pages/participant/BrowseEvents';
import EventDetails from './pages/participant/EventDetails';
import Profile from './pages/participant/Profile';
import Clubs from './pages/participant/Clubs';
import ClubDetail from './pages/participant/ClubDetail';

// Organizer Pages
import OrganizerDashboard from './pages/organizer/OrganizerDashboard';
import CreateEvent from './pages/organizer/CreateEvent';
import OrganizerEventDetail from './pages/organizer/OrganizerEventDetail';
import OrganizerProfile from './pages/organizer/OrganizerProfile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageOrganizers from './pages/admin/ManageOrganizers';
import PasswordResetRequests from './pages/admin/PasswordResetRequests';

import './App.css';

const HomeRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  switch (user.role) {
    case 'participant': return <Navigate to="/dashboard" />;
    case 'organizer': return <Navigate to="/organizer/dashboard" />;
    case 'admin': return <Navigate to="/admin/dashboard" />;
    default: return <Navigate to="/login" />;
  }
};

const Unauthorized = () => (
  <div style={{ textAlign: 'center', padding: '4rem', color: '#666' }}>
    <h1>Access Denied</h1>
    <p>You don't have permission to access this page.</p>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Participant Routes */}
          <Route path="/onboarding" element={
            <ProtectedRoute roles={['participant']}><Onboarding /></ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute roles={['participant']}><Dashboard /></ProtectedRoute>
          } />
          <Route path="/events" element={
            <ProtectedRoute roles={['participant']}><BrowseEvents /></ProtectedRoute>
          } />
          <Route path="/events/:id" element={
            <ProtectedRoute roles={['participant', 'organizer', 'admin']}><EventDetails /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute roles={['participant']}><Profile /></ProtectedRoute>
          } />
          <Route path="/clubs" element={
            <ProtectedRoute roles={['participant']}><Clubs /></ProtectedRoute>
          } />
          <Route path="/clubs/:id" element={
            <ProtectedRoute roles={['participant']}><ClubDetail /></ProtectedRoute>
          } />

          {/* Organizer Routes */}
          <Route path="/organizer/dashboard" element={
            <ProtectedRoute roles={['organizer']}><OrganizerDashboard /></ProtectedRoute>
          } />
          <Route path="/organizer/create-event" element={
            <ProtectedRoute roles={['organizer']}><CreateEvent /></ProtectedRoute>
          } />
          <Route path="/organizer/events/:id" element={
            <ProtectedRoute roles={['organizer']}><OrganizerEventDetail /></ProtectedRoute>
          } />
          <Route path="/organizer/profile" element={
            <ProtectedRoute roles={['organizer']}><OrganizerProfile /></ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/organizers" element={
            <ProtectedRoute roles={['admin']}><ManageOrganizers /></ProtectedRoute>
          } />
          <Route path="/admin/password-resets" element={
            <ProtectedRoute roles={['admin']}><PasswordResetRequests /></ProtectedRoute>
          } />

          {/* 404 */}
          <Route path="*" element={
            <div style={{ textAlign: 'center', padding: '4rem', color: '#ccc' }}>
              <h1>404</h1><p>Page not found</p>
            </div>
          } />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} theme="dark"
          toastStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }} />
      </AuthProvider>
    </Router>
  );
}

export default App;
