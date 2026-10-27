import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ANOS,
  BIMESTRES,
  DISCIPLINAS,
  TURMAS,
  classificarNota,
  limitarNotaEtapa,
  montarRegistros,
  obterLimiarReavaliacao,
} from "../data/notasData";
import { useFeedback } from "../context/FeedbackContext";
import { useSchoolData } from "../context/SchoolDataContext";

const campoReavaliacaoPorEtapa = {
  etapa1: "etapa1Reavaliacao",
  etapa2: "etapa2Reavaliacao",
};

const FILTROS_NOTAS_KEY = "gerenciador-notas:filtros-notas";

function normalizarEntradaNota(valor) {
  if (valor === "") return "";
  return String(limitarNotaEtapa(valor));
}

function formatarNota(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

function lerFiltrosNotas() {
  const padrao = {
    disciplinaId: "portugues",
    bimestreId: "b2",
    ano: "Todos",
    turma: "Todas",
    busca: "",
    reavaliacao: "Todos",
  };

  try {
    const salvo = JSON.parse(window.localStorage.getItem(FILTROS_NOTAS_KEY) || "null");
    return { ...padrao, ...(salvo || {}) };
  } catch (error) {
    return padrao;
  }
}

function salvarFiltrosNotas(filtros) {
  try {
    window.localStorage.setItem(FILTROS_NOTAS_KEY, JSON.stringify(filtros));
  } catch (error) {
    // Se o navegador bloquear localStorage, a página continua funcionando sem persistir filtros.
  }
}

function focarInputNota(input) {
  if (!input) return;
  input.focus();
  input.select();
}

function focarPrimeiroInputDaLinha(indiceLinha) {
  const input = document.querySelector(
    `[data-note-input="true"][data-note-row="${indiceLinha}"]`,
  );

  focarInputNota(input);
}

function ativarLinhaPeloTeclado(event, indiceLinha) {
  if (event.key !== "Enter" && event.key !== " ") return;

  event.preventDefault();
  focarPrimeiroInputDaLinha(indiceLinha);
}

function navegarEntreInputsDeNota(event) {
  const teclasValidas = ["Enter", "ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"];
  if (!teclasValidas.includes(event.key)) return;

  const inputAtual = event.currentTarget;
  const inputs = Array.from(document.querySelectorAll('[data-note-input="true"]'));
  const indiceAtual = inputs.indexOf(inputAtual);
  if (indiceAtual < 0) return;

  event.preventDefault();

  if (event.key === "Enter" || event.key === "ArrowRight") {
    focarInputNota(inputs[indiceAtual + 1]);
    return;
  }

  if (event.key === "ArrowLeft") {
    focarInputNota(inputs[indiceAtual - 1]);
    return;
  }

  const linhaAtual = Number(inputAtual.dataset.noteRow);
  const campoAtual = inputAtual.dataset.noteField;
  const direcao = event.key === "ArrowDown" ? 1 : -1;
  const linhas = [...new Set(inputs.map((input) => Number(input.dataset.noteRow)))].sort((a, b) => a - b);
  const indiceLinha = linhas.indexOf(linhaAtual);
  const linhaDestino = linhas[indiceLinha + direcao];

  if (linhaDestino === undefined) {
    focarInputNota(inputs[indiceAtual + direcao]);
    return;
  }

  const mesmoCampo = inputs.find(
    (input) => Number(input.dataset.noteRow) === linhaDestino && input.dataset.noteField === campoAtual,
  );
  const primeiroCampoDaLinha = inputs.find((input) => Number(input.dataset.noteRow) === linhaDestino);

  focarInputNota(mesmoCampo || primeiroCampoDaLinha);
}

function precisaReavaliar(valor, limiarReavaliacao) {
  const nota = limitarNotaEtapa(valor);
  return nota > 0 && nota < limiarReavaliacao;
}

function montarNotaEditavel(registro) {
  return {
    etapa1: String(registro.etapa1 || 0),
    etapa1Reavaliacao: registro.precisaReavaliacaoEtapa1 ? String(registro.etapa1Reavaliacao || 0) : "0",
    etapa2: String(registro.etapa2 || 0),
    etapa2Reavaliacao: registro.precisaReavaliacaoEtapa2 ? String(registro.etapa2Reavaliacao || 0) : "0",
  };
}

function limparReavaliacaoQuandoNaoPrecisa(notaEditada, limiarReavaliacao) {
  const proximaNota = { ...notaEditada };

  if (!precisaReavaliar(proximaNota.etapa1, limiarReavaliacao)) {
    proximaNota.etapa1Reavaliacao = "0";
  }

  if (!precisaReavaliar(proximaNota.etapa2, limiarReavaliacao)) {
    proximaNota.etapa2Reavaliacao = "0";
  }

  return proximaNota;
}

function calcularRegistroEditado(registro, notaEditada, limiaresNotas) {
  const etapa1 = limitarNotaEtapa(notaEditada.etapa1);
  const etapa2 = limitarNotaEtapa(notaEditada.etapa2);
  const limiarReavaliacao = obterLimiarReavaliacao(limiaresNotas);
  const precisaReavaliacaoEtapa1 = etapa1 > 0 && etapa1 < limiarReavaliacao;
  const precisaReavaliacaoEtapa2 = etapa2 > 0 && etapa2 < limiarReavaliacao;
  const etapa1Reavaliacao = precisaReavaliacaoEtapa1 ? limitarNotaEtapa(notaEditada.etapa1Reavaliacao) : 0;
  const etapa2Reavaliacao = precisaReavaliacaoEtapa2 ? limitarNotaEtapa(notaEditada.etapa2Reavaliacao) : 0;
  const etapa1Final = Math.max(etapa1, etapa1Reavaliacao);
  const etapa2Final = Math.max(etapa2, etapa2Reavaliacao);
  const total = etapa1Final + etapa2Final;
  const media = Math.round((total / 2) * 10) / 10;

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
    limiarReavaliacao,
    precisaReavaliacaoEtapa1,
    precisaReavaliacaoEtapa2,
    precisaReavaliacao: precisaReavaliacaoEtapa1 || precisaReavaliacaoEtapa2,
    status: classificarNota(total, limiaresNotas),
  };
}

