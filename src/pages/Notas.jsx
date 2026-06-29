import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ANOS,
  BIMESTRES,
  DISCIPLINAS,
  LIMIAR_REAVALIACAO,
  TURMAS,
  classificarNota,
  limitarNotaEtapa,
  montarRegistros,
} from "../data/notasData";
import { useFeedback } from "../context/FeedbackContext";
import { useSchoolData } from "../context/SchoolDataContext";

const camposNota = ["etapa1", "etapa1Reavaliacao", "etapa2", "etapa2Reavaliacao"];

function normalizarEntradaNota(valor) {
  if (valor === "") return "";
  return String(limitarNotaEtapa(valor));
}

function formatarNota(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

function montarNotaEditavel(registro) {
  return {
    etapa1: String(registro.etapa1 || 0),
    etapa1Reavaliacao: String(registro.etapa1Reavaliacao || 0),
    etapa2: String(registro.etapa2 || 0),
    etapa2Reavaliacao: String(registro.etapa2Reavaliacao || 0),
  };
}

function calcularRegistroEditado(registro, notaEditada, limiaresNotas) {
  const etapa1 = limitarNotaEtapa(notaEditada.etapa1);
  const etapa1Reavaliacao = limitarNotaEtapa(notaEditada.etapa1Reavaliacao);
  const etapa2 = limitarNotaEtapa(notaEditada.etapa2);
  const etapa2Reavaliacao = limitarNotaEtapa(notaEditada.etapa2Reavaliacao);
  const etapa1Final = Math.max(etapa1, etapa1Reavaliacao);
  const etapa2Final = Math.max(etapa2, etapa2Reavaliacao);
  const total = etapa1Final + etapa2Final;
  const media = Math.round((total / 2) * 10) / 10;
  const precisaReavaliacaoEtapa1 = etapa1 > 0 && etapa1 < LIMIAR_REAVALIACAO;
  const precisaReavaliacaoEtapa2 = etapa2 > 0 && etapa2 < LIMIAR_REAVALIACAO;

  return {
    ...registro,
    etapa1,
    etapa1Reavaliacao,
    etapa1Final,
    etapa2,
    etapa2Reavaliacao,
    etapa2Final,
    total,
    media,
    evolucaoEtapas: etapa2Final - etapa1Final,
    precisaReavaliacaoEtapa1,
    precisaReavaliacaoEtapa2,
    precisaReavaliacao: precisaReavaliacaoEtapa1 || precisaReavaliacaoEtapa2,
    status: classificarNota(total, limiaresNotas),
  };
}

function calcularResumoAtual(registros) {
  const totalAlunos = registros.length;
  const somaMedias = registros.reduce((soma, registro) => soma + Number(registro.media || 0), 0);

  return {
    totalAlunos,
    media: totalAlunos ? Math.round((somaMedias / totalAlunos) * 10) / 10 : 0,
    reavaliacao: registros.filter((registro) => registro.precisaReavaliacao).length,
  };
}

export default function Notas() {
  const navigate = useNavigate();
  const [disciplinaId, setDisciplinaId] = useState("portugues");
  const [bimestreId, setBimestreId] = useState("b2");
  const [ano, setAno] = useState("Todos");
  const [turma, setTurma] = useState("Todas");
  const [busca, setBusca] = useState("");
  const [reavaliacao, setReavaliacao] = useState("Todos");
  const [notas, setNotas] = useState({});
  const [salvandoNotas, setSalvandoNotas] = useState(false);
  const { alunos, carregandoAlunos, salvarNotas, estruturaEscolar, limiaresNotas } = useSchoolData();
  const { mostrarFeedback, pedirConfirmacao } = useFeedback();
  const anosEscolares = estruturaEscolar.anosEscolares || ANOS;
  const turmasEscolares = estruturaEscolar.turmas || TURMAS;
  const disciplinasEscolares = estruturaEscolar.disciplinas || DISCIPLINAS;
  const bimestresEscolares = estruturaEscolar.bimestres || BIMESTRES;

  const filtrosBase = { alunos, disciplinaId, bimestreId, ano, turma, busca, limiares: limiaresNotas };

  // Monta os registros salvos no banco antes das alterações digitadas na tela.
  const registrosBase = useMemo(
    () => montarRegistros(filtrosBase),
    [alunos, disciplinaId, bimestreId, ano, turma, busca, limiaresNotas],
  );

  const notasBase = useMemo(
    () =>
      Object.fromEntries(
        registrosBase.map((registro) => [registro.aluno.id, montarNotaEditavel(registro)]),
      ),
    [registrosBase],
  );

  useEffect(() => {
    setNotas(notasBase);
  }, [notasBase]);

  const registrosCalculados = registrosBase.map((registro) => {
    const notaEditada = notas[registro.aluno.id] || montarNotaEditavel(registro);
    return calcularRegistroEditado(registro, notaEditada, limiaresNotas);
  });

  const registros = registrosCalculados.filter((registro) => {
    if (reavaliacao === "Apenas reavaliação") return registro.precisaReavaliacao;
    if (reavaliacao === "Sem reavaliação") return !registro.precisaReavaliacao;
    return true;
  });

  const totalAlteracoesNaoSalvas = useMemo(
    () =>
      registrosBase.filter((registro) => {
        const notaEditada = notas[registro.aluno.id];
        if (!notaEditada) return false;

        return camposNota.some(
          (campo) => limitarNotaEtapa(notaEditada[campo]) !== Number(registro[campo] || 0),
        );
      }).length,
    [notas, registrosBase],
  );

  const temAlteracoesNaoSalvas = totalAlteracoesNaoSalvas > 0;
  const resumo = calcularResumoAtual(registros);

  useEffect(() => {
    if (!temAlteracoesNaoSalvas) return undefined;

    const avisarAntesDeSair = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", avisarAntesDeSair);

    return () => {
      window.removeEventListener("beforeunload", avisarAntesDeSair);
    };
  }, [temAlteracoesNaoSalvas]);

  useEffect(() => {
    if (!temAlteracoesNaoSalvas) return undefined;

    let confirmandoSaida = false;

    const interceptarLinksInternos = async (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const link = event.target.closest("a[href]");
      if (!link) return;

      const destino = new URL(link.href, window.location.href);
      if (destino.origin !== window.location.origin) return;

      const rotaAtual = window.location.pathname + window.location.search + window.location.hash;
      const rotaDestino = destino.pathname + destino.search + destino.hash;
      if (rotaDestino === rotaAtual) return;

      event.preventDefault();
      event.stopPropagation();

      if (confirmandoSaida) return;
      confirmandoSaida = true;

      const confirmado = await pedirConfirmacao({
        titulo: "Sair sem salvar notas?",
        mensagem:
          "Você alterou notas de " +
          totalAlteracoesNaoSalvas +
          " aluno(s), mas ainda não clicou em Salvar alterações. Se sair agora, essas mudanças serão perdidas.",
        textoConfirmar: "Sair sem salvar",
        textoCancelar: "Continuar editando",
        perigo: true,
      });

      confirmandoSaida = false;

      if (confirmado) {
        navigate(rotaDestino);
      }
    };

    document.addEventListener("click", interceptarLinksInternos, true);

    return () => {
      document.removeEventListener("click", interceptarLinksInternos, true);
    };
  }, [navigate, pedirConfirmacao, temAlteracoesNaoSalvas, totalAlteracoesNaoSalvas]);

  // Salva no Firestore apenas as notas que estão visíveis na tabela filtrada.
  const salvarAlteracoes = async () => {
    try {
      setSalvandoNotas(true);
      await salvarNotas(registros, disciplinaId, bimestreId);
      setNotas(Object.fromEntries(registrosCalculados.map((registro) => [registro.aluno.id, montarNotaEditavel(registro)])));
      mostrarFeedback("Notas salvas no banco de dados.");
    } catch (error) {
      mostrarFeedback("Não foi possível salvar as notas.", "erro");
    } finally {
      setSalvandoNotas(false);
    }
  };

  const alterarNota = (alunoId, campo, valor) => {
    setNotas((notasAtuais) => ({
      ...notasAtuais,
      [alunoId]: {
        ...notasAtuais[alunoId],
        [campo]: normalizarEntradaNota(valor),
      },
    }));
  };

  const limparZeroAoFocar = (alunoId, campo) => {
    const valorAtual = notas[alunoId]?.[campo];

    if (Number(valorAtual || 0) === 0) {
      alterarNota(alunoId, campo, "");
    }
  };

  const valorInput = (alunoId, campo) => notas[alunoId]?.[campo] ?? "";

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Lançamento</span>
          <h1>Notas</h1>
          <p>Média das duas etapas finais, usando a maior nota entre avaliação e reavaliação.</p>
        </div>
      </header>

      <section className="panel filters-panel" data-tour="notas-filtros">
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

          <label>
            <span>Reavaliação</span>
            <select value={reavaliacao} onChange={(event) => setReavaliacao(event.target.value)}>
              <option>Todos</option>
              <option>Apenas reavaliação</option>
              <option>Sem reavaliação</option>
            </select>
          </label>
        </div>
      </section>

      <section className="metrics-grid">
        <article className="metric-card">
          <span>Média atual</span>
          <strong>{formatarNota(resumo.media)}</strong>
          <p>Base filtrada</p>
        </article>

        <article className="metric-card warning">
          <span>Reavaliação</span>
          <strong>{resumo.reavaliacao}</strong>
          <p>Avaliação abaixo de {LIMIAR_REAVALIACAO}</p>
        </article>

        <article className="metric-card">
          <span>Alunos listados</span>
          <strong>{resumo.totalAlunos}</strong>
          <p>Filtro atual</p>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Tabela de notas</span>
            <h2>{carregandoAlunos ? "Carregando..." : registros.length + " alunos"}</h2>
          </div>

          <button
            type="button"
            className="button primary"
            data-tour="notas-salvar"
            onClick={salvarAlteracoes}
            disabled={salvandoNotas || carregandoAlunos}
          >
            {salvandoNotas ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>

        <div className="table-wrap notes-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Ano</th>
                <th>1ª Etapa (Avaliação)</th>
                <th>1ª Etapa (Reavaliação)</th>
                <th>2ª Etapa (Avaliação)</th>
                <th>2ª Etapa (Reavaliação)</th>
                <th>Média</th>
              </tr>
            </thead>

            <tbody>
              {registros.map((registro) => (
                <tr key={registro.id} className={registro.precisaReavaliacao ? "needs-reassessment-row" : ""}>
                  <td>
                    <strong>{registro.aluno.nome}</strong>
                    <small>Turma {registro.aluno.turma}</small>
                  </td>
                  <td>{registro.aluno.ano}</td>
                  <td>
                    <input
                      className="score-input"
                      data-tour="nota-etapa1"
                      type="number"
                      min="0"
                      max="50"
                      value={valorInput(registro.aluno.id, "etapa1")}
                      onFocus={() => limparZeroAoFocar(registro.aluno.id, "etapa1")}
                      onChange={(event) => alterarNota(registro.aluno.id, "etapa1", event.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="score-input"
                      data-tour="nota-etapa1-reavaliacao"
                      type="number"
                      min="0"
                      max="50"
                      value={valorInput(registro.aluno.id, "etapa1Reavaliacao")}
                      onFocus={() => limparZeroAoFocar(registro.aluno.id, "etapa1Reavaliacao")}
                      onChange={(event) => alterarNota(registro.aluno.id, "etapa1Reavaliacao", event.target.value)}
                    />
                    {registro.precisaReavaliacaoEtapa1 && <small className="reassessment-hint">Reavaliar</small>}
                  </td>
                  <td>
                    <input
                      className="score-input"
                      data-tour="nota-etapa2"
                      type="number"
                      min="0"
                      max="50"
                      value={valorInput(registro.aluno.id, "etapa2")}
                      onFocus={() => limparZeroAoFocar(registro.aluno.id, "etapa2")}
                      onChange={(event) => alterarNota(registro.aluno.id, "etapa2", event.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="score-input"
                      data-tour="nota-etapa2-reavaliacao"
                      type="number"
                      min="0"
                      max="50"
                      value={valorInput(registro.aluno.id, "etapa2Reavaliacao")}
                      onFocus={() => limparZeroAoFocar(registro.aluno.id, "etapa2Reavaliacao")}
                      onChange={(event) => alterarNota(registro.aluno.id, "etapa2Reavaliacao", event.target.value)}
                    />
                    {registro.precisaReavaliacaoEtapa2 && <small className="reassessment-hint">Reavaliar</small>}
                  </td>
                  <td>
                    <strong>{formatarNota(registro.media)}</strong>
                    <small>
                      Base: {registro.etapa1Final} e {registro.etapa2Final}
                    </small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
