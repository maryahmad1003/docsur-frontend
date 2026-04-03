import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import MedecinDashboard from '../pages/MedecinDashboard';
import PatientDashboard from '../pages/PatientDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import PharmacienDashboard from '../pages/PharmacienDashboard';
import LaborantinDashboard from '../pages/LaborantinDashboard';
import NotificationsPage from '../pages/NotificationsPage';
import ProfilPage from '../pages/ProfilPage';
import MessagesPage from '../components/shared/MessagesPage';

const AppRouter = () => {
  const { user } = useAuth();

  const getRedirect = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'medecin': return '/medecin';
      case 'patient': return '/patient';
      case 'administrateur': return '/admin';
      case 'pharmacien': return '/pharmacien';
      case 'laborantin': return '/laborantin';
      default: return '/login';
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />

        <Route path="/medecin/*" element={
          <ProtectedRoute roles={['medecin']}>
            <MedecinDashboard />
          </ProtectedRoute>
        } />

        <Route path="/patient/*" element={
          <ProtectedRoute roles={['patient']}>
            <PatientDashboard />
          </ProtectedRoute>
        } />

        <Route path="/admin/*" element={
          <ProtectedRoute roles={['administrateur']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/pharmacien/*" element={
          <ProtectedRoute roles={['pharmacien']}>
            <PharmacienDashboard />
          </ProtectedRoute>
        } />

        <Route path="/laborantin/*" element={
          <ProtectedRoute roles={['laborantin']}>
            <LaborantinDashboard />
          </ProtectedRoute>
        } />

        <Route path="/messages" element={
          <ProtectedRoute roles={['medecin','patient','administrateur','pharmacien','laborantin']}>
            <MessagesPage />
          </ProtectedRoute>
        } />

        <Route path="/notifications" element={
          <ProtectedRoute roles={['medecin','patient','administrateur','pharmacien','laborantin']}>
            <NotificationsPage />
          </ProtectedRoute>
        } />
        <Route path="/profil" element={
          <ProtectedRoute roles={['medecin','patient','administrateur','pharmacien','laborantin']}>
            <ProfilPage />
          </ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to={getRedirect()} />} />
        <Route path="*" element={<Navigate to={getRedirect()} />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;