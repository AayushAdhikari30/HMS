import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import LabAssistantDashboard from './pages/LabAssistantDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin-dashboard/*" element={<AdminDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
          <Route path="/doctor-dashboard/*" element={<DoctorDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
          <Route path="/patient-dashboard/*" element={<PatientDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['lab_assistant']} />}>
          <Route path="/lab-dashboard/*" element={<LabAssistantDashboard />} />
        </Route>

        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;