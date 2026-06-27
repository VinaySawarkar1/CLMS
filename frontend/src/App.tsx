import { useState } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import { isAuthed, getUser } from './api';
import Layout from './Layout';
import Login from './pages/Login';
import RegisterLab from './pages/RegisterLab';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import JobWorkspace from './pages/JobWorkspace';
import Customers from './pages/Customers';
import Instruments from './pages/Instruments';
import Certificates from './pages/Certificates';
import Tasks from './pages/Tasks';
import Engineers from './pages/Engineers';
import Inventory from './pages/Inventory';
import Environmental from './pages/Environmental';
import Quality from './pages/Quality';
import Notifications from './pages/Notifications';
import Labs from './pages/Labs';
import Users from './pages/Users';
import Permissions from './pages/Permissions';
import ReferenceStandards from './pages/ReferenceStandards';
import CalibrationMasters from './pages/CalibrationMasters';
import Hub from './pages/Hub';
import Complaints from './pages/Complaints';
import Feedback from './pages/Feedback';
import Reports from './pages/Reports';
import VerifyCertificate from './pages/VerifyCertificate';
import Documents from './pages/Documents';
import InternalAudit from './pages/InternalAudit';
import CustomerPortal from './pages/CustomerPortal';
import Settings from './pages/Settings';

function LoginRoute({ onSuccess }: { onSuccess: () => void }) {
  const nav = useNavigate();
  return <Login onSuccess={() => { onSuccess(); nav('/'); }} />;
}

function LayoutShell({ onLogout }: { onLogout: () => void }) {
  return (
    <Layout onLogout={onLogout}>
      <Outlet />
    </Layout>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(isAuthed());

  if (!authed) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/verify" element={<VerifyCertificate />} />
          <Route path="/verify/:id" element={<VerifyCertificate />} />
          <Route path="/portal" element={<CustomerPortal />} />
          <Route path="/register-lab" element={<RegisterLab />} />
          <Route path="/login" element={<LoginRoute onSuccess={() => setAuthed(true)} />} />
          <Route path="*" element={<LoginRoute onSuccess={() => setAuthed(true)} />} />
        </Routes>
      </BrowserRouter>
    );
  }

  const user = getUser();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isLabAdmin = user?.role === 'LAB_ADMIN';

  if (isSuperAdmin) {
    return (
      <BrowserRouter>
        <Layout onLogout={() => setAuthed(false)}>
          <Routes>
            <Route path="/" element={<Labs />} />
            <Route path="/labs" element={<Labs />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Hub launcher — full-screen, no sidebar */}
        <Route path="/" element={<Hub onLogout={() => setAuthed(false)} />} />

        {/* Public routes (accessible while logged in too) */}
        <Route path="/verify" element={<VerifyCertificate />} />
        <Route path="/verify/:id" element={<VerifyCertificate />} />
        <Route path="/portal" element={<CustomerPortal />} />

        {/* All other routes inside the sidebar Layout */}
        <Route element={<LayoutShell onLogout={() => setAuthed(false)} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/instruments" element={<Instruments />} />
          <Route path="/reference-standards" element={<ReferenceStandards />} />
          <Route path="/calibration-masters" element={<CalibrationMasters />} />
          <Route path="/complaints" element={<Complaints />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobWorkspace />} />
          <Route path="/certificates" element={<Certificates />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/engineers" element={<Engineers />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/environmental" element={<Environmental />} />
          <Route path="/quality" element={<Quality />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/internal-audit" element={<InternalAudit />} />
          <Route path="/notifications" element={<Notifications />} />
          {isLabAdmin && <Route path="/users" element={<Users />} />}
          {isLabAdmin && <Route path="/permissions" element={<Permissions />} />}
          {isLabAdmin && <Route path="/settings" element={<Settings />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
