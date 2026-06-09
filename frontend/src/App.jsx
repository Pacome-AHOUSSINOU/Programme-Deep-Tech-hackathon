import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EquipmentList from './pages/EquipmentList';
import EquipmentDetail from './pages/EquipmentDetail';
import EquipmentForm from './pages/EquipmentForm';
import BreakdownList from './pages/BreakdownList';
import BreakdownDetail from './pages/BreakdownDetail';
import BreakdownForm from './pages/BreakdownForm';
import SparePartsList from './pages/SparePartsList';
import SparePartsForm from './pages/SparePartsForm';
import Notifications from './pages/Notifications';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="equipment" element={<EquipmentList />} />
        <Route path="equipment/new" element={<EquipmentForm />} />
        <Route path="equipment/:id" element={<EquipmentDetail />} />
        <Route path="equipment/:id/edit" element={<EquipmentForm />} />
        <Route path="breakdowns" element={<BreakdownList />} />
        <Route path="breakdowns/new" element={<BreakdownForm />} />
        <Route path="breakdowns/:id" element={<BreakdownDetail />} />
        <Route path="spare-parts" element={<SparePartsList />} />
        <Route path="spare-parts/new" element={<SparePartsForm />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>;
}
