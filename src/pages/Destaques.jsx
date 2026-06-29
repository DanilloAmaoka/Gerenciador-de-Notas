import { useMemo, useState } from "react";

import { ANOS, BIMESTRES, DISCIPLINAS, TURMAS, montarRegistros } from "../data/notasData";
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

export default function Destaques() {
  const [disciplinaId, setDisciplinaId] = useState("portugues");
  const [bimestreId, setBimestreId] = useState("b2");
  const [ano, setAno] = useState("Todos");
  const [turma, setTurma] = useState("Todas");
  const [busca, setBusca] = useState("");
  const { alunos, anoLetivoAtual, estruturaEscolar, limiaresNotas } = useSchoolData();
  const { mostrarFeedback } = useFeedback();

  const anosEscolares = estruturaEscolar.anosEscolares || ANOS;
  const turmasEscolares = estruturaEscolar.turmas || TURMAS;
  const disciplinasEscolares = estruturaEscolar.disciplinas || DISCIPLINAS;
  const bimestresEscolares = estruturaEscolar.bimestres || BIMESTRES;
  const disciplinaNome = disciplinasEscolares.find((disciplina) => disciplina.id === disciplinaId)?.nome || "Disciplina";
  const bimestreNome = bimestresEscolares.find((bimestre) => bimestre.id === bimestreId)?.nome || "Bimestre";

  const destaques = useMemo(
    () =>
      montarRegistros({ alunos, disciplinaId, bimestreId, ano, turma, busca, limiares: limiaresNotas })
        .filter((registro) => registro.total >= limiaresNotas.destaque)
        .sort((a, b) => b.total - a.total),
    [alunos, ano, bimestreId, busca, disciplinaId, limiaresNotas, turma],
  );

  const podio = destaques.slice(0, 3);

  function montarCertificado(registro, index) {
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
      '<h1>Homenagem de Destaque</h1>' +
      '<p class="intro">Com muito carinho, reconhecemos o excelente desempenho de</p>' +
      '<h2>' +
      escaparHtml(registro.aluno.nome) +
      '</h2>' +
      '<p class="meta">' +
      escaparHtml(registro.aluno.ano) +
      ' · Turma ' +
      escaparHtml(registro.aluno.turma) +
      '</p>' +
      '<div class="score">' +
      formatarNota(registro.total) +
      '<small>pontos</small></div>' +
      '<p class="score-note">Média das etapas: ' +
      formatarNota(registro.media) +
      '</p>' +
      '<p class="message">Parabéns pelo esforço, dedicação e brilho neste resultado em ' +
      escaparHtml(disciplinaNome) +
      '.</p>' +
      '<footer>' +
      escaparHtml(bimestreNome) +
      ' · Ano letivo ' +
      anoLetivoAtual +
      '</footer>' +
      '</section>'
    );
  }

  function gerarHomenagens() {
    if (podio.length === 0) {
      mostrarFeedback("Não há alunos no pódio para homenagear.", "erro");
      return;
    }

    const janela = window.open("", "_blank", "width=1000,height=760");

    if (!janela) {
      mostrarFeedback("O navegador bloqueou a janela do PDF.", "erro");
      return;
    }

    const certificados = podio.map(montarCertificado).join("");
    const html =
      '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />' +
      '<title>Homenagens do pódio</title>' +
      '<style>' +
      '*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}body{margin:0;font-family:"Segoe UI",Arial,sans-serif;color:#0f172a;background:#dbeafe}' +
      '.certificate{position:relative;overflow:hidden;width:100vw;min-height:100vh;padding:44px 56px;display:grid;place-items:center;align-content:center;gap:14px;text-align:center;page-break-after:always;background:linear-gradient(135deg,#eff6ff 0%,#ffffff 42%,#ecfeff 100%);border:18px solid #93c5fd}' +
      '.certificate:before{content:"";position:absolute;inset:24px;border:2px solid rgba(37,99,235,.22);border-radius:28px}.certificate:after{content:"";position:absolute;right:-90px;top:-90px;width:260px;height:260px;border-radius:999px;background:#bfdbfe}' +
      '.certificate>*{position:relative}.certificate:last-child{page-break-after:auto}.sparkles{color:#f59e0b;font-size:30px;letter-spacing:14px;text-shadow:0 2px 0 #fff7ed}' +
      '.ribbon{padding:11px 22px;border-radius:999px;color:#fff;background:#2563eb;font-weight:900;text-transform:uppercase;letter-spacing:1px;box-shadow:0 10px 24px rgba(37,99,235,.25)}' +
      'h1{margin:0;font-size:48px;color:#174a9c}h2{margin:0;max-width:860px;font-size:44px;line-height:1.05;color:#0f172a}' +
      'p{margin:0;font-size:19px;color:#475569}.intro{font-weight:800}.meta{color:#1d4ed8;font-weight:900}' +
      '.score{width:172px;height:172px;border-radius:999px;display:grid;place-items:center;align-content:center;font-size:58px;font-weight:900;border:10px solid #fff;box-shadow:0 22px 44px rgba(15,23,42,.18)}' +
      '.score small{display:block;font-size:16px;text-transform:uppercase;letter-spacing:.8px}.score-note{padding:8px 16px;border-radius:999px;background:#dbeafe;color:#174a9c;font-weight:900}.message{max-width:760px;line-height:1.5}footer{margin-top:18px;color:#64748b;font-weight:800}' +
      '.place-1{border-color:#facc15}.place-1 .score{background:linear-gradient(135deg,#fef3c7,#facc15,#f59e0b);color:#78350f}.place-2{border-color:#cbd5e1}.place-2 .score{background:linear-gradient(135deg,#f8fafc,#cbd5e1,#94a3b8);color:#334155}.place-3{border-color:#fdba74}.place-3 .score{background:linear-gradient(135deg,#ffedd5,#fdba74,#f97316);color:#7c2d12}' +
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
          <span className="eyebrow">Reconhecimento</span>
          <h1>Alunos destaque</h1>
          <p>Pódio dos melhores alunos conforme filtros de ano, turma, disciplina e bimestre.</p>
        </div>
      </header>

      <section className="panel filters-panel" data-tour="destaques-filtros">
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

      <section className="podium-panel" data-tour="destaques-podio">
        <div className="podium-header podium-header-actions">
          <div>
            <span className="eyebrow">Pódio filtrado</span>
            <h2>Alunos nota 10</h2>
            <p>O pódio muda automaticamente conforme o ano e a turma selecionados.</p>
          </div>

          <button
            type="button"
            className="button primary"
            data-tour="destaques-homenagem"
            onClick={gerarHomenagens}
            disabled={podio.length === 0}
          >
            Homenagear pódio
          </button>
        </div>

        <div className="podium-grid clean-podium">
          {podio.length === 0 && (
            <div className="empty-state">
              Nenhum aluno acima do limite de destaque encontrado para este filtro.
            </div>
          )}

          {podio.map((registro, index) => (
            <article className={"podium-card place-" + (index + 1)} key={registro.id}>
              <span className="rank-number">{index + 1}º</span>

              <div>
                <h2>{registro.aluno.nome}</h2>
                <p>
                  {registro.aluno.ano} · Turma {registro.aluno.turma}
                </p>
              </div>

              <strong>{registro.total}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="panel" data-tour="destaques-lista">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Lista completa</span>
            <h2>{destaques.length} alunos acima de {limiaresNotas.destaque}</h2>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Posição</th>
                <th>Aluno</th>
                <th>Ano</th>
                <th>Turma</th>
                <th>1ª etapa válida</th>
                <th>2ª etapa válida</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              {destaques.map((registro, index) => (
                <tr key={registro.id}>
                  <td>{index + 1}º</td>
                  <td>{registro.aluno.nome}</td>
                  <td>{registro.aluno.ano}</td>
                  <td>{registro.aluno.turma}</td>
                  <td>{registro.etapa1Final}</td>
                  <td>{registro.etapa2Final}</td>
                  <td>
                    <span className="status-badge status-destaque">{registro.total}</span>
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
