export const ANOS = ["3º ano", "4º ano", "5º ano"];
export const TURMAS = ["A", "B", "C", "D"];

export const DISCIPLINAS = [
  { id: "portugues", nome: "Português" },
  { id: "matematica", nome: "Matemática" },
];

export const BIMESTRES = [
  { id: "b1", nome: "1º bimestre" },
  { id: "b2", nome: "2º bimestre" },
  { id: "b3", nome: "3º bimestre" },
  { id: "b4", nome: "4º bimestre" },
];

export const LIMIARES_PADRAO = {
  destaque: 80,
  meta: 70,
  critico: 60,
};

export const LIMIAR_REAVALIACAO = 30;

// Estes dados servem apenas para popular o Firestore na primeira execução.
// Depois disso, o site passa a usar os alunos salvos no banco de dados.
export const alunosNotas = [
  aluno(1, "Ana Clara Martins", "3º ano", "A", [42, 44, 43, 45, 41, 46, 44, 45], [38, 41, 40, 43, 41, 42, 43, 44]),
  aluno(2, "Bruno Henrique Souza", "3º ano", "A", [31, 34, 29, 30, 32, 35, 34, 36], [27, 29, 28, 31, 30, 32, 31, 33]),
  aluno(3, "Camila Santos Oliveira", "3º ano", "B", [36, 38, 38, 41, 39, 42, 40, 43], [34, 36, 35, 39, 37, 40, 38, 41]),
  aluno(4, "Diego Lima Ferreira", "4º ano", "A", [26, 29, 29, 32, 30, 35, 33, 36], [24, 28, 25, 30, 28, 31, 30, 34]),
  aluno(5, "Elisa Rocha Almeida", "4º ano", "A", [45, 47, 44, 46, 46, 47, 47, 48], [43, 45, 45, 46, 44, 47, 46, 47]),
  aluno(6, "Felipe Moura Costa", "4º ano", "B", [34, 34, 35, 37, 36, 38, 37, 39], [33, 32, 34, 35, 36, 36, 37, 38]),
  aluno(7, "Gabriela Alves Pinto", "4º ano", "B", [40, 42, 41, 44, 42, 44, 43, 45], [39, 40, 40, 42, 41, 43, 42, 43]),
  aluno(8, "Hugo Pereira Nunes", "5º ano", "A", [28, 31, 27, 30, 29, 32, 31, 34], [26, 27, 27, 28, 29, 30, 30, 31]),
  aluno(9, "Isabela Costa Ribeiro", "5º ano", "A", [37, 39, 41, 43, 42, 44, 43, 46], [35, 38, 38, 41, 39, 42, 41, 43]),
  aluno(10, "João Pedro Azevedo", "5º ano", "B", [31, 31, 33, 36, 34, 37, 35, 38], [30, 29, 31, 32, 32, 34, 34, 35]),
  aluno(11, "Larissa Nunes Barros", "5º ano", "B", [44, 45, 45, 46, 46, 47, 47, 48], [42, 44, 44, 45, 45, 46, 46, 47]),
  aluno(12, "Miguel Ramos Teixeira", "3º ano", "B", [36, 35, 32, 35, 34, 36, 36, 38], [35, 36, 34, 35, 35, 37, 37, 38]),
];

function aluno(id, nome, ano, turma, portugues, matematica) {
  return {
    id: String(id),
    nome,
    ano,
    turma,
    notas: {
      portugues: criarBimestres(portugues),
      matematica: criarBimestres(matematica),
    },
  };
}

function criarBimestres(valores) {
  return {
    b1: criarNotaBimestre(valores[0], valores[1]),
    b2: criarNotaBimestre(valores[2], valores[3]),
    b3: criarNotaBimestre(valores[4], valores[5]),
    b4: criarNotaBimestre(valores[6], valores[7]),
  };
}

function criarNotaBimestre(etapa1, etapa2) {
  return {
    etapa1,
    etapa1Reavaliacao: 0,
    etapa2,
    etapa2Reavaliacao: 0,
  };
}

function numeroSeguro(valor, padrao) {
  if (valor === "" || valor === null || valor === undefined) return padrao;

  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : padrao;
}

function limitarNumero(valor, minimo, maximo) {
  return Math.min(maximo, Math.max(minimo, valor));
}

function arredondarMedia(valor) {
  return Math.round(valor * 10) / 10;
}

export function limitarNotaEtapa(valor) {
  return limitarNumero(numeroSeguro(valor, 0), 0, 50);
}

export function normalizarLimiares(limiares = {}) {
  return {
    destaque: limitarNumero(numeroSeguro(limiares.destaque, LIMIARES_PADRAO.destaque), 0, 100),
    meta: limitarNumero(numeroSeguro(limiares.meta, LIMIARES_PADRAO.meta), 0, 100),
    critico: limitarNumero(numeroSeguro(limiares.critico, LIMIARES_PADRAO.critico), 0, 100),
  };
}

export function obterDisciplinaNome(disciplinaId) {
  return DISCIPLINAS.find((disciplina) => disciplina.id === disciplinaId)?.nome || "Disciplina";
}

export function obterBimestreNome(bimestreId) {
  return BIMESTRES.find((bimestre) => bimestre.id === bimestreId)?.nome || "Bimestre";
}

export function obterBimestreAnterior(bimestreId) {
  const indiceAtual = BIMESTRES.findIndex((bimestre) => bimestre.id === bimestreId);
  return indiceAtual > 0 ? BIMESTRES[indiceAtual - 1] : null;
}

