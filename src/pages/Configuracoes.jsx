import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

import { LIMIARES_PADRAO } from "../data/notasData";
import { useFeedback } from "../context/FeedbackContext";
import { useSchoolData } from "../context/SchoolDataContext";

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function criarId(texto) {
  return normalizarTexto(texto)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function serializarLista(lista = []) {
  return lista.join("\n");
}

function parseLista(texto) {
  return texto
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function serializarItensComId(lista = []) {
  return lista.map((item) => item.id + " | " + item.nome).join("\n");
}

function parseItensComId(texto, prefixo) {
  return texto
    .split("\n")
    .map((linha, index) => {
      const partes = linha.split("|").map((parte) => parte.trim()).filter(Boolean);
      const id = partes.length > 1 ? partes[0] : criarId(partes[0] || prefixo + "-" + (index + 1));
      const nome = partes.length > 1 ? partes.slice(1).join(" | ") : partes[0];

      return nome ? { id: id || prefixo + "-" + (index + 1), nome } : null;
    })
    .filter(Boolean);
}

function serializarAlunos(alunos = []) {
  return alunos.map((aluno) => aluno.nome + " | " + aluno.ano + " | " + aluno.turma).join("\n");
}

function parseAlunos(texto, alunosAtuais) {
  const alunosPorNome = new Map(alunosAtuais.map((aluno) => [normalizarTexto(aluno.nome), aluno]));

  return texto
    .split("\n")
    .map((linha) => {
      const [nome, ano, turma] = linha.split("|").map((parte) => parte.trim());
      if (!nome || !ano || !turma) return null;

      const alunoOriginal = alunosPorNome.get(normalizarTexto(nome));

      return {
        id: alunoOriginal?.id,
        nome,
        ano,
        turma,
      };
    })
    .filter(Boolean);
}

export default function Configuracoes() {
  const {
    alunos,
    anoLetivoAtual,
    estruturaEscolar,
    limiaresNotas,
    salvarConfiguracoesDoSite,
    finalizarAnoLetivo,
  } = useSchoolData();
  const { mostrarFeedback, pedirConfirmacao } = useFeedback();
  const [limiares, setLimiares] = useState(LIMIARES_PADRAO);
  const [anoLetivo, setAnoLetivo] = useState(anoLetivoAtual);
  const [salvando, setSalvando] = useState(false);
  const [fechamentoAberto, setFechamentoAberto] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [proximoAno, setProximoAno] = useState(Number(anoLetivoAtual) + 1);
  const [manterAlunos, setManterAlunos] = useState(true);
  const [linhasAlunos, setLinhasAlunos] = useState("");
  const [linhasAnos, setLinhasAnos] = useState("");
  const [linhasTurmas, setLinhasTurmas] = useState("");
  const [linhasDisciplinas, setLinhasDisciplinas] = useState("");
  const [linhasBimestres, setLinhasBimestres] = useState("");

  useEffect(() => {
    setAnoLetivo(anoLetivoAtual);
    setProximoAno(Number(anoLetivoAtual) + 1);
  }, [anoLetivoAtual]);

  useEffect(() => {
    setLimiares(limiaresNotas || LIMIARES_PADRAO);
  }, [limiaresNotas]);

  const estruturaResumo = useMemo(() => ({
    anos: estruturaEscolar.anosEscolares || [],
    turmas: estruturaEscolar.turmas || [],
    disciplinas: estruturaEscolar.disciplinas || [],
    bimestres: estruturaEscolar.bimestres || [],
  }), [estruturaEscolar]);

  const alterarLimiar = (campo, valor) => {
    setLimiares((valoresAtuais) => ({
      ...valoresAtuais,
      [campo]: Number(valor),
    }));
  };

  async function salvarConfiguracoes() {
    setSalvando(true);

    try {
      await salvarConfiguracoesDoSite({
        anoLetivo: Number(anoLetivo),
        estrutura: estruturaEscolar,
        limiares,
      });

      mostrarFeedback("Configurações salvas no banco de dados.");
    } catch (error) {
      mostrarFeedback("Não foi possível salvar as configurações.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  function abrirFechamento() {
    setFechamentoAberto(true);
    setProximoAno(Number(anoLetivoAtual) + 1);
    setManterAlunos(true);
    setLinhasAlunos(serializarAlunos(alunos));
    setLinhasAnos(serializarLista(estruturaResumo.anos));
    setLinhasTurmas(serializarLista(estruturaResumo.turmas));
    setLinhasDisciplinas(serializarItensComId(estruturaResumo.disciplinas));
    setLinhasBimestres(serializarItensComId(estruturaResumo.bimestres));
  }

  async function confirmarFechamento() {
    const estruturaProximoAno = {
      anosEscolares: parseLista(linhasAnos),
      turmas: parseLista(linhasTurmas),
      disciplinas: parseItensComId(linhasDisciplinas, "disciplina"),
      bimestres: parseItensComId(linhasBimestres, "bimestre"),
    };
    const alunosProximoAno = parseAlunos(linhasAlunos, alunos);

    if (!Number(proximoAno)) {
      mostrarFeedback("Informe o próximo ano letivo.", "erro");
      return;
    }

    if (manterAlunos && alunosProximoAno.length === 0) {
      mostrarFeedback("Informe ao menos um aluno para manter no próximo ano.", "erro");
      return;
    }

    if (estruturaProximoAno.anosEscolares.length === 0 || estruturaProximoAno.turmas.length === 0) {
      mostrarFeedback("Confira anos escolares e turmas antes de finalizar.", "erro");
      return;
    }

    const confirmado = await pedirConfirmacao({
      titulo: "Finalizar ano atual",
      mensagem:
        "O ano " +
        anoLetivoAtual +
        " será arquivado, as notas atuais serão limpas e o sistema começará em " +
        proximoAno +
        ". Deseja continuar?",
      textoConfirmar: "Finalizar ano",
      perigo: true,
    });

    if (!confirmado) return;

    try {
      setFinalizando(true);
      const resultado = await finalizarAnoLetivo({
        proximoAno: Number(proximoAno),
        manterAlunos,
        alunosProximoAno,
        estruturaProximoAno,
      });

      setFechamentoAberto(false);
      mostrarFeedback(
        "Ano " +
          resultado.anoArquivado +
          " arquivado. Sistema iniciado em " +
          resultado.proximoAno +
          " com " +
          resultado.alunosMantidos +
          " alunos.",
      );
    } catch (error) {
      mostrarFeedback("Não foi possível finalizar o ano atual.", "erro");
    } finally {
      setFinalizando(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Preferências</span>
          <h1>Configurações</h1>
          <p>Regras principais usadas para classificar desempenho, alertas e relatórios.</p>
        </div>
      </header>

      <section className="content-grid two-columns">
        <div className="panel" data-tour="config-limiares">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Parâmetros</span>
              <h2>Faixas de nota</h2>
            </div>
          </div>

          <div className="settings-list">
            <label>
              <div>
                <strong>Aluno destaque</strong>
                <span>Acima desta nota entra em alunos nota 10</span>
              </div>
              <input
                type="number"
                value={limiares.destaque}
                min="0"
                max="100"
                onChange={(event) => alterarLimiar("destaque", event.target.value)}
              />
            </label>

            <label>
              <div>
                <strong>Meta mínima</strong>
                <span>Abaixo desta nota entra em reforço</span>
              </div>
              <input
                type="number"
                value={limiares.meta}
                min="0"
                max="100"
                onChange={(event) => alterarLimiar("meta", event.target.value)}
              />
            </label>

            <label>
              <div>
                <strong>Limite crítico</strong>
                <span>Abaixo desta nota recebe prioridade alta</span>
              </div>
              <input
                type="number"
                value={limiares.critico}
                min="0"
                max="100"
                onChange={(event) => alterarLimiar("critico", event.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="panel" data-tour="config-ano-letivo">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Ano letivo</span>
              <h2>Controle anual</h2>
            </div>
          </div>

          <label className="field-group">
            <span>Ano letivo ativo</span>
            <input
              type="number"
              value={anoLetivo}
              onChange={(event) => setAnoLetivo(event.target.value)}
            />
          </label>

          <p className="muted-text">
            O fechamento anual arquiva o ano atual, mantém no máximo dois anos completos e deixa os
            relatórios anuais salvos separadamente.
          </p>

          <div className="tag-list">
            {estruturaResumo.anos.map((ano) => (
              <span key={ano}>{ano}</span>
            ))}
          </div>

          <div className="tag-list">
            {estruturaResumo.disciplinas.map((disciplina) => (
              <span key={disciplina.id}>{disciplina.nome}</span>
            ))}
          </div>
        </div>
      </section>

      <div className="button-row">
        <button
          type="button"
          className="button primary"
          data-tour="config-salvar"
          onClick={salvarConfiguracoes}
          disabled={salvando}
        >
          {salvando ? "Salvando..." : "Salvar configurações"}
        </button>

        <button
          type="button"
          className="button secondary"
          data-tour="config-finalizar-ano"
          onClick={abrirFechamento}
        >
          Finalizar ano atual
        </button>

        <NavLink className="button secondary" to="/anos-antigos" data-tour="config-anos-antigos">
          Consultar anos antigos
        </NavLink>
      </div>

      {fechamentoAberto && (
        <section className="panel closing-panel" data-tour="config-fechamento-form">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Fechamento anual</span>
              <h2>Revisar próximo ano</h2>
              <p>Edite o que será usado no próximo ano antes de confirmar.</p>
            </div>
          </div>

          <div className="closing-grid">
            <label className="field-group">
              <span>Próximo ano letivo</span>
              <input
                type="number"
                value={proximoAno}
                onChange={(event) => setProximoAno(event.target.value)}
              />
            </label>

            <label className="toggle-card">
              <input
                type="checkbox"
                checked={manterAlunos}
                onChange={(event) => setManterAlunos(event.target.checked)}
              />
              <span>Manter alunos no próximo ano, limpando as notas</span>
            </label>

            <label className="field-group">
              <span>Anos escolares</span>
              <textarea
                value={linhasAnos}
                onChange={(event) => setLinhasAnos(event.target.value)}
                rows="4"
              />
            </label>

            <label className="field-group">
              <span>Turmas</span>
              <textarea
                value={linhasTurmas}
                onChange={(event) => setLinhasTurmas(event.target.value)}
                rows="4"
              />
            </label>

            <label className="field-group">
              <span>Disciplinas: id | nome</span>
              <textarea
                value={linhasDisciplinas}
                onChange={(event) => setLinhasDisciplinas(event.target.value)}
                rows="4"
              />
            </label>

            <label className="field-group">
              <span>Bimestres: id | nome</span>
              <textarea
                value={linhasBimestres}
                onChange={(event) => setLinhasBimestres(event.target.value)}
                rows="4"
              />
            </label>
          </div>

          {manterAlunos && (
            <label className="field-group">
              <span>Alunos do próximo ano: nome | ano | turma</span>
              <textarea
                className="student-editor"
                value={linhasAlunos}
                onChange={(event) => setLinhasAlunos(event.target.value)}
                rows="12"
              />
            </label>
          )}

          <div className="button-row">
            <button type="button" className="button secondary" onClick={() => setFechamentoAberto(false)}>
              Cancelar
            </button>

            <button
              type="button"
              className="button danger"
              data-tour="config-fechamento-confirmar"
              onClick={confirmarFechamento}
              disabled={finalizando}
            >
              {finalizando ? "Finalizando..." : "Confirmar fechamento"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
