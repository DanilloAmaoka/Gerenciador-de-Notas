import { useMemo, useState } from "react";

import {
  ANOS,
  BIMESTRES,
  DISCIPLINAS,
  TURMAS,
  filtrarAlunos,
  obterBimestreNome,
  obterDisciplinaNome,
  obterNota,
  obterTendencia,
} from "../data/notasData";
import { useSchoolData } from "../context/SchoolDataContext";

const tiposComparacao = {
  bimestres: "bimestres",
  etapas: "etapas",
};

const filtrosResultado = [
  { id: "todos", label: "Todos", simbolo: "•" },
  { id: "melhoraram", label: "Melhoraram", simbolo: "▲" },
  { id: "cairam", label: "Caíram", simbolo: "▼" },
  { id: "estaveis", label: "Estáveis", simbolo: "◆" },
];

const etapasComparaveis = [
  { id: "etapa1Final", label: "1ª etapa", detalhe: "Avaliação 1" },
  { id: "etapa2Final", label: "2ª etapa", detalhe: "Avaliação 2" },
];

function arredondar(valor) {
  return Math.round(Number(valor || 0) * 10) / 10;
}

function formatarNota(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

function porcentagem(parte, total) {
  if (!total) return 0;
  return Math.round((parte / total) * 100);
}

function categoriaDelta(delta) {
  if (delta > 0) return "melhoraram";
  if (delta < 0) return "cairam";
  return "estaveis";
}

function simboloDelta(categoria) {
  return filtrosResultado.find((item) => item.id === categoria)?.simbolo || "•";
}

function classeResultado(categoria) {
  if (categoria === "melhoraram") return "is-positive";
  if (categoria === "cairam") return "is-negative";
  if (categoria === "estaveis") return "is-neutral";
  return "";
}

function obterEtapa(id) {
  return etapasComparaveis.find((etapa) => etapa.id === id) || etapasComparaveis[0];
}

function ordenarComparacoes(lista, filtroResultado) {
  return [...lista].sort((a, b) => {
    if (filtroResultado === "cairam") return a.delta - b.delta || a.aluno.nome.localeCompare(b.aluno.nome);
    if (filtroResultado === "estaveis") return a.aluno.nome.localeCompare(b.aluno.nome);
    return b.delta - a.delta || b.final - a.final || a.aluno.nome.localeCompare(b.aluno.nome);
  });
}

export default function Evolucao() {
  const [tipoComparacao, setTipoComparacao] = useState(tiposComparacao.bimestres);
  const [disciplinaId, setDisciplinaId] = useState("portugues");
  const [bimestreInicialId, setBimestreInicialId] = useState("b1");
  const [bimestreFinalId, setBimestreFinalId] = useState("b2");
  const [bimestreEtapasId, setBimestreEtapasId] = useState("b2");
  const [etapaInicialId, setEtapaInicialId] = useState("etapa1Final");
  const [etapaFinalId, setEtapaFinalId] = useState("etapa2Final");
  const [ano, setAno] = useState("Todos");
  const [turma, setTurma] = useState("Todas");
  const [busca, setBusca] = useState("");
  const [filtroResultado, setFiltroResultado] = useState("todos");
  const [podioAberto, setPodioAberto] = useState(false);
  const { alunos, estruturaEscolar, limiaresNotas } = useSchoolData();
  const anosEscolares = estruturaEscolar.anosEscolares || ANOS;
  const turmasEscolares = estruturaEscolar.turmas || TURMAS;
  const disciplinasEscolares = estruturaEscolar.disciplinas || DISCIPLINAS;
  const bimestresEscolares = estruturaEscolar.bimestres || BIMESTRES;
  const disciplinaNome = disciplinasEscolares.find((disciplina) => disciplina.id === disciplinaId)?.nome || obterDisciplinaNome(disciplinaId);
  const bimestreInicialNome = bimestresEscolares.find((bimestre) => bimestre.id === bimestreInicialId)?.nome || obterBimestreNome(bimestreInicialId);
  const bimestreFinalNome = bimestresEscolares.find((bimestre) => bimestre.id === bimestreFinalId)?.nome || obterBimestreNome(bimestreFinalId);
  const bimestreEtapasNome = bimestresEscolares.find((bimestre) => bimestre.id === bimestreEtapasId)?.nome || obterBimestreNome(bimestreEtapasId);
  const etapaInicial = obterEtapa(etapaInicialId);
  const etapaFinal = obterEtapa(etapaFinalId);
  const comparandoBimestres = tipoComparacao === tiposComparacao.bimestres;
  const tituloComparacao = comparandoBimestres
    ? `${bimestreInicialNome} para ${bimestreFinalNome}`
    : `${etapaInicial.label} para ${etapaFinal.label} em ${bimestreEtapasNome}`;

  const alunosFiltrados = useMemo(
    () => filtrarAlunos({ alunos, ano, turma, busca }),
    [alunos, ano, turma, busca],
  );

  const comparacoes = useMemo(
    () =>
      alunosFiltrados.map((aluno) => {
        let inicial = 0;
        let final = 0;
        let origem = "";
        let destino = "";
        let detalheInicial = "";
        let detalheFinal = "";

        if (comparandoBimestres) {
          const notaInicial = obterNota(aluno, disciplinaId, bimestreInicialId, limiaresNotas);
          const notaFinal = obterNota(aluno, disciplinaId, bimestreFinalId, limiaresNotas);

          inicial = notaInicial.total;
          final = notaFinal.total;
          origem = bimestreInicialNome;
          destino = bimestreFinalNome;
          detalheInicial = `${formatarNota(notaInicial.etapa1Final)} + ${formatarNota(notaInicial.etapa2Final)}`;
          detalheFinal = `${formatarNota(notaFinal.etapa1Final)} + ${formatarNota(notaFinal.etapa2Final)}`;
        } else {
          const nota = obterNota(aluno, disciplinaId, bimestreEtapasId, limiaresNotas);

          inicial = nota[etapaInicialId];
          final = nota[etapaFinalId];
          origem = etapaInicial.label;
          destino = etapaFinal.label;
          detalheInicial = bimestreEtapasNome;
          detalheFinal = bimestreEtapasNome;
        }

        const delta = arredondar(final - inicial);
        const categoria = categoriaDelta(delta);

        return {
          aluno,
          inicial: arredondar(inicial),
          final: arredondar(final),
          delta,
          origem,
          destino,
          detalheInicial,
          detalheFinal,
          categoria,
          tendencia: obterTendencia(delta),
          simbolo: simboloDelta(categoria),
        };
      }),
    [
      alunosFiltrados,
      bimestreEtapasId,
      bimestreEtapasNome,
      bimestreFinalId,
      bimestreFinalNome,
      bimestreInicialId,
      bimestreInicialNome,
      comparandoBimestres,
      disciplinaId,
      etapaFinal,
      etapaFinalId,
      etapaInicial,
      etapaInicialId,
      limiaresNotas,
    ],
  );

  const resumo = useMemo(() => {
    const total = comparacoes.length;
    const melhoraram = comparacoes.filter((comparacao) => comparacao.categoria === "melhoraram").length;
    const cairam = comparacoes.filter((comparacao) => comparacao.categoria === "cairam").length;
    const estaveis = comparacoes.filter((comparacao) => comparacao.categoria === "estaveis").length;
    const somaInicial = comparacoes.reduce((soma, comparacao) => soma + comparacao.inicial, 0);
    const somaFinal = comparacoes.reduce((soma, comparacao) => soma + comparacao.final, 0);
    const mediaInicial = total ? arredondar(somaInicial / total) : 0;
    const mediaFinal = total ? arredondar(somaFinal / total) : 0;

    return {
      total,
      melhoraram,
      cairam,
      estaveis,
      mediaInicial,
      mediaFinal,
      deltaMedio: arredondar(mediaFinal - mediaInicial),
    };
  }, [comparacoes]);

  const comparacoesFiltradas = useMemo(() => {
    const lista = filtroResultado === "todos"
      ? comparacoes
      : comparacoes.filter((comparacao) => comparacao.categoria === filtroResultado);

    return ordenarComparacoes(lista, filtroResultado);
  }, [comparacoes, filtroResultado]);

  const podio = useMemo(
    () =>
      comparacoes
        .filter((comparacao) => comparacao.delta > 0)
        .sort((a, b) => b.delta - a.delta || b.final - a.final || a.aluno.nome.localeCompare(b.aluno.nome))
        .slice(0, 5),
    [comparacoes],
  );

  const cardsResumo = [
    { id: "todos", label: "Todos", count: resumo.total, descricao: "alunos no filtro" },
    { id: "melhoraram", label: "Melhoraram", count: resumo.melhoraram, descricao: "subiram pontuação" },
    { id: "cairam", label: "Caíram", count: resumo.cairam, descricao: "reduziram pontuação" },
    { id: "estaveis", label: "Estáveis", count: resumo.estaveis, descricao: "sem mudança" },
  ];

  return (
    <div className="page evolution-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Comparativo</span>
          <h1>Evolução</h1>
          <p>
            Compare o desempenho em {disciplinaNome}: {tituloComparacao}.
          </p>
        </div>

        <button
          type="button"
          className="button secondary"
          data-tour="evolucao-podio"
          onClick={() => setPodioAberto(true)}
        >
          Ver pódio
        </button>
      </header>

      <section className="panel evolution-filter-panel" data-tour="evolucao-filtros">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Filtros</span>
            <h2>Como comparar</h2>
            <p>Escolha se quer ver evolução entre bimestres ou entre etapas de um bimestre.</p>
          </div>
        </div>

        <div className="evolution-mode-toggle" aria-label="Tipo de comparação">
          <button
            type="button"
            className={comparandoBimestres ? "active" : ""}
            onClick={() => setTipoComparacao(tiposComparacao.bimestres)}
          >
            Bimestre x bimestre
          </button>
          <button
            type="button"
            className={!comparandoBimestres ? "active" : ""}
            onClick={() => setTipoComparacao(tiposComparacao.etapas)}
          >
            Etapa x etapa
          </button>
        </div>

        <div className="evolution-filter-grid">
          <label className="field-group">
            <span>Buscar aluno</span>
            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Nome do aluno"
            />
          </label>

          <label className="field-group">
            <span>Ano</span>
            <select value={ano} onChange={(event) => setAno(event.target.value)}>
              <option>Todos</option>
              {anosEscolares.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="field-group">
            <span>Turma</span>
            <select value={turma} onChange={(event) => setTurma(event.target.value)}>
              <option>Todas</option>
              {turmasEscolares.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="field-group">
            <span>Disciplina</span>
            <select value={disciplinaId} onChange={(event) => setDisciplinaId(event.target.value)}>
              {disciplinasEscolares.map((disciplina) => (
                <option key={disciplina.id} value={disciplina.id}>
                  {disciplina.nome}
                </option>
              ))}
            </select>
          </label>

          {comparandoBimestres ? (
            <>
              <label className="field-group">
                <span>Bimestre inicial</span>
                <select value={bimestreInicialId} onChange={(event) => setBimestreInicialId(event.target.value)}>
                  {bimestresEscolares.map((bimestre) => (
                    <option key={bimestre.id} value={bimestre.id}>
                      {bimestre.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-group">
                <span>Bimestre final</span>
                <select value={bimestreFinalId} onChange={(event) => setBimestreFinalId(event.target.value)}>
                  {bimestresEscolares.map((bimestre) => (
                    <option key={bimestre.id} value={bimestre.id}>
                      {bimestre.nome}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <>
              <label className="field-group">
                <span>Bimestre</span>
                <select value={bimestreEtapasId} onChange={(event) => setBimestreEtapasId(event.target.value)}>
                  {bimestresEscolares.map((bimestre) => (
                    <option key={bimestre.id} value={bimestre.id}>
                      {bimestre.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-group">
                <span>Etapa inicial</span>
                <select value={etapaInicialId} onChange={(event) => setEtapaInicialId(event.target.value)}>
                  {etapasComparaveis.map((etapa) => (
                    <option key={etapa.id} value={etapa.id}>
                      {etapa.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-group">
                <span>Etapa final</span>
                <select value={etapaFinalId} onChange={(event) => setEtapaFinalId(event.target.value)}>
                  {etapasComparaveis.map((etapa) => (
                    <option key={etapa.id} value={etapa.id}>
                      {etapa.label}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
        </div>
      </section>

      <section className="evolution-result-cards" data-tour="evolucao-metricas">
        {cardsResumo.map((card) => (
          <button
            type="button"
            key={card.id}
            className={"evolution-result-card " + classeResultado(card.id) + (filtroResultado === card.id ? " active" : "")}
            onClick={() => setFiltroResultado(card.id)}
          >
            <span className="evolution-card-icon" aria-hidden="true">
              {filtrosResultado.find((item) => item.id === card.id)?.simbolo || "•"}
            </span>
            <span>{card.label}</span>
            <strong>{card.count}</strong>
            <small>{card.descricao}</small>
          </button>
        ))}
      </section>

      <section className="panel evolution-chart-panel" data-tour="evolucao-grafico">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Gráfico geral</span>
            <h2>Total do filtro</h2>
            <p>Distribuição dos alunos conforme a comparação atual.</p>
          </div>
        </div>

        <div className="evolution-chart-layout">
          <div className="evolution-distribution">
            <div className="evolution-total-track" aria-label="Distribuição geral">
              <span className="positive" style={{ width: porcentagem(resumo.melhoraram, resumo.total) + "%" }} />
              <span className="negative" style={{ width: porcentagem(resumo.cairam, resumo.total) + "%" }} />
              <span className="neutral" style={{ width: porcentagem(resumo.estaveis, resumo.total) + "%" }} />
            </div>

            <div className="evolution-distribution-row">
              <span>Melhoraram</span>
              <div><span className="positive" style={{ width: porcentagem(resumo.melhoraram, resumo.total) + "%" }} /></div>
              <strong>{porcentagem(resumo.melhoraram, resumo.total)}%</strong>
            </div>

            <div className="evolution-distribution-row">
              <span>Caíram</span>
              <div><span className="negative" style={{ width: porcentagem(resumo.cairam, resumo.total) + "%" }} /></div>
              <strong>{porcentagem(resumo.cairam, resumo.total)}%</strong>
            </div>

            <div className="evolution-distribution-row">
              <span>Estáveis</span>
              <div><span className="neutral" style={{ width: porcentagem(resumo.estaveis, resumo.total) + "%" }} /></div>
              <strong>{porcentagem(resumo.estaveis, resumo.total)}%</strong>
            </div>
          </div>

          <div className="evolution-average-panel">
            <span>Média do grupo</span>
            <div>
              <strong>{formatarNota(resumo.mediaInicial)}</strong>
              <small>{comparandoBimestres ? bimestreInicialNome : etapaInicial.label}</small>
            </div>
            <div>
              <strong>{formatarNota(resumo.mediaFinal)}</strong>
              <small>{comparandoBimestres ? bimestreFinalNome : etapaFinal.label}</small>
            </div>
            <p className={resumo.deltaMedio > 0 ? "trend-positive" : resumo.deltaMedio < 0 ? "trend-negative" : "trend-neutral"}>
              {resumo.deltaMedio > 0 ? "+" : ""}
              {formatarNota(resumo.deltaMedio)} ponto(s)
            </p>
          </div>
        </div>
      </section>

      <section className="panel evolution-list-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Listagem</span>
            <h2>{comparacoesFiltradas.length} alunos exibidos</h2>
            <p>
              Filtro ativo: {filtrosResultado.find((item) => item.id === filtroResultado)?.label}.
            </p>
          </div>
        </div>

        <div className="evolution-list" data-tour="evolucao-lista">
          {comparacoesFiltradas.length === 0 && (
            <div className="empty-state">
              Nenhum aluno encontrado para esta combinação de filtros.
            </div>
          )}

          {comparacoesFiltradas.map((comparacao) => (
            <article
              className={"evolution-list-row " + classeResultado(comparacao.categoria)}
              key={comparacao.aluno.id}
            >
              <span className="evolution-change-symbol" aria-hidden="true">
                {comparacao.simbolo}
              </span>

              <div className="evolution-student">
                <strong>{comparacao.aluno.nome}</strong>
                <span>
                  {comparacao.aluno.ano} · Turma {comparacao.aluno.turma}
                </span>
              </div>

              <div className="evolution-score-comparison">
                <div>
                  <span>{comparacao.origem}</span>
                  <strong>{formatarNota(comparacao.inicial)}</strong>
                  <small>{comparacao.detalheInicial}</small>
                </div>

                <span className="evolution-arrow" aria-hidden="true">→</span>

                <div>
                  <span>{comparacao.destino}</span>
                  <strong>{formatarNota(comparacao.final)}</strong>
                  <small>{comparacao.detalheFinal}</small>
                </div>
              </div>

              <div className="evolution-delta">
                <strong>
                  {comparacao.delta > 0 ? "+" : ""}
                  {formatarNota(comparacao.delta)}
                </strong>
                <span className={comparacao.tendencia.classe}>{comparacao.tendencia.label}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {podioAberto && (
        <div className="evolution-modal-layer" role="dialog" aria-modal="true" aria-labelledby="evolution-podium-title">
          <section className="evolution-modal">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Pódio</span>
                <h2 id="evolution-podium-title">Melhores evoluções</h2>
                <p>Maiores crescimentos dentro do filtro atual.</p>
              </div>

              <button type="button" className="button secondary small" onClick={() => setPodioAberto(false)}>
                Fechar
              </button>
            </div>

            <div className="evolution-podium-list">
              {podio.length === 0 && (
                <div className="empty-state">
                  Nenhum aluno com evolução positiva encontrado.
                </div>
              )}

              {podio.map((comparacao, index) => (
                <article className={"evolution-podium-entry place-" + (index + 1)} key={comparacao.aluno.id}>
                  <span>{index + 1}º</span>
                  <div>
                    <strong>{comparacao.aluno.nome}</strong>
                    <small>
                      {comparacao.aluno.ano} · Turma {comparacao.aluno.turma}
                    </small>
                  </div>
                  <strong>
                    +{formatarNota(comparacao.delta)}
                  </strong>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
