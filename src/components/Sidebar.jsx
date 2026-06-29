import { NavLink } from "react-router-dom";

export default function Sidebar() {
    return (
        <aside className="sidebar">
            <h2>Gerenciador</h2>

            <nav>
                <NavLink to="/inicio">Início</NavLink>
                <NavLink to="/alunos">Alunos</NavLink>
                <NavLink to="/notas">Notas</NavLink>
                <NavLink to="/risco">Risco</NavLink>
                <NavLink to="/evolucao">Evolução</NavLink>
                <NavLink to="/destaques">Destaques</NavLink>
                <NavLink to="/relatorios">Relatórios</NavLink>
                <NavLink to="/configuracoes">Configurações</NavLink>
            </nav>
        </aside>
    );
}