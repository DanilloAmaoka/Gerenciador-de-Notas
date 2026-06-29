import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../firebase/config";
import {
  ANOS,
  BIMESTRES,
  DISCIPLINAS,
  TURMAS,
  calcularResumo,
  classificarNota,
  filtrarAlunos,
  obterBimestreNome,
  obterDisciplinaNome,
  obterNota,
} from "../data/notasData";
import { useFeedback } from "../context/FeedbackContext";
import { useSchoolData } from "../context/SchoolDataContext";

const tiposRelatorio = [
  "Resumo por turma",
  "Alunos abaixo da meta",
  "Alunos críticos",
  "Alunos destaque",
  "Evolução bimestral",
  "Relatório anual",
];

function criarSlug(texto) {
  return String(texto || "todos")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function criarIdRelatorio({ anoLetivo, tipo, disciplinaId, bimestreId, ano, turma, busca }) {
  return [
    anoLetivo,
    criarSlug(tipo),
    disciplinaId,
    bimestreId,
    criarSlug(ano),
    criarSlug(turma),
    criarSlug(busca || "todos"),
  ].join("_");
}

function formatarData(valor) {
  if (!valor) return "Sem data";
  if (typeof valor.toDate === "function") return valor.toDate().toLocaleString("pt-BR");
  return String(valor);
}

function arredondarMedia(valor) {
  return Math.round(valor * 10) / 10;
}

function montarResumo(registros, limiares) {
  const totalAlunos = registros.length;
  const soma = registros.reduce((total, registro) => total + Number(registro.media ?? registro.total ?? 0), 0);

  return {
    totalAlunos,
    media: totalAlunos ? arredondarMedia(soma / totalAlunos) : 0,
    destaque: registros.filter((registro) => registro.total >= limiares.destaque).length,
    reforco: registros.filter((registro) => registro.total >= limiares.critico && registro.total < limiares.meta).length,
    critico: registros.filter((registro) => registro.total < limiares.critico).length,
  };
}

export default function Relatorios() {
  const { alunos, anoLetivoAtual, estruturaEscolar, limiaresNotas } = useSchoolData();
  const { mostrarFeedback, pedirConfirmacao } = useFeedback();
  const [abaAtiva, setAbaAtiva] = useState("novo");
  const [tipo, setTipo] = useState("Resumo por turma");
  const [disciplinaId, setDisciplinaId] = useState("portugues");
  const [bimestreId, setBimestreId] = useState("b2");
  const [ano, setAno] = useState("Todos");
  const [turma, setTurma] = useState("Todas");
  const [busca, setBusca] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [carregandoSalvos, setCarregandoSalvos] = useState(false);
  const [relatoriosSalvos, setRelatoriosSalvos] = useState([]);
  const [relatorioSelecionado, setRelatorioSelecionado] = useState(null);

  const anosEscolares = estruturaEscolar.anosEscolares || ANOS;
  const turmasEscolares = estruturaEscolar.turmas || TURMAS;
  const disciplinasEscolares = estruturaEscolar.disciplinas || DISCIPLINAS;
  const bimestresEscolares = estruturaEscolar.bimestres || BIMESTRES;
  const anoLetivo = anoLetivoAtual;
  const dataGeracao = new Date().toLocaleString("pt-BR");

  function nomeDisciplina(id) {
    return disciplinasEscolares.find((disciplina) => disciplina.id === id)?.nome || obterDisciplinaNome(id);
  }

  function nomeBimestre(id) {
    return bimestresEscolares.find((bimestre) => bimestre.id === id)?.nome || obterBimestreNome(id);
  }

  const relatorioAtual = useMemo(() => {
    const filtros = { alunos, disciplinaId, bimestreId, ano, turma, busca, limiares: limiaresNotas };
    const relatorioId = criarIdRelatorio({
      anoLetivo,
      tipo,
      disciplinaId,
      bimestreId: tipo === "Relatório anual" ? "anual" : bimestreId,
      ano,
      turma,
      busca,
    });

    if (tipo === "Relatório anual") {
      const alunosFiltrados = filtrarAlunos({ alunos, ano, turma, busca });
      const registrosAnuais = alunosFiltrados.map((aluno) => {
        const notasBimestrais = bimestresEscolares.map((bimestre) => obterNota(aluno, disciplinaId, bimestre.id));
        const totais = notasBimestrais.map((nota) => nota.total);
        const medias = notasBimestrais.map((nota) => nota.media);
        const divisor = bimestresEscolares.length || 1;
        const total = Math.round(totais.reduce((soma, nota) => soma + nota, 0) / divisor);
        const media = arredondarMedia(medias.reduce((soma, nota) => soma + nota, 0) / divisor);
        const status = classificarNota(total, limiaresNotas);

        return {
          alunoId: aluno.id,
          aluno: aluno.nome,
          ano: aluno.ano,
          turma: aluno.turma,
          etapa1: "-",
          etapa2: "-",
          total,
          media,
          situacao: status.label,
          statusClasse: status.classe,
        };
      });

      return {
        id: relatorioId,
        tipo,
        ano,
        turma,
        busca,
        anoLetivo,
        disciplinaId,
        disciplinaNome: nomeDisciplina(disciplinaId),
        bimestreId: "anual",
        bimestreNome: "Todos os bimestres",
        dataLocal: dataGeracao,
        resumo: montarResumo(registrosAnuais, limiaresNotas),
        registros: registrosAnuais,
      };
    }

    const resumoBase = calcularResumo(filtros);
    let registros = resumoBase.registros;

    if (tipo === "Alunos abaixo da meta") registros = registros.filter((registro) => registro.total < limiaresNotas.meta);
    if (tipo === "Alunos críticos") registros = registros.filter((registro) => registro.total < limiaresNotas.critico);
    if (tipo === "Alunos destaque") registros = registros.filter((registro) => registro.total >= limiaresNotas.destaque);

    const registrosFormatados = registros.map((registro) => ({
      alunoId: registro.aluno.id,
      aluno: registro.aluno.nome,
      ano: registro.aluno.ano,
      turma: registro.aluno.turma,
      etapa1: registro.etapa1,
      etapa2: registro.etapa2,
      total: registro.total,
      media: registro.media,
      situacao: registro.status.label,
      statusClasse: registro.status.classe,
    }));

    return {
      id: relatorioId,
      tipo,
      ano,
      turma,
      busca,
      anoLetivo,
      disciplinaId,
      disciplinaNome: nomeDisciplina(disciplinaId),
      bimestreId,
      bimestreNome: nomeBimestre(bimestreId),
      dataLocal: dataGeracao,
      resumo: montarResumo(registrosFormatados, limiaresNotas),
      registros: registrosFormatados,
    };
  }, [alunos, ano, anoLetivo, bimestreId, busca, dataGeracao, disciplinaId, tipo, turma, bimestresEscolares, limiaresNotas]);

  const relatorioEmTela = relatorioSelecionado || relatorioAtual;

  useEffect(() => {
    carregarRelatoriosSalvos();
  }, []);

  async function carregarRelatoriosSalvos() {
    setCarregandoSalvos(true);

    try {
      const consulta = query(collection(db, "relatorios"), orderBy("atualizadoEm", "desc"), limit(60));
      const resultado = await getDocs(consulta);

      setRelatoriosSalvos(
        resultado.docs.map((documento) => ({
          id: documento.id,
          ...documento.data(),
        })),
      );
    } catch (error) {
      mostrarFeedback("Não foi possível consultar os relatórios salvos.", "erro");
    } finally {
      setCarregandoSalvos(false);
    }
  }

  async function salvarRelatorio() {
    setSalvando(true);

    try {
      const referencia = doc(db, "relatorios", relatorioAtual.id);
      const relatorioExistente = await getDoc(referencia);

      await setDoc(
        referencia,
        {
          ...relatorioAtual,
          criadoEm: relatorioExistente.exists() ? relatorioExistente.data().criadoEm : serverTimestamp(),
          atualizadoEm: serverTimestamp(),
        },
        { merge: true },
      );

      await carregarRelatoriosSalvos();
      setRelatorioSelecionado({ ...relatorioAtual, atualizadoEm: "Agora" });
      setAbaAtiva("salvos");

      mostrarFeedback(
        relatorioExistente.exists()
          ? "Relatório atualizado sem criar duplicado."
          : "Relatório salvo no banco de dados.",
      );
    } catch (error) {
      mostrarFeedback("Não foi possível salvar o relatório.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  function consultarRelatorio(relatorio) {
    setRelatorioSelecionado(relatorio);
    setAbaAtiva("novo");
    mostrarFeedback("Relatório salvo aberto para consulta.");
  }

  async function excluirRelatorio(relatorio) {
    const confirmado = await pedirConfirmacao({
      titulo: "Deletar relatório",
      mensagem: "Deseja deletar o relatório " + relatorio.tipo + "? Esta ação não apaga alunos nem notas.",
      textoConfirmar: "Deletar",
      perigo: true,
    });

    if (!confirmado) return;

    try {
      await deleteDoc(doc(db, "relatorios", relatorio.id));
      setRelatoriosSalvos((lista) => lista.filter((item) => item.id !== relatorio.id));

      if (relatorioSelecionado?.id === relatorio.id) {
        setRelatorioSelecionado(null);
      }

      mostrarFeedback("Relatório deletado do banco de dados.");
    } catch (error) {
      mostrarFeedback("Não foi possível deletar o relatório.", "erro");
    }
  }

  function gerarPdf(relatorio = relatorioEmTela) {
    setRelatorioSelecionado(relatorio);
    setAbaAtiva("novo");
    window.setTimeout(() => window.print(), 160);
  }

  function voltarParaNovoRelatorio() {
    setRelatorioSelecionado(null);
  }

  return (
    <div className="page reports-page">
      <header className="page-header no-print">
        <div>
          <span className="eyebrow">Documentos</span>
          <h1>Relatórios</h1>
          <p>Gere, salve, consulte e imprima relatórios bimestrais ou anuais.</p>
        </div>
      </header>

      <div className="tab-bar no-print" data-tour="relatorio-abas">
        <button
          type="button"
          className={abaAtiva === "novo" ? "active" : ""}
          onClick={() => setAbaAtiva("novo")}
        >
          Novo relatório
        </button>
        <button
          type="button"
          className={abaAtiva === "salvos" ? "active" : ""}
          onClick={() => setAbaAtiva("salvos")}
        >
          Relatórios salvos ({relatoriosSalvos.length})
        </button>
      </div>

      {abaAtiva === "salvos" ? (
        <section className="panel no-print saved-reports-panel" data-tour="relatorios-salvos">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Banco de dados</span>
              <h2>Relatórios salvos</h2>
            </div>

            <button type="button" className="button secondary" onClick={carregarRelatoriosSalvos}>
              {carregandoSalvos ? "Consultando..." : "Atualizar lista"}
            </button>
          </div>

          <div className="saved-report-list">
            {relatoriosSalvos.length === 0 && (
              <p className="muted-text">Nenhum relatório salvo encontrado ainda.</p>
            )}

            {relatoriosSalvos.map((relatorio) => (
              <article className="saved-report-card" key={relatorio.id}>
                <div>
                  <strong>{relatorio.tipo}</strong>
                  <span>
                    {relatorio.disciplinaNome} · {relatorio.bimestreNome} · Turma {relatorio.turma} ·{" "}
                    {relatorio.ano}
                  </span>
                </div>

                <div>
                  <span>{formatarData(relatorio.atualizadoEm || relatorio.criadoEm)}</span>
                  <strong>{relatorio.resumo?.totalAlunos || 0} alunos</strong>
                </div>

                <div className="saved-report-actions">
                  <button type="button" className="button secondary small" onClick={() => consultarRelatorio(relatorio)}>
                    Consultar
                  </button>
                  <button type="button" className="button primary small" onClick={() => gerarPdf(relatorio)}>
                    PDF
                  </button>
                  <button type="button" className="button danger small" data-tour="relatorio-deletar-salvo" onClick={() => excluirRelatorio(relatorio)}>
                    Deletar
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="content-grid two-columns narrow-left report-workspace">
          <div className="panel report-config no-print">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Novo relatório</span>
                <h2>Configuração</h2>
              </div>
            </div>

            <div className="report-options" data-tour="relatorio-tipo">
              {tiposRelatorio.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={tipo === item ? "active" : ""}
                  onClick={() => {
                    setTipo(item);
                    setRelatorioSelecionado(null);
                  }}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="form-stack" data-tour="relatorio-filtros">
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
                <span>Ano escolar</span>
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

              {tipo !== "Relatório anual" && (
                <label className="field-group">
                  <span>Bimestre</span>
                  <select value={bimestreId} onChange={(event) => setBimestreId(event.target.value)}>
                    {bimestresEscolares.map((bimestre) => (
                      <option key={bimestre.id} value={bimestre.id}>
                        {bimestre.nome}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <div className="button-row">
              <button
                type="button"
                className="button primary"
                data-tour="relatorio-salvar"
                onClick={salvarRelatorio}
                disabled={salvando}
              >
                {salvando ? "Salvando..." : "Salvar relatório"}
              </button>

              <button type="button" className="button secondary" onClick={() => gerarPdf(relatorioAtual)}>
                Gerar PDF
              </button>
            </div>
          </div>

          <div className="panel report-preview print-area">
            {relatorioSelecionado && (
              <div className="selected-report-banner no-print">
                <span>Visualizando relatório salvo</span>
                <button type="button" className="button secondary small" onClick={voltarParaNovoRelatorio}>
                  Voltar ao relatório atual
                </button>
              </div>
            )}

            <div className="print-header">
              <span className="eyebrow">Prévia do relatório</span>
              <h2>{relatorioEmTela.tipo}</h2>

              <div className="print-meta-grid">
                <span>Turma: {relatorioEmTela.turma}</span>
                <span>Ano escolar: {relatorioEmTela.ano}</span>
                <span>Busca: {relatorioEmTela.busca || "Todos"}</span>
                <span>Disciplina: {relatorioEmTela.disciplinaNome}</span>
                <span>Bimestre: {relatorioEmTela.bimestreNome}</span>
                <span>Ano letivo: {relatorioEmTela.anoLetivo}</span>
                <span>Gerado em: {relatorioEmTela.dataLocal || formatarData(relatorioEmTela.criadoEm)}</span>
              </div>
            </div>

            <section className="report-summary">
              <div>
                <span>Média</span>
                <strong>{relatorioEmTela.resumo?.media || 0}</strong>
              </div>
              <div>
                <span>Destaques</span>
                <strong>{relatorioEmTela.resumo?.destaque || 0}</strong>
              </div>
              <div>
                <span>Reforço</span>
                <strong>{relatorioEmTela.resumo?.reforco || 0}</strong>
              </div>
              <div>
                <span>Críticos</span>
                <strong>{relatorioEmTela.resumo?.critico || 0}</strong>
              </div>
            </section>

            <div className="table-wrap">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>Ano</th>
                    <th>Turma</th>
                    <th>Total</th>
                    <th>Situação</th>
                  </tr>
                </thead>

                <tbody>
                  {relatorioEmTela.registros.map((registro) => (
                    <tr key={registro.alunoId}>
                      <td>{registro.aluno}</td>
                      <td>{registro.ano}</td>
                      <td>{registro.turma}</td>
                      <td>{registro.total}</td>
                      <td>
                        <span className={"status-badge " + (registro.statusClasse || "status-meta")}>
                          {registro.situacao}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
