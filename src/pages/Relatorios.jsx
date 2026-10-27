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

function textoSeguro(valor, fallback = "-") {
  const texto = String(valor ?? "").replace(/\s+/g, " ").trim();
  return texto || fallback;
}

function valorNumerico(valor) {
  return Number.isFinite(Number(valor)) ? String(arredondarMedia(Number(valor))) : "0";
}

function escaparTextoPdf(valor) {
  return textoSeguro(valor)
    .replace(/[^\x20-\xFF]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function comandoTextoPdf(texto, x, y, tamanho = 10, fonte = "F1") {
  return "0 g 0 G BT /" + fonte + " " + tamanho + " Tf " + x + " " + y + " Td (" + escaparTextoPdf(texto) + ") Tj ET\n";
}

function comandoLinhaPdf(x1, y1, x2, y2) {
  return "0 G 0.75 w " + x1 + " " + y1 + " m " + x2 + " " + y2 + " l S\n";
}

function comandoRetanguloPdf(x, y, largura, altura, preenchimento = null) {
  if (preenchimento === null) {
    return "0 G 0.75 w " + x + " " + y + " " + largura + " " + altura + " re S\n";
  }

  return preenchimento + " g " + x + " " + y + " " + largura + " " + altura + " re f 0 G 0.75 w " + x + " " + y + " " + largura + " " + altura + " re S\n";
}

function quebrarTextoPdf(texto, largura, tamanho = 10) {
  const maximo = Math.max(10, Math.floor(largura / (tamanho * 0.52)));
  const palavras = textoSeguro(texto).split(" ");
  const linhas = [];
  let linhaAtual = "";

  palavras.forEach((palavra) => {
    const tentativa = linhaAtual ? linhaAtual + " " + palavra : palavra;

    if (tentativa.length <= maximo) {
      linhaAtual = tentativa;
      return;
    }

    if (linhaAtual) linhas.push(linhaAtual);
    linhaAtual = palavra;
  });

  if (linhaAtual) linhas.push(linhaAtual);
  return linhas.length ? linhas : ["-"];
}

function criarDocumentoPdf(paginas) {
  const largura = 595.28;
  const altura = 841.89;
  const objetos = [];

  objetos[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objetos[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objetos[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

  const filhos = [];

  paginas.forEach((conteudo, indice) => {
    const paginaId = 5 + indice * 2;
    const conteudoId = paginaId + 1;

    filhos.push(paginaId + " 0 R");
    objetos[paginaId] =
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " +
      largura +
      " " +
      altura +
      "] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents " +
      conteudoId +
      " 0 R >>";
    objetos[conteudoId] = "<< /Length " + conteudo.length + " >>\nstream\n" + conteudo + "endstream";
  });

  objetos[2] = "<< /Type /Pages /Kids [" + filhos.join(" ") + "] /Count " + paginas.length + " >>";

  let pdf = "%PDF-1.4\n%\xFF\xFF\xFF\xFF\n";
  const deslocamentos = [0];

  for (let indice = 1; indice < objetos.length; indice += 1) {
    deslocamentos[indice] = pdf.length;
    pdf += indice + " 0 obj\n" + objetos[indice] + "\nendobj\n";
  }

  const inicioXref = pdf.length;
  pdf += "xref\n0 " + objetos.length + "\n0000000000 65535 f \n";

  for (let indice = 1; indice < objetos.length; indice += 1) {
    pdf += String(deslocamentos[indice]).padStart(10, "0") + " 00000 n \n";
  }

  pdf += "trailer\n<< /Size " + objetos.length + " /Root 1 0 R >>\nstartxref\n" + inicioXref + "\n%%EOF";

  return Uint8Array.from(pdf, (caractere) => caractere.charCodeAt(0) & 0xff);
}

function montarPdfRelatorio(relatorio) {
  const pagina = { largura: 595.28, altura: 841.89, margem: 42, rodape: 42 };
  const larguraUtil = pagina.largura - pagina.margem * 2;
  const colunas = [
    { titulo: "Aluno", largura: 221, alinhamento: "left" },
    { titulo: "Série", largura: 66, alinhamento: "center" },
    { titulo: "Turma", largura: 58, alinhamento: "center" },
    { titulo: "Somatória", largura: 66, alinhamento: "center" },
    { titulo: "Situação", largura: 100, alinhamento: "center" },
  ];
  const paginas = [];
  let conteudo = "";
  let y = pagina.altura - pagina.margem;

  function novaPagina(continuacao = false) {
    if (conteudo) paginas.push(conteudo);
    conteudo = "";
    y = pagina.altura - pagina.margem;

    if (continuacao) {
      conteudo += comandoTextoPdf(textoSeguro(relatorio.escolaNome, "Sistema Escolar"), pagina.margem, y, 11, "F2");
      conteudo += comandoTextoPdf("Listagem de alunos - continuação", pagina.margem, y - 16, 10, "F1");
      y -= 36;
      desenharCabecalhoTabela();
    }
  }

  function garantirEspaco(altura) {
    if (y - altura < pagina.rodape) novaPagina(true);
  }

  function desenharDetalhe(label, valor, x, yDetalhe, largura) {
    conteudo += comandoRetanguloPdf(x, yDetalhe - 30, largura, 30, "0.97");
    conteudo += comandoTextoPdf(label, x + 8, yDetalhe - 11, 7, "F2");
    conteudo += comandoTextoPdf(valor, x + 8, yDetalhe - 23, 9, "F1");
  }

  function desenharCabecalhoTabela() {
    let x = pagina.margem;

    conteudo += comandoRetanguloPdf(pagina.margem, y - 24, larguraUtil, 24, "0.92");
    colunas.forEach((coluna) => {
      conteudo += comandoTextoPdf(coluna.titulo, x + 6, y - 16, 8, "F2");
      x += coluna.largura;
    });
    y -= 24;
  }

  function desenharCelula(texto, x, yLinha, largura, alinhamento, fonte = "F1") {
    const linhas = quebrarTextoPdf(texto, largura - 12, 9).slice(0, 3);
    linhas.forEach((linha, indice) => {
      const deslocamento = alinhamento === "center" ? Math.max(6, largura / 2 - linha.length * 2.2) : 6;
      conteudo += comandoTextoPdf(linha, x + deslocamento, yLinha - 15 - indice * 10, 9, fonte);
    });
  }

  conteudo += comandoTextoPdf(textoSeguro(relatorio.escolaNome, "Sistema Escolar"), pagina.margem, y, 18, "F2");
  conteudo += comandoTextoPdf("Relatório escolar", pagina.margem, y - 18, 9, "F1");
  conteudo += comandoLinhaPdf(pagina.margem, y - 28, pagina.largura - pagina.margem, y - 28);
  y -= 54;

  conteudo += comandoTextoPdf(relatorio.tipo, pagina.margem, y, 15, "F2");
  y -= 18;

  const detalhes = [
    ["Disciplina", relatorio.disciplinaNome],
    ["Bimestre", relatorio.bimestreNome],
    ["Série", relatorio.ano],
    ["Turma", relatorio.turma],
    ["Busca", relatorio.busca || "Todos"],
    ["Ano letivo", relatorio.anoLetivo],
    ["Gerado em", relatorio.dataLocal || formatarData(relatorio.criadoEm)],
    ["Alunos", relatorio.resumo?.totalAlunos || relatorio.registros?.length || 0],
  ];
  const larguraDetalhe = (larguraUtil - 10) / 2;

  for (let indice = 0; indice < detalhes.length; indice += 2) {
    garantirEspaco(40);
    desenharDetalhe(detalhes[indice][0], textoSeguro(detalhes[indice][1], "Todos"), pagina.margem, y, larguraDetalhe);
    if (detalhes[indice + 1]) {
      desenharDetalhe(detalhes[indice + 1][0], textoSeguro(detalhes[indice + 1][1], "Todos"), pagina.margem + larguraDetalhe + 10, y, larguraDetalhe);
    }
    y -= 38;
  }

  y -= 6;
  garantirEspaco(56);

  const resumo = [
    ["Média", valorNumerico(relatorio.resumo?.media)],
    ["Destaques", relatorio.resumo?.destaque || 0],
    ["Reforço", relatorio.resumo?.reforco || 0],
    ["Críticos", relatorio.resumo?.critico || 0],
  ];
  const larguraResumo = (larguraUtil - 24) / 4;

  resumo.forEach(([label, valor], indice) => {
    const x = pagina.margem + indice * (larguraResumo + 8);
    conteudo += comandoRetanguloPdf(x, y - 42, larguraResumo, 42, "0.96");
    conteudo += comandoTextoPdf(label, x + 8, y - 14, 8, "F2");
    conteudo += comandoTextoPdf(valor, x + 8, y - 30, 14, "F2");
  });
  y -= 64;

  garantirEspaco(56);
  conteudo += comandoTextoPdf("Listagem de alunos", pagina.margem, y, 12, "F2");
  y -= 16;
  desenharCabecalhoTabela();

  const registros = relatorio.registros || [];

  if (registros.length === 0) {
    garantirEspaco(34);
    conteudo += comandoRetanguloPdf(pagina.margem, y - 30, larguraUtil, 30);
    conteudo += comandoTextoPdf("Nenhum aluno encontrado para este relatório.", pagina.margem + 8, y - 19, 10, "F1");
    y -= 30;
  }

  registros.forEach((registro, indice) => {
    const linhasNome = quebrarTextoPdf(registro.aluno, colunas[0].largura - 12, 9);
    const alturaLinha = Math.max(30, 16 + linhasNome.length * 10);

    garantirEspaco(alturaLinha + 8);
    conteudo += comandoRetanguloPdf(pagina.margem, y - alturaLinha, larguraUtil, alturaLinha, indice % 2 === 0 ? "0.99" : null);

    let x = pagina.margem;
    desenharCelula(registro.aluno, x, y, colunas[0].largura, "left", "F2");
    x += colunas[0].largura;
    desenharCelula(registro.ano, x, y, colunas[1].largura, "center");
    x += colunas[1].largura;
    desenharCelula(registro.turma, x, y, colunas[2].largura, "center");
    x += colunas[2].largura;
    desenharCelula(valorNumerico(registro.total), x, y, colunas[3].largura, "center", "F2");
    x += colunas[3].largura;
    desenharCelula(registro.situacao, x, y, colunas[4].largura, "center");

    y -= alturaLinha;
  });

  if (conteudo) paginas.push(conteudo);
  return criarDocumentoPdf(paginas);
}

function baixarArquivoPdf(relatorio) {
  const bytes = montarPdfRelatorio(relatorio);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "relatorio-" + criarSlug(relatorio.tipo) + "-" + criarSlug(relatorio.anoLetivo) + ".pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
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
  const nomeEscola = estruturaEscolar.nomeEscola || estruturaEscolar.escola || estruturaEscolar.instituicao || "Sistema Escolar";
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
      escolaNome: nomeEscola,
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
        const notasBimestrais = bimestresEscolares.map((bimestre) => obterNota(aluno, disciplinaId, bimestre.id, limiaresNotas));
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
        escolaNome: nomeEscola,
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
      escolaNome: nomeEscola,
      disciplinaId,
      disciplinaNome: nomeDisciplina(disciplinaId),
      bimestreId,
      bimestreNome: nomeBimestre(bimestreId),
      dataLocal: dataGeracao,
      resumo: montarResumo(registrosFormatados, limiaresNotas),
      registros: registrosFormatados,
    };
  }, [alunos, ano, anoLetivo, bimestreId, busca, dataGeracao, disciplinaId, tipo, turma, bimestresEscolares, limiaresNotas, nomeEscola]);

  const relatorioEmTela = relatorioSelecionado || relatorioAtual;

  useEffect(() => {
    const conteudo = document.querySelector(".conteudo");

    conteudo?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

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

  function prepararRelatorioParaExportacao(relatorio) {
    return {
      ...relatorio,
      escolaNome: relatorio.escolaNome || nomeEscola,
    };
  }

  function gerarPdf(relatorio = relatorioEmTela) {
    const relatorioFinal = prepararRelatorioParaExportacao(relatorio);

    setRelatorioSelecionado(relatorioFinal);
    setAbaAtiva("novo");
    window.setTimeout(() => window.print(), 160);
  }

  function baixarPdf(relatorio = relatorioEmTela) {
    try {
      baixarArquivoPdf(prepararRelatorioParaExportacao(relatorio));
      mostrarFeedback("PDF baixado para o computador.");
    } catch (error) {
      mostrarFeedback("Não foi possível baixar o PDF.", "erro");
    }
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
                    Gerar PDF
                  </button>
                  <button type="button" className="button secondary small" onClick={() => baixarPdf(relatorio)}>
                    Baixar PDF
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

              <button type="button" className="button secondary" data-tour="relatorio-baixar-pdf" onClick={() => baixarPdf(relatorioAtual)}>
                Baixar PDF
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

            <div className="print-school-header">
              <strong>{relatorioEmTela.escolaNome || nomeEscola}</strong>
              <span>Relatório escolar</span>
            </div>

            <div className="print-header">
              <span className="eyebrow">Relatório</span>
              <h2>{relatorioEmTela.tipo}</h2>

              <div className="print-meta-grid">
                <span><strong>Disciplina</strong>{relatorioEmTela.disciplinaNome}</span>
                <span><strong>Bimestre</strong>{relatorioEmTela.bimestreNome}</span>
                <span><strong>Série</strong>{relatorioEmTela.ano}</span>
                <span><strong>Turma</strong>{relatorioEmTela.turma}</span>
                <span><strong>Busca</strong>{relatorioEmTela.busca || "Todos"}</span>
                <span><strong>Ano letivo</strong>{relatorioEmTela.anoLetivo}</span>
                <span><strong>Gerado em</strong>{relatorioEmTela.dataLocal || formatarData(relatorioEmTela.criadoEm)}</span>
                <span><strong>Alunos</strong>{relatorioEmTela.resumo?.totalAlunos || relatorioEmTela.registros.length}</span>
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
                    <th>Série</th>
                    <th>Turma</th>
                    <th>Somatória</th>
                    <th>Situação</th>
                  </tr>
                </thead>

                <tbody>
                  {relatorioEmTela.registros.map((registro) => (
                    <tr key={registro.alunoId}>
                      <td><strong>{registro.aluno}</strong></td>
                      <td>{registro.ano}</td>
                      <td>{registro.turma}</td>
                      <td>{valorNumerico(registro.total)}</td>
                      <td>
                        <span className="report-status">
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







