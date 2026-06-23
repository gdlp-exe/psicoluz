import { Routes, Route } from 'react-router-dom';
import PsicoLuz from './components/PsicoLuz';
import LoginPage from './components/auth/LoginPage';
import { GuestRoute } from './components/Routeguards'; // Importa el guardia

function App() {
  return (
    <Routes>
      <Route path="/" element={<PsicoLuz />} />
      
      {/* Usamos GuestRoute para que solo los NO autenticados vean el login */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      
      {/* Ejemplo de cómo usarías tus otros guards:
      <Route element={<ProtectedRoute />}>
         <Route path="/dashboard" element={<Dashboard />} />
      </Route>
      */}
    </Routes>
  );
}

export default App;