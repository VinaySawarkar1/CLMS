import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { isAuthed } from './api';
import Layout from './Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Customers from './pages/Customers';
import Instruments from './pages/Instruments';
import Certificates from './pages/Certificates';
import Tasks from './pages/Tasks';
import Engineers from './pages/Engineers';
import Inventory from './pages/Inventory';
import Environmental from './pages/Environmental';
import Quality from './pages/Quality';
import Billing from './pages/Billing';
import Audit from './pages/Audit';
import Notifications from './pages/Notifications';

export default function App() {
  const [authed, setAuthed] = useState(isAuthed());

  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;

  return (
    <BrowserRouter>
      <Layout onLogout={() => setAuthed(false)}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/instruments" element={<Instruments />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/certificates" element={<Certificates />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/engineers" element={<Engineers />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/environmental" element={<Environmental />} />
          <Route path="/quality" element={<Quality />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
