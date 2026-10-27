import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";

import { auth } from "../firebase/config";
import { gerarAlertas } from "../data/notasData";
import { useSchoolData } from "../context/SchoolDataContext";
import { useTutorial } from "../context/TutorialContext";

const menuItems = [
  { id: "inicio", to: "/inicio", label: "Início", icon: "🏠" },
  { id: "alunos", to: "/alunos", label: "Alunos", icon: "👥" },
  { id: "notas", to: "/notas", label: "Notas", icon: "📝" },
  { id: "risco", to: "/risco", label: "Risco", icon: "⚠️", showRiskBadge: true },
  { id: "evolucao", to: "/evolucao", label: "Evolução", icon: "📈" },
  { id: "destaques", to: "/destaques", label: "Destaques", icon: "⭐" },
  { id: "relatorios", to: "/relatorios", label: "Relatórios", icon: "📄" },
  { id: "configuracoes", to: "/configuracoes", label: "Configurações", icon: "⚙️" },
  { id: "ajuda", to: "/ajuda", label: "Ajuda", icon: "❔", featured: true },
];

const NOVIDADES_TUTORIAL_ID = "novidades-121";
const NOVIDADES_VISUALIZADAS_KEY = `notas-${NOVIDADES_TUTORIAL_ID}-visualizadas`;

export default function Sidebar() {
  const navigate = useNavigate();
  const { alunos, estruturaEscolar, limiaresNotas } = useSchoolData();
  const { iniciarTutorial } = useTutorial();
  const [novidadesVisualizadas, setNovidadesVisualizadas] = useState(() => {
    try {
      return window.localStorage.getItem(NOVIDADES_VISUALIZADAS_KEY) === "true";
    } catch {
      return false;
    }
  });
  const disciplinaPadrao = estruturaEscolar.disciplinas?.[0]?.id || "portugues";
  const bimestrePadrao = estruturaEscolar.bimestres?.[1]?.id || estruturaEscolar.bimestres?.[0]?.id || "b2";
  const alertasRisco = gerarAlertas({ alunos, disciplinaId: disciplinaPadrao, bimestreId: bimestrePadrao, limiares: limiaresNotas });
  const totalEmRisco = alertasRisco.length;
  const totalCriticos = alertasRisco.filter((alerta) => alerta.total < limiaresNotas.critico).length;
  const classeNovidades = "nav-link nav-link-button" + (novidadesVisualizadas ? "" : " updates-featured");

  const sair = async () => {
    await signOut(auth);
    navigate("/");
  };

  const abrirNovidades = () => {
    if (!novidadesVisualizadas) {
      setNovidadesVisualizadas(true);

      try {
        window.localStorage.setItem(NOVIDADES_VISUALIZADAS_KEY, "true");
      } catch {
        // Mantem o comportamento visual da sessao mesmo se o navegador bloquear o armazenamento local.
      }
    }

    iniciarTutorial(NOVIDADES_TUTORIAL_ID);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">PI</div>

        <div>
          <span>Sistema Escolar</span>
          <strong>Notas</strong>
        </div>
      </div>

      {totalEmRisco > 0 && (
        <NavLink className="sidebar-risk-alert" to="/risco">
          <span aria-hidden="true">⚠️</span>
          <div>
            <strong>{totalEmRisco} em risco</strong>
            <small>{totalCriticos} críticos agora</small>
          </div>
        </NavLink>
      )}

      <nav className="sidebar-nav" aria-label="Menu principal">
        <button
          type="button"
          className={classeNovidades}
          data-tour="nav-novidades"
          onClick={abrirNovidades}
        >
          <span className="nav-icon" aria-hidden="true">
            ✨
          </span>
          <span>Novidades</span>
        </button>

        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            data-tour={"nav-" + item.id}
            className={({ isActive }) => "nav-link " + (isActive ? "active " : "") + (item.featured ? "help-featured" : "")}
          >
            <span className="nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
            {item.showRiskBadge && totalEmRisco > 0 && (
              <span className="nav-badge">{totalEmRisco}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div>
          <span>Meta escolar</span>
          <strong>{limiaresNotas.meta} pontos</strong>
        </div>

        <button type="button" className="button ghost full-width" onClick={sair}>
          Sair
        </button>
      </div>
    </aside>
  );
}
