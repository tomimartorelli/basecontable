import React, { useState, useContext, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from "./components/Navbar";
import MenuMobile from "./components/MenuMobile";
import Facturas from "./pages/Facturas";
import Egresos from "./pages/Egresos";
import Cobranzas from "./pages/Cobranzas";
import Reportes from "./pages/Reportes";
import Clientes from "./pages/Clientes";
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Register from './pages/Register';
import Cuenta from './pages/Cuenta';

import { AuthContext } from './context/AuthContext';
import { ThemeContext } from './context/ThemeContext';

import Landing from './pages/Landing';
import Inicio from './pages/Inicio';
import Planes from './pages/Planes';
import QuienesSomos from './pages/QuienesSomos';
import Funcionalidades from './pages/Funcionalidades';
import AdminUsers from './pages/AdminUsers';
import AdminCompanies from './pages/AdminCompanies';
import AdminPlans from './pages/AdminPlans';
import AdminDashboard from './pages/AdminDashboard';
import AdminSystem from './pages/AdminSystem';
import Ayuda from './pages/Ayuda';
import Dashboard from './pages/Dashboard';
import ClientesDetalle from './pages/ClientesDetalle';
import PaisesDetalle from './pages/PaisesDetalle';
import FacturasImpagasDetalle from './pages/FacturasImpagasDetalle';
import DistribucionClientesDetalle from './pages/DistribucionClientesDetalle';
import EquipoUsuarios from './pages/EquipoUsuarios';
import EquipoAuditoria from './pages/EquipoAuditoria';
import CompletarPerfil from './pages/CompletarPerfil';

import PageTransition from './components/PageTransition';

// PWA y cola offline deshabilitados en el nuevo modelo

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Cargando...</div>;
  return user ? children : <Navigate to="/login" />;
};

const TeamRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;

  const slug = (user.currentPlan && typeof user.currentPlan === 'object' ? user.currentPlan.slug : '').toLowerCase();
  const hasEmployeeAccounts = !!user.unlockedFeatures?.employeeAccounts;
  const allowed = ['empresarial', 'enterprise'].includes(slug) && hasEmployeeAccounts;
  return allowed ? children : <Navigate to="/planes" replace />;
};

const inferPlanSlugFromFeatures = (unlockedFeatures) => {
  if (!unlockedFeatures) return null;

  // Enterprise (todo avanzado)
  if (
    unlockedFeatures.advancedAnalytics &&
    unlockedFeatures.prioritySupport &&
    unlockedFeatures.employeeAccounts &&
    unlockedFeatures.multiCompany &&
    unlockedFeatures.customTemplates &&
    unlockedFeatures.logoUpload &&
    unlockedFeatures.companyBranding
  ) {
    return 'enterprise';
  }

  // Empresarial
  if (unlockedFeatures.employeeAccounts && unlockedFeatures.multiCompany) {
    return 'empresarial';
  }

  // Profesional
  if (unlockedFeatures.customTemplates && unlockedFeatures.logoUpload) {
    return 'profesional';
  }

  // Básico
  if (unlockedFeatures.basicInvoicing && unlockedFeatures.basicTemplates) {
    return 'basico';
  }

  return null;
};

// Ruta protegida adicional para secciones de administración
// Regla de negocio: solo Super Admin o planes Empresarial / Enterprise
const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Cargando permisos...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Super admin siempre tiene acceso
  if (user.role === 'admin' && user.isSuperAdmin === true) {
    return children;
  }

  // Para el resto, depender solo del plan actual
  const directSlug = user.currentPlan && typeof user.currentPlan === 'object'
    ? user.currentPlan.slug
    : null;
  const inferredSlug = inferPlanSlugFromFeatures(user.unlockedFeatures);
  const planSlug = ((directSlug || inferredSlug) || '').toLowerCase();

  // Evitar decisiones prematuras: si todavía no tenemos slug (y no pudimos inferirlo),
  // esperamos a que el user se hidrate desde /api/users/me
  if (!planSlug) {
    return <div>Cargando permisos...</div>;
  }

  const hasAccessByPlan = ['empresarial', 'enterprise'].includes(planSlug);

  if (!hasAccessByPlan) {
    return <Navigate to="/planes" replace />;
  }

  return children;
};



