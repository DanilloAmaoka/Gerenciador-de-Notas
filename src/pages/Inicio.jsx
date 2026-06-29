import { useState } from "react";
import { NavLink } from "react-router-dom";

import {
  BIMESTRES,
  DISCIPLINAS,
  calcularResumo,
  gerarAlertas,
  obterBimestreNome,
  obterDisciplinaNome,
} from "../data/notasData";
import { useSchoolData } from "../context/SchoolDataContext";

export default function Inicio() {
  const [disciplinaId, setDisciplinaId] = useState("portugues");
  const [bimestreId, setBimestreId] = useState("b2");
  const { alunos, estruturaEscolar, limiaresNotas } = useSchoolData();
  const disciplinasEscolares = estruturaEscolar.disciplinas || DISCIPLINAS;
  const bimestresEscolares = estruturaEscolar.bimestres || BIMESTRES;
  const disciplinaNome = disciplinasEscolares.find((disciplina) => disciplina.id === disciplinaId)?.nome || obterDisciplinaNome(disciplinaId);
  const bimestreNome = bimestresEscolares.find((bimestre) => bimestre.id === bimestreId)?.nome || obterBimestreNome(bimestreId);

  const resumo = calcularResumo({ alunos, disciplinaId, bimestreId, limiares: limiaresNotas });
  const notasDoPeriodoZeradas =
    resumo.totalAlunos > 0 && resumo.registros.every((registro) => registro.total === 0);
  const alertas = gerarAlertas({ alunos, disciplinaId, bimestreId, limiares: limiaresNotas }).slice(0, 5);
  const ranking = [...resumo.registros].sort((a, b) => b.total - a.total).slice(0, 5);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Painel geral</span>
          <h1>Início</h1>
          <p>
            Visão do desempenho em {disciplinaNome} no{" "}
            {bimestreNome}.
          </p>
        </div>

        <div className="filter-row compact">
          <label>
            <span>Disciplina</span>
            <select value={disciplinaId} onChange={(event) => setDisciplinaId(event.target.value)}>
              {disciplinasEscolares.map((disciplina) => (
                <option key={disciplina.id} value={disciplina.id}>
                  {disciplina.nome}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Bimestre</span>
            <select value={bimestreId} onChange={(event) => setBimestreId(event.target.value)}>
              {bimestresEscolares.map((bimestre) => (
                <option key={bimestre.id} value={bimestre.id}>
                  {bimestre.nome}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {notasDoPeriodoZeradas && (
        <section className="notice-banner warning" data-tour="aviso-notas-zeradas">
          <strong>Início de ano com notas zeradas</strong>
          <p>
            Quando um novo ano letivo começa, as notas dos alunos ficam zeradas. Por isso, até
            lançar as primeiras notas, o sistema pode mostrar todos como críticos.
          </p>
        </section>
      )}

      <section className="overview-panel" data-tour="inicio-resumo">
        <div>
          <span className="pill light">Meta institucional: {limiaresNotas.meta} pontos</span>
          <h2>Média geral: {resumo.media}</h2>
          <p>{resumo.reforco + resumo.critico} alunos abaixo da meta neste recorte.</p>
        </div>

        <div className="score-ring">
          <strong>{resumo.media}</strong>
          <span>de 100</span>
        </div>
      </section>

      <section className="metrics-grid" data-tour="inicio-metricas">
        <article className="metric-card">
          <span>Alunos avaliados</span>
          <strong>{resumo.totalAlunos}</strong>
          <p>3º, 4º e 5º ano</p>
        </article>

        <article className="metric-card success">
          <span>Alunos nota 10</span>
          <strong>{resumo.destaque}</strong>
          <p>Acima de {limiaresNotas.destaque} pontos</p>
        </article>

        <article className="metric-card warning">
          <span>Reforço</span>
          <strong>{resumo.reforco}</strong>
          <p>Entre {limiaresNotas.critico} e {limiaresNotas.meta - 1} pontos</p>
        </article>

        <article className="metric-card danger">
          <span>Críticos</span>
          <strong>{resumo.critico}</strong>
          <p>Abaixo de {limiaresNotas.critico} pontos</p>
        </article>
      </section>

      <section className="content-grid two-columns" data-tour="inicio-alertas">
        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Alertas</span>
              <h2>Prioridades do bimestre</h2>
            </div>
            <NavLink className="text-link" to="/risco">Ver risco</NavLink>
          </div>

          <div className="list-stack">
            {alertas.map((alerta) => (
              <div className="alert-row" key={alerta.id}>
                <div>
                  <strong>{alerta.aluno.nome}</strong>
                  <span>
                    {alerta.aluno.ano} · Turma {alerta.aluno.turma} · {alerta.motivo}
                  </span>
                </div>
                <span className={"status-badge " + alerta.status.classe}>{alerta.total}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Ranking</span>
              <h2>Melhores notas</h2>
            </div>
            <NavLink className="text-link" to="/destaques">Ver destaques</NavLink>
          </div>

          <div className="ranking-list">
            {ranking.map((registro, index) => (
              <div className="ranking-row" key={registro.id}>
                <span>{index + 1}</span>
                <div>
                  <strong>{registro.aluno.nome}</strong>
                  <small>{registro.aluno.ano} · Turma {registro.aluno.turma}</small>
                </div>
                <strong>{registro.total}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="shortcut-grid" data-tour="inicio-atalhos">
        <NavLink to="/notas">Lançar notas</NavLink>
        <NavLink to="/evolucao">Ver evolução</NavLink>
        <NavLink to="/alunos">Gerenciar alunos</NavLink>
        <NavLink to="/relatorios">Abrir relatórios</NavLink>
        <NavLink to="/ajuda" className="help-shortcut" data-tour="inicio-ajuda">Abrir ajuda</NavLink>
      </section>
    </div>
  );
}
