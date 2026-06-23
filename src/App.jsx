import { Routes, Route } from 'react-router-dom'; // Importa las rutas
import PsicoLuz from './components/PsicoLuz';
import Login from './components/Login'; // Asegúrate de tener este componente

function App() {
  return (
    <Routes>
      <Route path="/" element={<PsicoLuz />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

export default App;