export function obterNota(alunoSelecionado, disciplinaId, bimestreId) {
  const nota = alunoSelecionado.notas?.[disciplinaId]?.[bimestreId] || {};
  const etapa1 = limitarNotaEtapa(nota.etapa1);
  const etapa1Reavaliacao = limitarNotaEtapa(nota.etapa1Reavaliacao);
  const etapa2 = limitarNotaEtapa(nota.etapa2);
  const etapa2Reavaliacao = limitarNotaEtapa(nota.etapa2Reavaliacao);
  const etapa1Final = Math.max(etapa1, etapa1Reavaliacao);
  const etapa2Final = Math.max(etapa2, etapa2Reavaliacao);
  const total = etapa1Final + etapa2Final;
  const media = arredondarMedia(total / 2);
  const precisaReavaliacaoEtapa1 = etapa1 > 0 && etapa1 < LIMIAR_REAVALIACAO;
  const precisaReavaliacaoEtapa2 = etapa2 > 0 && etapa2 < LIMIAR_REAVALIACAO;

  return {
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
  };
}

export function classificarNota(total, limiares = LIMIARES_PADRAO) {
  const regras = normalizarLimiares(limiares);

  if (total >= regras.destaque) {
    return { chave: "destaque", label: "Destaque", classe: "status-destaque" };
  }

  if (total >= regras.meta) {
    return { chave: "meta", label: "Na meta", classe: "status-meta" };
  }

  if (total < regras.critico) {
    return { chave: "critico", label: "Crítico", classe: "status-critico" };
  }

  return { chave: "reforco", label: "Reforço", classe: "status-reforco" };
}

export function filtrarAlunos({ alunos = alunosNotas, ano = "Todos", turma = "Todas", busca = "" } = {}) {
  const termo = busca.trim().toLowerCase();

  return alunos.filter((alunoSelecionado) => {
    const anoValido = ano === "Todos" || alunoSelecionado.ano === ano;
    const turmaValida = turma === "Todas" || alunoSelecionado.turma === turma;
    const buscaValida = !termo || alunoSelecionado.nome.toLowerCase().includes(termo);

    return anoValido && turmaValida && buscaValida;
  });
}

export function montarRegistros({
  alunos = alunosNotas,
  disciplinaId = "portugues",
  bimestreId = "b2",
  ano = "Todos",
  turma = "Todas",
  busca = "",
  reavaliacao = "Todos",
  limiares = LIMIARES_PADRAO,
} = {}) {
  const registros = filtrarAlunos({ alunos, ano, turma, busca }).map((alunoSelecionado) => {
    const nota = obterNota(alunoSelecionado, disciplinaId, bimestreId);

    return {
      id: String(alunoSelecionado.id) + "-" + disciplinaId + "-" + bimestreId,
      aluno: alunoSelecionado,
      ...nota,
      status: classificarNota(nota.total, limiares),
    };
  });

  if (reavaliacao === "Apenas reavaliação") {
    return registros.filter((registro) => registro.precisaReavaliacao);
  }

  if (reavaliacao === "Sem reavaliação") {
    return registros.filter((registro) => !registro.precisaReavaliacao);
  }

  return registros;
}

export function calcularResumo(filtros = {}) {
  const limiares = normalizarLimiares(filtros.limiares);
  const registros = montarRegistros({ ...filtros, limiares });
  const totalAlunos = registros.length;
  const somaMedias = registros.reduce((soma, registro) => soma + Number(registro.media || 0), 0);

  return {
    totalAlunos,
    media: totalAlunos ? arredondarMedia(somaMedias / totalAlunos) : 0,
    destaque: registros.filter((registro) => registro.total >= limiares.destaque).length,
    meta: registros.filter(
      (registro) => registro.total >= limiares.meta && registro.total < limiares.destaque,
    ).length,
    reforco: registros.filter(
      (registro) => registro.total >= limiares.critico && registro.total < limiares.meta,
    ).length,
    critico: registros.filter((registro) => registro.total < limiares.critico).length,
    reavaliacao: registros.filter((registro) => registro.precisaReavaliacao).length,
    registros,
  };
}

export function compararBimestres(alunoSelecionado, disciplinaId, bimestreInicialId, bimestreFinalId) {
  const notaInicial = obterNota(alunoSelecionado, disciplinaId, bimestreInicialId);
  const notaFinal = obterNota(alunoSelecionado, disciplinaId, bimestreFinalId);
  const delta = arredondarMedia(notaFinal.media - notaInicial.media);

  return {
    inicial: notaInicial.media,
    final: notaFinal.media,
    delta,
    tendencia: obterTendencia(delta),
  };
}

export function obterTendencia(delta) {
  if (delta > 0) return { label: "Melhorou", classe: "trend-positive" };
  if (delta < 0) return { label: "Caiu", classe: "trend-negative" };
  return { label: "Estável", classe: "trend-neutral" };
}

export function gerarAlertas(filtros = {}) {
  const limiares = normalizarLimiares(filtros.limiares);
  const registros = montarRegistros({ ...filtros, limiares });
  const bimestreAnterior = obterBimestreAnterior(filtros.bimestreId);

  return registros
    .filter((registro) => registro.total < limiares.meta)
    .map((registro) => {
      const notaAnterior = bimestreAnterior
        ? obterNota(registro.aluno, filtros.disciplinaId || "portugues", bimestreAnterior.id).total
        : null;
      const persistente = notaAnterior !== null && notaAnterior < limiares.meta;

      return {
        id: registro.id,
        aluno: registro.aluno,
        total: registro.total,
        status: registro.status,
        prioridade: registro.total < limiares.critico ? "Alta" : "Média",
        persistente,
        motivo: persistente
          ? "Nota baixa em bimestres seguidos"
          : registro.total < limiares.critico
            ? "Abaixo do limite crítico"
            : "Abaixo da meta de " + limiares.meta,
      };
    })
    .sort((a, b) => a.total - b.total);
}
