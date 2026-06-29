import { NavLink, Outlet, useLocation } from "react-router-dom";

import AnoLetivoBadge from "../components/AnoLetivoBadge";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout() {
  const location = useLocation();
  const estaNaAjuda = location.pathname === "/ajuda";

  return (
    <div className="dashboard">
      <Sidebar />
      <main className="conteudo">
        <div className="content-topbar no-print">
          <AnoLetivoBadge />

          {!estaNaAjuda && (
            <NavLink className="page-help-link" to="/ajuda" data-tour="page-help-link">
              ❔ Ajuda desta página
            </NavLink>
          )}
        </div>

        <Outlet />
      </main>
    </div>
  );
}
