import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AddWarrantyPage from './pages/AddWarrantyPage';
import EditWarrantyPage from './pages/EditWarrantyPage';
import WarrantyDetailPage from './pages/WarrantyDetailPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
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
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