function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [visible, setVisible] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setVisible(false);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setVisible(true);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    // Exponer función global para mostrar el banner manualmente
    window.showOfflineBanner = () => setVisible(true);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      delete window.showOfflineBanner;
    };
  }, []);

  if (!isOffline || !visible) return null;
  return (
    <div className="fixed top-0 left-0 w-full z-50 bg-red-600 text-white text-center py-2 font-semibold shadow-md animate-pulse flex items-center justify-center">
      <span>Sin conexión a internet. Algunos datos pueden no estar actualizados.</span>
      <button
        onClick={() => setVisible(false)}
        className="ml-4 px-2 py-0.5 rounded bg-red-800 hover:bg-red-900 text-white font-bold text-lg"
        aria-label="Cerrar aviso de sin conexión"
      >
        ×
      </button>
    </div>
  );
}

function App() {
  const [menuMobileOpen, setMenuMobileOpen] = useState(false);
  const { modoOscuro } = useContext(ThemeContext);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  // Monitorear estado de conexión
  useEffect(() => {
    const handleOnline = () => {
      setShowOfflineBanner(false);
    };
    
    const handleOffline = () => {
      setShowOfflineBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const appShellClass = modoOscuro
    ? 'min-h-screen bg-black text-white'
    : 'min-h-screen bg-white text-gray-900';

  return (
    <Router>
        {/* Banner de estado offline */}
        {showOfflineBanner && (
          <div className={`fixed top-0 left-0 right-0 z-50 p-4 text-center font-semibold ${
            modoOscuro 
              ? 'bg-yellow-900 text-yellow-200 border-b border-yellow-700' 
              : 'bg-yellow-100 text-yellow-900 border-b border-yellow-300'
          }`}>
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Sin conexión a internet. Los cambios se guardarán localmente.</span>
              <button
                onClick={() => setShowOfflineBanner(false)}
                className="ml-2 text-sm underline hover:no-underline"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        <OfflineBanner />
        <Routes>
          <Route path="/login" element={
            <div className={appShellClass}>
              <Navbar
              />
              <MenuMobile
                open={menuMobileOpen}
                onClose={() => setMenuMobileOpen(false)}
              />
              <Login />
            </div>
          } />
          <Route path="/register" element={
            <div className={appShellClass}>
              <Navbar
              />
              <MenuMobile
                open={menuMobileOpen}
                onClose={() => setMenuMobileOpen(false)}
              />
              <Register />
            </div>
          } />
          <Route path="/forgot-password" element={
            <div className={appShellClass}>
              <Navbar />
              <MenuMobile
                open={menuMobileOpen}
                onClose={() => setMenuMobileOpen(false)}
              />
              <ForgotPassword />
            </div>
          } />
          <Route path="/restablecer-clave" element={
            <div className={appShellClass}>
              <Navbar />
              <MenuMobile
                open={menuMobileOpen}
                onClose={() => setMenuMobileOpen(false)}
              />
              <ResetPassword />
            </div>
          } />
          <Route path="/completar-perfil" element={
            <PrivateRoute>
              <CompletarPerfil />
            </PrivateRoute>
          } />
          {/* Rutas de Administración */}
          <Route path="/admin/dashboard" element={
            <PrivateRoute>
              <AdminRoute>
                <div className={appShellClass}>
                  <Navbar />
                  <MenuMobile
                    open={menuMobileOpen}
                    onClose={() => setMenuMobileOpen(false)}
                  />
                  <main className="w-full min-h-[60vh]">
                    <AdminDashboard />
                  </main>
                </div>
              </AdminRoute>
            </PrivateRoute>
          } />
          <Route path="/admin/users" element={
            <PrivateRoute>
              <AdminRoute>
                <div className={appShellClass}>
                  <Navbar />
                  <MenuMobile
                    open={menuMobileOpen}
                    onClose={() => setMenuMobileOpen(false)}
                  />
                  <main className="w-full min-h-[60vh]">
                    <AdminUsers />
                  </main>
                </div>
              </AdminRoute>
            </PrivateRoute>
          } />
          <Route path="/admin/companies" element={
            <PrivateRoute>
              <AdminRoute>
                <div className={appShellClass}>
                  <Navbar />
                  <MenuMobile
                    open={menuMobileOpen}
                    onClose={() => setMenuMobileOpen(false)}
                  />
                  <main className="w-full min-h-[60vh]">
                    <AdminCompanies />
                  </main>
                </div>
              </AdminRoute>
            </PrivateRoute>
          } />
          <Route path="/admin/plans" element={
            <PrivateRoute>
              <AdminRoute>
                <div className={appShellClass}>
                  <Navbar />
                  <MenuMobile
                    open={menuMobileOpen}
                    onClose={() => setMenuMobileOpen(false)}
                  />
                  <main className="w-full min-h-[60vh]">
                    <AdminPlans />
                  </main>
                </div>
              </AdminRoute>
            </PrivateRoute>
          } />
          <Route path="/admin/system" element={
            <PrivateRoute>
              <AdminRoute>
                <div className={appShellClass}>
                  <Navbar />
                  <MenuMobile
                    open={menuMobileOpen}
                    onClose={() => setMenuMobileOpen(false)}
                  />
                  <main className="w-full min-h-[60vh]">
                    <AdminSystem />
                  </main>
                </div>
              </AdminRoute>
            </PrivateRoute>
          } />

          {/* Equipo (Empresarial) */}
          <Route path="/equipo/usuarios" element={
            <PrivateRoute>
              <TeamRoute>
                <div className={appShellClass}>
                  <Navbar />
                  <MenuMobile
                    open={menuMobileOpen}
                    onClose={() => setMenuMobileOpen(false)}
                  />
                  <main className="w-full min-h-[60vh]">
                    <EquipoUsuarios />
                  </main>
                </div>
              </TeamRoute>
            </PrivateRoute>
          } />
          <Route path="/equipo/auditoria" element={
            <PrivateRoute>
              <TeamRoute>
                <div className={appShellClass}>
                  <Navbar />
                  <MenuMobile
                    open={menuMobileOpen}
                    onClose={() => setMenuMobileOpen(false)}
                  />
                  <main className="w-full min-h-[60vh]">
                    <EquipoAuditoria />
                  </main>
                </div>
              </TeamRoute>
            </PrivateRoute>
          } />
          <Route path="/clientes" element={
            <PrivateRoute>
              <div className={appShellClass}>
                <Navbar
                />
                <MenuMobile
                  open={menuMobileOpen}
                  onClose={() => setMenuMobileOpen(false)}
                />
                <main className="w-full min-h-[60vh]">
                  <Clientes />
                </main>
              </div>
            </PrivateRoute>
          } />
          <Route path="/clientes-detalle" element={
            <PrivateRoute>
              <div className={appShellClass}>
                <Navbar
                />
                <MenuMobile
                  open={menuMobileOpen}
                  onClose={() => setMenuMobileOpen(false)}
                />
                <main className="w-full min-h-[60vh]">
                  <ClientesDetalle />
                </main>
              </div>
            </PrivateRoute>
          } />
          <Route path="/facturas" element={
            <PrivateRoute>
              <div className={appShellClass}>
                <Navbar
                />
                <MenuMobile
                  open={menuMobileOpen}
                  onClose={() => setMenuMobileOpen(false)}
                />
                <main className="w-full min-h-[60vh]">
                  <Facturas />
                </main>
              </div>
            </PrivateRoute>
          } />
          <Route path="/egresos" element={
            <PrivateRoute>
              <div className={appShellClass}>
                <Navbar />
                <MenuMobile
                  open={menuMobileOpen}
                  onClose={() => setMenuMobileOpen(false)}
                />
                <main className="w-full min-h-[60vh]">
                  <Egresos />
                </main>
              </div>
            </PrivateRoute>
          } />
          <Route path="/cobranzas" element={
            <PrivateRoute>
              <div className={appShellClass}>
                <Navbar />
                <MenuMobile
                  open={menuMobileOpen}
                  onClose={() => setMenuMobileOpen(false)}
                />
                <main className="w-full min-h-[60vh]">
                  <Cobranzas />
                </main>
              </div>
            </PrivateRoute>
          } />
          <Route path="/reportes" element={
            <PrivateRoute>
              <div className={appShellClass}>
                <Navbar />
                <MenuMobile
                  open={menuMobileOpen}
                  onClose={() => setMenuMobileOpen(false)}
                />
                <main className="w-full min-h-[60vh]">
                  <Reportes />
                </main>
              </div>
            </PrivateRoute>
          } />
          <Route path="/home" element={
            <PrivateRoute>
              <div className={appShellClass}>
                <Navbar
                />
                <MenuMobile
                  open={menuMobileOpen}
                  onClose={() => setMenuMobileOpen(false)}
                />
                <main className="w-full min-h-[60vh]">
                  <Inicio />
                </main>
              </div>
            </PrivateRoute>
          } />
          <Route path="/inicio" element={
            <PrivateRoute>
              <div className={appShellClass}>
                <Navbar
                />
                <MenuMobile
                  open={menuMobileOpen}
                  onClose={() => setMenuMobileOpen(false)}
                />
                <main className="w-full min-h-[60vh]">
                  <Inicio />
                </main>
              </div>
            </PrivateRoute>
          } />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <div className={appShellClass}>
                <Navbar
                />
                <MenuMobile
                  open={menuMobileOpen}
                  onClose={() => setMenuMobileOpen(false)}
                />
                <main className="w-full min-h-[60vh]">
                  <Dashboard />
                </main>
              </div>
            </PrivateRoute>
          } />
          <Route path="/paises-detalle" element={
            <PrivateRoute>
              <div className={appShellClass}>
                <Navbar
                />
                <MenuMobile
                  open={menuMobileOpen}
                  onClose={() => setMenuMobileOpen(false)}
                />
                <main className="w-full min-h-[60vh]">
                  <PaisesDetalle />
                </main>
              </div>
            </PrivateRoute>
          } />
          <Route path="/facturas-impagas-detalle" element={
            <PrivateRoute>
              <div className={appShellClass}>
                <Navbar
                />
                <MenuMobile
                  open={menuMobileOpen}
                  onClose={() => setMenuMobileOpen(false)}
                />
                <main className="w-full min-h-[60vh]">
                  <FacturasImpagasDetalle />
                </main>
              </div>
            </PrivateRoute>
          } />
          <Route path="/distribucion-clientes-detalle" element={
            <PrivateRoute>
              <div className={appShellClass}>
                <Navbar
                />
                <MenuMobile
                  open={menuMobileOpen}
                  onClose={() => setMenuMobileOpen(false)}
                />
                <main className="w-full min-h-[60vh]">
                  <DistribucionClientesDetalle />
                </main>
              </div>
            </PrivateRoute>
          } />
          <Route path="/cuenta" element={
            <PrivateRoute>
              <div className={appShellClass}>
                <Navbar
                />
                <MenuMobile
                  open={menuMobileOpen}
                  onClose={() => setMenuMobileOpen(false)}
                />
                <main className="w-full min-h-[60vh]">
                  <Cuenta />
                </main>
              </div>
            </PrivateRoute>
          } />
          {/* Ruta de plantillas eliminada */}
          <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
          <Route path="/planes" element={<PageTransition><Planes /></PageTransition>} />
          <Route path="/quienes-somos" element={<PageTransition><QuienesSomos /></PageTransition>} />
          <Route path="/ayuda" element={<PageTransition><Ayuda /></PageTransition>} />
          <Route path="/funcionalidades" element={<PageTransition><Funcionalidades /></PageTransition>} />
          <Route path="*" element={<div className="p-8">Página no encontrada</div>} />
        </Routes>

      </Router>
  );
}

export default App;
