import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import CategoryPage from './pages/CategoryPage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RecommendationFormPage from './pages/RecommendationFormPage';
import RegisterPage from './pages/RegisterPage';
import ResultsPage from './pages/ResultPage';


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public */}
              <Route path="/"          element={<HomePage />} />
              <Route path="/login"     element={<LoginPage />} />
              <Route path="/register"  element={<RegisterPage />} />

              {/* Protected */}
              <Route element={<ProtectedRoute />}>
                <Route path="/category"           element={<CategoryPage />} />
                <Route path="/recommend/:category" element={<RecommendationFormPage />} />
                <Route path="/results"             element={<ResultsPage />} />
                <Route path="/dashboard"           element={<DashboardPage />} />
              </Route>
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}