function calcularResumoAtual(registros) {
  const totalAlunos = registros.length;
  const somaTotais = registros.reduce((soma, registro) => soma + Number(registro.total || 0), 0);

  return {
    totalAlunos,
    totalMedio: totalAlunos ? Math.round((somaTotais / totalAlunos) * 10) / 10 : 0,
    reavaliacao: registros.filter((registro) => registro.precisaReavaliacao).length,
  };
}

export default function Notas() {
  const navigate = useNavigate();
  const filtrosIniciais = useMemo(() => lerFiltrosNotas(), []);
  const [disciplinaId, setDisciplinaId] = useState(filtrosIniciais.disciplinaId);
  const [bimestreId, setBimestreId] = useState(filtrosIniciais.bimestreId);
  const [ano, setAno] = useState(filtrosIniciais.ano);
  const [turma, setTurma] = useState(filtrosIniciais.turma);
  const [busca, setBusca] = useState(filtrosIniciais.busca);
  const [reavaliacao, setReavaliacao] = useState(filtrosIniciais.reavaliacao);
  const [notas, setNotas] = useState({});
  const [salvandoAutomatico, setSalvandoAutomatico] = useState(false);
  const [pendentesCount, setPendentesCount] = useState(0);
  const [ultimoSalvamento, setUltimoSalvamento] = useState("");
  const [erroSalvamento, setErroSalvamento] = useState(false);
  const pendentesRef = useRef(new Map());
  const timerSalvamentoRef = useRef(null);
  const salvandoRef = useRef(false);
  const salvamentoAtualRef = useRef(Promise.resolve(true));
  const { alunos, carregandoAlunos, salvarNotas, estruturaEscolar, limiaresNotas } = useSchoolData();
  const { mostrarFeedback } = useFeedback();
  const anosEscolares = estruturaEscolar.anosEscolares || ANOS;
  const turmasEscolares = estruturaEscolar.turmas || TURMAS;
  const disciplinasEscolares = estruturaEscolar.disciplinas || DISCIPLINAS;
  const bimestresEscolares = estruturaEscolar.bimestres || BIMESTRES;
  const limiarReavaliacao = obterLimiarReavaliacao(limiaresNotas);

  const filtrosBase = { alunos, disciplinaId, bimestreId, ano, turma, busca, limiares: limiaresNotas };

  useEffect(() => {
    salvarFiltrosNotas({ disciplinaId, bimestreId, ano, turma, busca, reavaliacao });
  }, [ano, bimestreId, busca, disciplinaId, reavaliacao, turma]);

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

  const registrosCalculados = useMemo(
    () =>
      registrosBase.map((registro) => {
        const notaEditada = notas[registro.aluno.id] || montarNotaEditavel(registro);
        return calcularRegistroEditado(registro, notaEditada, limiaresNotas);
      }),
    [limiaresNotas, notas, registrosBase],
  );

  const registros = registrosCalculados.filter((registro) => {
    if (reavaliacao === "Apenas reavaliação") return registro.precisaReavaliacao;
    if (reavaliacao === "Sem reavaliação") return !registro.precisaReavaliacao;
    return true;
  });

  const temAlteracoesPendentes = pendentesCount > 0 || salvandoAutomatico;
  const resumo = calcularResumoAtual(registros);

  useEffect(() => {
    if (temAlteracoesPendentes) return;
    setNotas(notasBase);
  }, [notasBase, temAlteracoesPendentes]);

  const salvarFilaPendente = useCallback(async () => {
    if (timerSalvamentoRef.current) {
      window.clearTimeout(timerSalvamentoRef.current);
      timerSalvamentoRef.current = null;
    }

    if (salvandoRef.current) {
      await salvamentoAtualRef.current;
      if (pendentesRef.current.size > 0) {
        return salvarFilaPendente();
      }
      return true;
    }

    const itensPendentes = Array.from(pendentesRef.current.values());
    if (itensPendentes.length === 0) return true;

    pendentesRef.current.clear();
    setPendentesCount(0);
    setSalvandoAutomatico(true);
    setErroSalvamento(false);
    salvandoRef.current = true;

    const salvamento = (async () => {
      try {
        const grupos = new Map();

        itensPendentes.forEach((item) => {
          const chave = item.disciplinaId + "|" + item.bimestreId;
          const grupo = grupos.get(chave) || {
            disciplinaId: item.disciplinaId,
            bimestreId: item.bimestreId,
            registros: [],
          };

          grupo.registros.push(item.registro);
          grupos.set(chave, grupo);
        });

        for (const grupo of grupos.values()) {
          await salvarNotas(grupo.registros, grupo.disciplinaId, grupo.bimestreId);
        }

        setUltimoSalvamento(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
        return true;
      } catch (error) {
        itensPendentes.forEach((item) => {
          pendentesRef.current.set(item.chave, item);
        });
        setPendentesCount(pendentesRef.current.size);
        setErroSalvamento(true);
        mostrarFeedback("Não foi possível salvar as notas automaticamente.", "erro");
        return false;
      } finally {
        salvandoRef.current = false;
        setSalvandoAutomatico(false);
      }
    })();

    salvamentoAtualRef.current = salvamento;
    return salvamento;
  }, [mostrarFeedback, salvarNotas]);

  const agendarSalvamentoAutomatico = useCallback(() => {
    if (timerSalvamentoRef.current) {
      window.clearTimeout(timerSalvamentoRef.current);
    }

    timerSalvamentoRef.current = window.setTimeout(() => {
      salvarFilaPendente();
    }, 700);
  }, [salvarFilaPendente]);

  useEffect(
    () => () => {
      if (timerSalvamentoRef.current) {
        window.clearTimeout(timerSalvamentoRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!temAlteracoesPendentes) return undefined;

    const avisarAntesDeSair = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", avisarAntesDeSair);

    return () => {
      window.removeEventListener("beforeunload", avisarAntesDeSair);
    };
  }, [temAlteracoesPendentes]);

  useEffect(() => {
    if (!temAlteracoesPendentes) return undefined;

    let navegandoAposSalvar = false;

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

      if (navegandoAposSalvar) return;
      navegandoAposSalvar = true;

      const salvou = await salvarFilaPendente();
      navegandoAposSalvar = false;

      if (salvou) {
        navigate(rotaDestino);
      }
    };

    document.addEventListener("click", interceptarLinksInternos, true);

    return () => {
      document.removeEventListener("click", interceptarLinksInternos, true);
    };
  }, [navigate, salvarFilaPendente, temAlteracoesPendentes]);

  const alterarNota = (registro, campo, valor) => {
    const alunoId = registro.aluno.id;
    const notaAtual = notas[alunoId] || montarNotaEditavel(registro);
    const notaAtualizada = limparReavaliacaoQuandoNaoPrecisa(
      {
        ...notaAtual,
        [campo]: normalizarEntradaNota(valor),
      },
      limiarReavaliacao,
    );
    const registroAtualizado = calcularRegistroEditado(registro, notaAtualizada, limiaresNotas);
    const chave = disciplinaId + "|" + bimestreId + "|" + alunoId;

    setNotas((notasAtuais) => ({
      ...notasAtuais,
      [alunoId]: notaAtualizada,
    }));

    pendentesRef.current.set(chave, {
      chave,
      disciplinaId,
      bimestreId,
      registro: registroAtualizado,
    });
    setPendentesCount(pendentesRef.current.size);
    setErroSalvamento(false);
    agendarSalvamentoAutomatico();
  };

  const limparZeroAoFocar = (registro, campo) => {
    const valorAtual = notas[registro.aluno.id]?.[campo];

    if (Number(valorAtual || 0) === 0) {
      alterarNota(registro, campo, "");
    }
  };

  const valorInput = (alunoId, campo) => notas[alunoId]?.[campo] ?? "";

  const textoSalvamento = useMemo(() => {
    if (erroSalvamento) return "Erro ao salvar automaticamente";
    if (salvandoAutomatico) return "Salvando automaticamente...";
    if (pendentesCount > 0) return "Aguardando pausa na digitação...";
    if (ultimoSalvamento) return "Salvo automaticamente às " + ultimoSalvamento;
    return "Salvamento automático ativo";
  }, [erroSalvamento, pendentesCount, salvandoAutomatico, ultimoSalvamento]);

  const classeSalvamento = erroSalvamento
    ? "autosave-status error"
    : salvandoAutomatico || pendentesCount > 0
      ? "autosave-status saving"
      : "autosave-status saved";

  function renderCampoEtapa(registro, indiceLinha, campoEtapa, campoReavaliacao, dataTourEtapa, dataTourReavaliacao, rotuloEtapa) {
    const precisaReavaliacao = registro[campoEtapa] > 0 && registro[campoEtapa] < limiarReavaliacao;

    return (
      <div className={precisaReavaliacao ? "score-pair needs-reassessment" : "score-pair"}>
        <label className="score-field">
          <span className="score-label">
            <strong>Avaliação</strong>
            <em>{rotuloEtapa}</em>
          </span>
          <input
            className="score-input"
            data-tour={dataTourEtapa}
            data-note-input="true"
            data-note-row={indiceLinha}
            data-note-field={campoEtapa}
            type="number"
            min="0"
            max="50"
            value={valorInput(registro.aluno.id, campoEtapa)}
            onFocus={() => limparZeroAoFocar(registro, campoEtapa)}
            onChange={(event) => alterarNota(registro, campoEtapa, event.target.value)}
            onKeyDown={navegarEntreInputsDeNota}
          />
        </label>

        {precisaReavaliacao && (
          <label className="score-field reassessment-field">
            <span className="score-label">
              <strong>Reavaliação</strong>
              <em>{rotuloEtapa}</em>
            </span>
            <input
              className="score-input"
              data-tour={dataTourReavaliacao}
              data-note-input="true"
              data-note-row={indiceLinha}
              data-note-field={campoReavaliacao}
              type="number"
              min="0"
              max="50"
              value={valorInput(registro.aluno.id, campoReavaliacao)}
              onFocus={() => limparZeroAoFocar(registro, campoReavaliacao)}
              onChange={(event) => alterarNota(registro, campoReavaliacao, event.target.value)}
              onKeyDown={navegarEntreInputsDeNota}
            />
            <small className="reassessment-hint">Abaixo de {limiarReavaliacao}</small>
          </label>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Lançamento</span>
          <h1>Notas</h1>
          <p>Total das duas etapas finais, usando reavaliação apenas quando a avaliação ficar abaixo de {limiarReavaliacao}.</p>
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
          <span>Total médio</span>
          <strong>{formatarNota(resumo.totalMedio)}</strong>
          <p>Base filtrada</p>
        </article>

        <article className="metric-card warning">
          <span>Reavaliação</span>
          <strong>{resumo.reavaliacao}</strong>
          <p>Avaliação abaixo de {limiarReavaliacao}</p>
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

          <div className={classeSalvamento} data-tour="notas-salvar">
            {textoSalvamento}
          </div>
        </div>

        <div className="table-wrap notes-table-wrap" data-tour="notas-listagem">
          <table className="notes-table">
            <colgroup>
              <col className="notes-student-col" />
              <col className="notes-year-col" />
              <col className="notes-stage-col" />
              <col className="notes-stage-col" />
              <col className="notes-total-col" />
            </colgroup>
            <tbody>
              {registros.map((registro, indiceLinha) => (
                <tr key={registro.id} className={registro.precisaReavaliacao ? "needs-reassessment-row" : ""}>
                  <td
                    className="student-cell"
                    role="button"
                    tabIndex={0}
                    onClick={() => focarPrimeiroInputDaLinha(indiceLinha)}
                    onKeyDown={(event) => ativarLinhaPeloTeclado(event, indiceLinha)}
                  >
                    <strong>{registro.aluno.nome}</strong>
                    <small>Turma {registro.aluno.turma}</small>
                  </td>
                  <td className="year-cell">{registro.aluno.ano}</td>
                  <td className="stage-cell">
                    {renderCampoEtapa(
                      registro,
                      indiceLinha,
                      "etapa1",
                      campoReavaliacaoPorEtapa.etapa1,
                      "nota-etapa1",
                      "nota-etapa1-reavaliacao",
                      "1ª Etapa",
                    )}
                  </td>
                  <td className="stage-cell">
                    {renderCampoEtapa(
                      registro,
                      indiceLinha,
                      "etapa2",
                      campoReavaliacaoPorEtapa.etapa2,
                      "nota-etapa2",
                      "nota-etapa2-reavaliacao",
                      "2ª Etapa",
                    )}
                  </td>
                  <td className="total-cell" data-tour="nota-total">
                    <span>Total</span>
                    <strong>{formatarNota(registro.total)}</strong>
                    <small>
                      {registro.etapa1Final} + {registro.etapa2Final}
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
