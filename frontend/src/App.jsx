import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        //write protectedRoute with all the resp. roles at the end not writing now due to dev proces
        //PR for Admin
          <Route path="/admin-dashboard/*" element={<AdminDashboard />} />
        

       //PR for Doctor
          <Route path="/doctor-dashboard/*" element={<DoctorDashboard />} />
      

        //PR for Patient
          <Route path="/patient-dashboard/*" element={<PatientDashboard />} />
        

        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;