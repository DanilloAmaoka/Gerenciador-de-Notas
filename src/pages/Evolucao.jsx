import { useMemo, useState } from "react";

import {
  ANOS,
  BIMESTRES,
  DISCIPLINAS,
  TURMAS,
  compararBimestres,
  filtrarAlunos,
  obterBimestreNome,
  obterDisciplinaNome,
  obterNota,
  obterTendencia,
} from "../data/notasData";
import { useFeedback } from "../context/FeedbackContext";
import { useSchoolData } from "../context/SchoolDataContext";

function escaparHtml(valor) {
  return String(valor || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatarNota(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

function larguraGrafico(valor) {
  return Math.min(100, Math.max(0, Number(valor || 0) * 2)) + "%";
}

export default function Evolucao() {
  const [disciplinaId, setDisciplinaId] = useState("portugues");
  const [bimestreInicialId, setBimestreInicialId] = useState("b1");
  const [bimestreFinalId, setBimestreFinalId] = useState("b2");
  const [ano, setAno] = useState("Todos");
  const [turma, setTurma] = useState("Todas");
  const [busca, setBusca] = useState("");
  const { alunos, anoLetivoAtual, estruturaEscolar } = useSchoolData();
  const { mostrarFeedback } = useFeedback();
  const anosEscolares = estruturaEscolar.anosEscolares || ANOS;
  const turmasEscolares = estruturaEscolar.turmas || TURMAS;
  const disciplinasEscolares = estruturaEscolar.disciplinas || DISCIPLINAS;
  const bimestresEscolares = estruturaEscolar.bimestres || BIMESTRES;
  const disciplinaNome = disciplinasEscolares.find((disciplina) => disciplina.id === disciplinaId)?.nome || obterDisciplinaNome(disciplinaId);
  const bimestreInicialNome = bimestresEscolares.find((bimestre) => bimestre.id === bimestreInicialId)?.nome || obterBimestreNome(bimestreInicialId);
  const bimestreFinalNome = bimestresEscolares.find((bimestre) => bimestre.id === bimestreFinalId)?.nome || obterBimestreNome(bimestreFinalId);

  const alunosFiltrados = useMemo(
    () => filtrarAlunos({ alunos, ano, turma, busca }),
    [alunos, ano, turma, busca],
  );

  const comparacoes = useMemo(
    () =>
      alunosFiltrados.map((aluno) => {
        const comparacao = compararBimestres(
          aluno,
          disciplinaId,
          bimestreInicialId,
          bimestreFinalId,
        );
        const notaFinal = obterNota(aluno, disciplinaId, bimestreFinalId);

        return {
          aluno,
          ...comparacao,
          evolucaoEtapas: notaFinal.evolucaoEtapas,
          tendenciaEtapas: obterTendencia(notaFinal.evolucaoEtapas),
        };
      }),
    [alunosFiltrados, bimestreFinalId, bimestreInicialId, disciplinaId],
  );

  const podioEvolucao = useMemo(
    () =>
      comparacoes
        .filter((comparacao) => comparacao.delta > 0)
        .sort((a, b) => b.delta - a.delta || b.final - a.final || a.aluno.nome.localeCompare(b.aluno.nome))
        .slice(0, 3),
    [comparacoes],
  );

  const melhoraram = comparacoes.filter((comparacao) => comparacao.delta > 0).length;
  const cairam = comparacoes.filter((comparacao) => comparacao.delta < 0).length;
  const estaveis = comparacoes.length - melhoraram - cairam;

  function classeLinha(delta) {
    if (delta > 0) return "evolution-row is-positive";
    if (delta < 0) return "evolution-row is-negative";
    return "evolution-row";
  }

  function montarCertificadoEvolucao(comparacao, index) {
    const posicao = index + 1;
    const medalha = posicao === 1 ? "1º lugar" : posicao === 2 ? "2º lugar" : "3º lugar";

    return (
      '<section class="certificate place-' +
      posicao +
      '">' +
      '<div class="sparkles">★ ★ ★</div>' +
      '<span class="ribbon">' +
      medalha +
      '</span>' +
      '<h1>Homenagem de Evolução</h1>' +
      '<p class="intro">Reconhecemos o crescimento e a dedicação de</p>' +
      '<h2>' +
      escaparHtml(comparacao.aluno.nome) +
      '</h2>' +
      '<p class="meta">' +
      escaparHtml(comparacao.aluno.ano) +
      ' · Turma ' +
      escaparHtml(comparacao.aluno.turma) +
      '</p>' +
      '<div class="score">+' +
      formatarNota(comparacao.delta) +
      '<small>pontos</small></div>' +
      '<p class="score-note">Média: ' +
      formatarNota(comparacao.inicial) +
      ' → ' +
      formatarNota(comparacao.final) +
      '</p>' +
      '<p class="message">Sua média em ' +
      escaparHtml(disciplinaNome) +
      ' evoluiu de ' +
      formatarNota(comparacao.inicial) +
      ' para ' +
      formatarNota(comparacao.final) +
      ' entre ' +
      escaparHtml(bimestreInicialNome) +
      ' e ' +
      escaparHtml(bimestreFinalNome) +
      '.</p>' +
      '<footer>Ano letivo ' +
      anoLetivoAtual +
      '</footer>' +
      '</section>'
    );
  }

  function gerarHomenagensEvolucao() {
    if (podioEvolucao.length === 0) {
      mostrarFeedback("Não há alunos com evolução positiva para homenagear.", "erro");
      return;
    }

    const janela = window.open("", "_blank", "width=1000,height=760");

    if (!janela) {
      mostrarFeedback("O navegador bloqueou a janela do PDF.", "erro");
      return;
    }

    const certificados = podioEvolucao.map(montarCertificadoEvolucao).join("");
    const html =
      '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />' +
      '<title>Homenagens de evolução</title>' +
      '<style>' +
      '*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}body{margin:0;font-family:"Segoe UI",Arial,sans-serif;color:#0f172a;background:#dcfce7}' +
      '.certificate{position:relative;overflow:hidden;width:100vw;min-height:100vh;padding:44px 56px;display:grid;place-items:center;align-content:center;gap:14px;text-align:center;page-break-after:always;background:linear-gradient(135deg,#f0fdf4 0%,#ffffff 42%,#eff6ff 100%);border:18px solid #86efac}' +
      '.certificate:before{content:"";position:absolute;inset:24px;border:2px solid rgba(21,128,61,.22);border-radius:28px}.certificate:after{content:"";position:absolute;right:-90px;top:-90px;width:260px;height:260px;border-radius:999px;background:#bbf7d0}' +
      '.certificate>*{position:relative}.certificate:last-child{page-break-after:auto}.sparkles{color:#f59e0b;font-size:30px;letter-spacing:14px;text-shadow:0 2px 0 #fff7ed}' +
      '.ribbon{padding:11px 22px;border-radius:999px;color:#fff;background:#16a34a;font-weight:900;text-transform:uppercase;letter-spacing:1px;box-shadow:0 10px 24px rgba(22,163,74,.25)}' +
      'h1{margin:0;font-size:48px;color:#166534}h2{margin:0;max-width:860px;font-size:44px;line-height:1.05;color:#0f172a}' +
      'p{margin:0;font-size:19px;color:#475569}.intro{font-weight:800}.meta{color:#15803d;font-weight:900}' +
      '.score{width:172px;height:172px;border-radius:999px;display:grid;place-items:center;align-content:center;font-size:56px;font-weight:900;border:10px solid #fff;background:linear-gradient(135deg,#dcfce7,#22c55e,#15803d);color:#052e16;box-shadow:0 22px 44px rgba(21,128,61,.2)}' +
      '.score small{display:block;font-size:16px;text-transform:uppercase;letter-spacing:.8px}.score-note{padding:8px 16px;border-radius:999px;background:#dcfce7;color:#166534;font-weight:900}.message{max-width:760px;line-height:1.5}footer{margin-top:18px;color:#64748b;font-weight:800}' +
      '.place-1{border-color:#22c55e}.place-2{border-color:#60a5fa}.place-2 .score{background:linear-gradient(135deg,#dbeafe,#60a5fa,#2563eb);color:#082f49}.place-3{border-color:#facc15}.place-3 .score{background:linear-gradient(135deg,#fef3c7,#facc15,#f59e0b);color:#78350f}' +
      '@media print{@page{size:A4 landscape;margin:0}body{background:#fff}.certificate{width:100vw;height:100vh}}' +
      '</style></head><body>' +
      certificados +
      '</body></html>';

    janela.document.write(html);
    janela.document.close();
    janela.focus();
    janela.setTimeout(() => janela.print(), 300);
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Comparativo</span>
          <h1>Evolução</h1>
          <p>
            Comparação entre {bimestreInicialNome} e{" "}
            {bimestreFinalNome}.
          </p>
        </div>
      </header>

      <section className="panel filters-panel" data-tour="evolucao-filtros">
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
            <span>De</span>
            <select value={bimestreInicialId} onChange={(event) => setBimestreInicialId(event.target.value)}>
              {bimestresEscolares.map((bimestre) => (
                <option key={bimestre.id} value={bimestre.id}>
                  {bimestre.nome}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Para</span>
            <select value={bimestreFinalId} onChange={(event) => setBimestreFinalId(event.target.value)}>
              {bimestresEscolares.map((bimestre) => (
                <option key={bimestre.id} value={bimestre.id}>
                  {bimestre.nome}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="metrics-grid" data-tour="evolucao-metricas">
        <article className="metric-card success">
          <span>Melhoraram</span>
          <strong>{melhoraram}</strong>
          <p>Subiram a nota bimestral</p>
        </article>

        <article className="metric-card danger">
          <span>Caíram</span>
          <strong>{cairam}</strong>
          <p>Reduziram desempenho</p>
        </article>

        <article className="metric-card">
          <span>Estáveis</span>
          <strong>{estaveis}</strong>
          <p>Sem alteração</p>
        </article>
      </section>

      <section className="podium-panel evolution-podium" data-tour="evolucao-podio">
        <div className="podium-header podium-header-actions">
          <div>
            <span className="eyebrow">Pódio de evolução</span>
            <h2>Maiores crescimentos</h2>
            <p>O pódio considera a maior diferença positiva entre os bimestres filtrados.</p>
          </div>

          <button
            type="button"
            className="button primary"
            data-tour="evolucao-homenagem"
            onClick={gerarHomenagensEvolucao}
            disabled={podioEvolucao.length === 0}
          >
            Homenagear pódio
          </button>
        </div>

        <div className="podium-grid clean-podium evolution-podium-grid">
          {podioEvolucao.length === 0 && (
            <div className="empty-state">
              Nenhum aluno com evolução positiva encontrado para este filtro.
            </div>
          )}

          {podioEvolucao.map((comparacao, index) => (
            <article className={"podium-card place-" + (index + 1)} key={comparacao.aluno.id}>
              <span className="rank-number">{index + 1}º</span>

              <div>
                <h2>{comparacao.aluno.nome}</h2>
                <p>
                  {comparacao.aluno.ano} · Turma {comparacao.aluno.turma}
                </p>
              </div>

              <strong>+{formatarNota(comparacao.delta)}</strong>
              <small>
                {formatarNota(comparacao.inicial)} → {formatarNota(comparacao.final)}
              </small>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Aluno por aluno</span>
            <h2>{comparacoes.length} alunos comparados</h2>
          </div>
        </div>

        <div className="evolution-list" data-tour="evolucao-lista">
          {comparacoes.map((comparacao) => (
            <div className={classeLinha(comparacao.delta)} key={comparacao.aluno.id}>
              <div className="evolution-student">
                <strong>{comparacao.aluno.nome}</strong>
                <span>
                  {comparacao.aluno.ano} · Turma {comparacao.aluno.turma}
                </span>
              </div>

              <div className="mini-chart" aria-label="Comparação bimestral">
                <span style={{ width: larguraGrafico(comparacao.inicial) }}>{formatarNota(comparacao.inicial)}</span>
                <span style={{ width: larguraGrafico(comparacao.final) }}>{formatarNota(comparacao.final)}</span>
              </div>

              <div className="evolution-status">
                <span className={comparacao.tendencia.classe}>
                  {comparacao.delta > 0 ? "+" : ""}
                  {formatarNota(comparacao.delta)}
                </span>
                <small>{comparacao.tendencia.label}</small>
              </div>

              <div className="evolution-status">
                <span className={comparacao.tendenciaEtapas.classe}>
                  {comparacao.evolucaoEtapas > 0 ? "+" : ""}
                  {comparacao.evolucaoEtapas}
                </span>
                <small>1ª para 2ª etapa</small>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
