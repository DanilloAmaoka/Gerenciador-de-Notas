import { useMemo, useState } from "react";

import {
  ANOS,
  BIMESTRES,
  DISCIPLINAS,
  TURMAS,
  gerarAlertas,
  obterBimestreNome,
  obterDisciplinaNome,
} from "../data/notasData";
import { useSchoolData } from "../context/SchoolDataContext";

export default function Risco() {
  const [disciplinaId, setDisciplinaId] = useState("portugues");
  const [bimestreId, setBimestreId] = useState("b2");
  const [ano, setAno] = useState("Todos");
  const [turma, setTurma] = useState("Todas");
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("Todos");
  const { alunos, estruturaEscolar, limiaresNotas } = useSchoolData();
  const anosEscolares = estruturaEscolar.anosEscolares || ANOS;
  const turmasEscolares = estruturaEscolar.turmas || TURMAS;
  const disciplinasEscolares = estruturaEscolar.disciplinas || DISCIPLINAS;
  const bimestresEscolares = estruturaEscolar.bimestres || BIMESTRES;
  const disciplinaNome = disciplinasEscolares.find((disciplina) => disciplina.id === disciplinaId)?.nome || obterDisciplinaNome(disciplinaId);
  const bimestreNome = bimestresEscolares.find((bimestre) => bimestre.id === bimestreId)?.nome || obterBimestreNome(bimestreId);

  const filtros = { alunos, disciplinaId, bimestreId, ano, turma, busca, limiares: limiaresNotas };
  const alertas = gerarAlertas(filtros);

  const alertasFiltrados = useMemo(() => {
    if (tipo === "Críticos") return alertas.filter((alerta) => alerta.total < limiaresNotas.critico);
    if (tipo === "Reforço") return alertas.filter((alerta) => alerta.total >= limiaresNotas.critico && alerta.total < limiaresNotas.meta);
    if (tipo === "Persistentes") return alertas.filter((alerta) => alerta.persistente);
    return alertas;
  }, [alertas, tipo]);

  const criticos = alertas.filter((alerta) => alerta.total < limiaresNotas.critico).length;
  const reforco = alertas.filter((alerta) => alerta.total >= limiaresNotas.critico && alerta.total < limiaresNotas.meta).length;
  const persistentes = alertas.filter((alerta) => alerta.persistente).length;

  function obterClasseCard(alerta) {
    if (alerta.total < limiaresNotas.critico) return "risk-card risk-critical";
    if (alerta.persistente) return "risk-card risk-persistent";
    return "risk-card risk-warning";
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Acompanhamento</span>
          <h1>Alunos em risco</h1>
          <p>
            Alunos abaixo da meta em {disciplinaNome} no{" "}
            {bimestreNome}.
          </p>
        </div>
      </header>

      <section className="panel filters-panel" data-tour="risco-filtros">
        <div className="filter-row">
          <label>
            <span>Buscar aluno</span>
            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Nome do aluno"
            />
          </label>

          <label>
            <span>Ano</span>
            <select value={ano} onChange={(event) => setAno(event.target.value)}>
              <option>Todos</option>
              {anosEscolares.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Turma</span>
            <select value={turma} onChange={(event) => setTurma(event.target.value)}>
              <option>Todas</option>
              {turmasEscolares.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

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
      </section>

      <section className="metrics-grid">
        <article className="metric-card danger">
          <span>Críticos</span>
          <strong>{criticos}</strong>
          <p>Abaixo de {limiaresNotas.critico}</p>
        </article>

        <article className="metric-card warning">
          <span>Reforço</span>
          <strong>{reforco}</strong>
          <p>Entre {limiaresNotas.critico} e {limiaresNotas.meta - 1}</p>
        </article>

        <article className="metric-card danger-soft">
          <span>Persistentes</span>
          <strong>{persistentes}</strong>
          <p>Baixa em sequência</p>
        </article>

        <article className="metric-card">
          <span>Total em atenção</span>
          <strong>{alertas.length}</strong>
          <p>Abaixo da meta</p>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Lista de encaminhamento</span>
            <h2>{alertasFiltrados.length} registros</h2>
          </div>

          <div className="segmented-control" data-tour="risco-segmentos">
            {["Todos", "Críticos", "Reforço", "Persistentes"].map((item) => (
              <button
                key={item}
                type="button"
                className={tipo === item ? "active" : ""}
                onClick={() => setTipo(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="list-stack" data-tour="risco-lista">
          {alertasFiltrados.map((alerta) => (
            <div className={obterClasseCard(alerta)} key={alerta.id}>
              <div>
                <span className="eyebrow">{alerta.prioridade} prioridade</span>
                <h3>{alerta.aluno.nome}</h3>
                <p>{alerta.aluno.ano} · Turma {alerta.aluno.turma} · {alerta.motivo}</p>
              </div>

              <div className="risk-actions">
                <span className={"status-badge " + alerta.status.classe}>{alerta.total} pontos</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
