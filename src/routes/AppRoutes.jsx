import { Navigate, Route, Routes } from "react-router-dom";

import DashboardLayout from "../layout/DashboardLayout";
import Ajuda from "../pages/Ajuda";
import Alunos from "../pages/Alunos";
import AnosAntigos from "../pages/AnosAntigos";
import Configuracoes from "../pages/Configuracoes";
import Destaques from "../pages/Destaques";
import Evolucao from "../pages/Evolucao";
import Inicio from "../pages/Inicio";
import Login from "../pages/Login";
import Notas from "../pages/Notas";
import Relatorios from "../pages/Relatorios";
import Risco from "../pages/Risco";
import { SchoolDataProvider } from "../context/SchoolDataContext";
import { TutorialProvider } from "../context/TutorialContext";
import { ProtectedRoute } from "./ProtectedRoutes";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <SchoolDataProvider>
              <TutorialProvider>
                <DashboardLayout />
              </TutorialProvider>
            </SchoolDataProvider>
          </ProtectedRoute>
        }
      >
        <Route path="/inicio" element={<Inicio />} />
        <Route path="/alunos" element={<Alunos />} />
        <Route path="/notas" element={<Notas />} />
        <Route path="/risco" element={<Risco />} />
        <Route path="/evolucao" element={<Evolucao />} />
        <Route path="/destaques" element={<Destaques />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="/ajuda" element={<Ajuda />} />
        <Route path="/anos-antigos" element={<AnosAntigos />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
