import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AddWarrantyPage from './pages/AddWarrantyPage';
import EditWarrantyPage from './pages/EditWarrantyPage';
import WarrantyDetailPage from './pages/WarrantyDetailPage';
import ProtectedRoute from './components/ProtectedRoute';

// Public landing page component (using existing landing page code but wrapped)
// For simplicity in this structure, I'll redirect root to dashboard if logged in
// Otherwise show login. The original landing page code is kept separate or we could
// make it the default public route.
// Let's make a simple redirect wrapper for root
const RootRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return null;
  
  return isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={<Navigate to="/" replace />} 
          />
          
          <Route 
            path="/add" 
            element={
              <ProtectedRoute>
                <AddWarrantyPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/warranty/:id" 
            element={
              <ProtectedRoute>
                <WarrantyDetailPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/edit/:id" 
            element={
              <ProtectedRoute>
                <EditWarrantyPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
