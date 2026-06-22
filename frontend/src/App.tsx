import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { isAuthed } from './api';
import Layout from './Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Customers from './pages/Customers';
import Tasks from './pages/Tasks';

export default function App() {
  const [authed, setAuthed] = useState(isAuthed());

  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;

  return (
    <BrowserRouter>
      <Layout onLogout={() => setAuthed(false)}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
