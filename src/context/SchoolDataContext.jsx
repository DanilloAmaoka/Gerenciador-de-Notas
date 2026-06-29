import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";

import { db } from "../firebase/config";
import {
  ANOS,
  BIMESTRES,
  DISCIPLINAS,
  LIMIARES_PADRAO,
  TURMAS,
  normalizarLimiares,
} from "../data/notasData";
import { useFeedback } from "./FeedbackContext";

const SchoolDataContext = createContext(null);
const alunosCollection = collection(db, "alunos");
const anosLetivosCollection = collection(db, "anosLetivos");

const estruturaPadrao = {
  anosEscolares: ANOS,
  turmas: TURMAS,
  disciplinas: DISCIPLINAS,
  bimestres: BIMESTRES,
};

function normalizarAluno(documento) {
  return {
    id: documento.id,
    ...documento.data(),
  };
}

function criarNotasVazias(disciplinas = DISCIPLINAS) {
  return Object.fromEntries(disciplinas.map((disciplina) => [disciplina.id, {}]));
}

function limparAlunoParaProximoAno(aluno, disciplinas) {
  return {
    nome: aluno.nome.trim(),
    ano: aluno.ano,
    turma: aluno.turma,
    notas: criarNotasVazias(disciplinas),
    atualizadoEm: serverTimestamp(),
  };
}

function prepararAlunoParaArquivo(aluno) {
  return {
    id: String(aluno.id || aluno.nome),
    nome: aluno.nome,
    ano: aluno.ano,
    turma: aluno.turma,
    notas: aluno.notas || {},
  };
}

function montarNotaParaBanco(registro) {
  return {
    etapa1: Number(registro.etapa1) || 0,
    etapa1Reavaliacao: Number(registro.etapa1Reavaliacao) || 0,
    etapa1Final: Number(registro.etapa1Final) || 0,
    etapa2: Number(registro.etapa2) || 0,
    etapa2Reavaliacao: Number(registro.etapa2Reavaliacao) || 0,
    etapa2Final: Number(registro.etapa2Final) || 0,
    total: Number(registro.total) || 0,
    media: Number(registro.media ?? registro.total) || 0,
    precisaReavaliacao: Boolean(registro.precisaReavaliacao),
  };
}

async function executarEmLotes(operacoes) {
  for (let inicio = 0; inicio < operacoes.length; inicio += 450) {
    const batch = writeBatch(db);
    operacoes.slice(inicio, inicio + 450).forEach((executar) => executar(batch));
    await batch.commit();
  }
}

export function SchoolDataProvider({ children }) {
  const [alunos, setAlunos] = useState([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState(true);
  const [anoLetivoAtual, setAnoLetivoAtual] = useState(new Date().getFullYear());
  const [estruturaEscolar, setEstruturaEscolar] = useState(estruturaPadrao);
  const [limiaresNotas, setLimiaresNotas] = useState(normalizarLimiares(LIMIARES_PADRAO));
  const [anosArquivados, setAnosArquivados] = useState([]);
  const { mostrarFeedback } = useFeedback();

  const carregarAlunos = useCallback(async () => {
    setCarregandoAlunos(true);

    try {
      const consulta = query(alunosCollection, orderBy("nome"));
      const resultado = await getDocs(consulta);
      setAlunos(resultado.docs.map(normalizarAluno));
    } catch (error) {
      mostrarFeedback("Não foi possível carregar os alunos do banco.", "erro");
    } finally {
      setCarregandoAlunos(false);
    }
  }, [mostrarFeedback]);

  const carregarAnosArquivados = useCallback(async () => {
    try {
      const consulta = query(anosLetivosCollection, orderBy("ano", "desc"));
      const resultado = await getDocs(consulta);
      setAnosArquivados(
        resultado.docs.map((documento) => ({
          id: documento.id,
          ...documento.data(),
        })),
      );
    } catch (error) {
      mostrarFeedback("Não foi possível carregar os anos antigos.", "erro");
    }
  }, [mostrarFeedback]);

  const carregarConfiguracoes = useCallback(async () => {
    try {
      const anoDoc = await getDoc(doc(db, "configuracoes", "anoLetivoAtual"));
      const estruturaDoc = await getDoc(doc(db, "configuracoes", "estruturaEscolar"));
      const regrasDoc = await getDoc(doc(db, "configuracoes", "regrasNotas"));

      if (anoDoc.exists()) {
        setAnoLetivoAtual(Number(anoDoc.data().anoLetivo) || new Date().getFullYear());
      }

      if (estruturaDoc.exists()) {
        setEstruturaEscolar({
          ...estruturaPadrao,
          ...estruturaDoc.data(),
        });
      }

      if (regrasDoc.exists()) {
        setLimiaresNotas(normalizarLimiares(regrasDoc.data().limiares));
      }
    } catch (error) {
      mostrarFeedback("Não foi possível carregar as configurações do ano letivo.", "erro");
    }
  }, [mostrarFeedback]);

  useEffect(() => {
    carregarConfiguracoes();
    carregarAlunos();
    carregarAnosArquivados();
  }, [carregarAlunos, carregarAnosArquivados, carregarConfiguracoes]);

  async function adicionarAluno(dadosAluno) {
    const novoAluno = {
      nome: dadosAluno.nome.trim(),
      ano: dadosAluno.ano,
      turma: dadosAluno.turma,
      notas: criarNotasVazias(estruturaEscolar.disciplinas),
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    };

    const referencia = await addDoc(alunosCollection, novoAluno);
    const alunoCriado = { ...novoAluno, id: referencia.id };

    setAlunos((listaAtual) =>
      [...listaAtual, alunoCriado].sort((a, b) => a.nome.localeCompare(b.nome)),
    );

    return alunoCriado;
  }

  async function deletarAluno(alunoId) {
    await deleteDoc(doc(db, "alunos", String(alunoId)));
    setAlunos((listaAtual) => listaAtual.filter((aluno) => String(aluno.id) !== String(alunoId)));
  }

  async function salvarNotas(registros, disciplinaId, bimestreId) {
    const batch = writeBatch(db);

    registros.forEach((registro) => {
      const alunoId = String(registro.aluno.id);
      const referencia = doc(db, "alunos", alunoId);
      const notaBanco = montarNotaParaBanco(registro);

      // As notas ficam separadas por disciplina e bimestre dentro do documento do aluno.
      batch.set(
        referencia,
        {
          notas: {
            [disciplinaId]: {
              [bimestreId]: notaBanco,
            },
          },
          atualizadoEm: serverTimestamp(),
        },
        { merge: true },
      );
    });

    await batch.commit();

    setAlunos((listaAtual) =>
      listaAtual.map((aluno) => {
        const registro = registros.find((item) => String(item.aluno.id) === String(aluno.id));
        if (!registro) return aluno;

        return {
          ...aluno,
          notas: {
            ...aluno.notas,
            [disciplinaId]: {
              ...aluno.notas?.[disciplinaId],
              [bimestreId]: montarNotaParaBanco(registro),
            },
          },
        };
      }),
    );
  }

  async function salvarConfiguracoesDoSite({ anoLetivo, estrutura, limiares }) {
    const estruturaFinal = {
      ...estruturaPadrao,
      ...estrutura,
    };
    const limiaresFinais = normalizarLimiares(limiares || limiaresNotas);

    await setDoc(
      doc(db, "configuracoes", "anoLetivoAtual"),
      {
        anoLetivo: Number(anoLetivo),
        atualizadoEm: serverTimestamp(),
      },
      { merge: true },
    );

    await setDoc(
      doc(db, "configuracoes", "estruturaEscolar"),
      {
        ...estruturaFinal,
        atualizadoEm: serverTimestamp(),
      },
      { merge: true },
    );

    await setDoc(
      doc(db, "configuracoes", "regrasNotas"),
      {
        limiares: limiaresFinais,
        atualizadoEm: serverTimestamp(),
      },
      { merge: true },
    );

    setAnoLetivoAtual(Number(anoLetivo));
    setEstruturaEscolar(estruturaFinal);
    setLimiaresNotas(limiaresFinais);
  }

  async function finalizarAnoLetivo({ proximoAno, manterAlunos, alunosProximoAno, estruturaProximoAno }) {
    const estruturaFinal = {
      ...estruturaPadrao,
      ...estruturaProximoAno,
    };

    await setDoc(doc(db, "anosLetivos", String(anoLetivoAtual)), {
      ano: Number(anoLetivoAtual),
      finalizadoEm: serverTimestamp(),
      estruturaEscolar,
      limiaresNotas,
      resumo: {
        totalAlunos: alunos.length,
        anosEscolares: estruturaEscolar.anosEscolares || [],
        turmas: estruturaEscolar.turmas || [],
        disciplinas: estruturaEscolar.disciplinas || [],
        bimestres: estruturaEscolar.bimestres || [],
      },
      alunos: alunos.map(prepararAlunoParaArquivo),
    });

    const alunosAtuais = await getDocs(alunosCollection);
    const deletarAtuais = alunosAtuais.docs.map((documento) => (batch) => {
      batch.delete(doc(db, "alunos", documento.id));
    });
    await executarEmLotes(deletarAtuais);

    const alunosParaCriar = manterAlunos ? alunosProximoAno : [];
    const alunosCriados = [];
    const criarNovos = alunosParaCriar.map((aluno) => (batch) => {
      const referencia = aluno.id ? doc(db, "alunos", String(aluno.id)) : doc(alunosCollection);
      const novoAluno = {
        ...limparAlunoParaProximoAno(aluno, estruturaFinal.disciplinas),
        criadoEm: serverTimestamp(),
      };

      batch.set(referencia, novoAluno);
      alunosCriados.push({ ...novoAluno, id: referencia.id });
    });
    await executarEmLotes(criarNovos);

    await salvarConfiguracoesDoSite({
      anoLetivo: Number(proximoAno),
      estrutura: estruturaFinal,
      limiares: limiaresNotas,
    });

    const historico = await getDocs(query(anosLetivosCollection, orderBy("ano", "desc")));
    const antigosParaRemover = historico.docs.slice(2);
    const removerAntigos = antigosParaRemover.map((documento) => (batch) => {
      batch.delete(doc(db, "anosLetivos", documento.id));
    });
    await executarEmLotes(removerAntigos);

    setAlunos(alunosCriados.sort((a, b) => a.nome.localeCompare(b.nome)));
    await carregarAnosArquivados();

    return {
      anoArquivado: Number(anoLetivoAtual),
      proximoAno: Number(proximoAno),
      alunosMantidos: alunosCriados.length,
      anosRemovidos: antigosParaRemover.length,
    };
  }

  const valor = useMemo(
    () => ({
      alunos,
      carregandoAlunos,
      anoLetivoAtual,
      estruturaEscolar,
      limiaresNotas,
      anosArquivados,
      carregarAlunos,
      carregarConfiguracoes,
      carregarAnosArquivados,
      adicionarAluno,
      deletarAluno,
      salvarNotas,
      salvarConfiguracoesDoSite,
      finalizarAnoLetivo,
    }),
    [
      alunos,
      carregandoAlunos,
      anoLetivoAtual,
      estruturaEscolar,
      limiaresNotas,
      anosArquivados,
      carregarAlunos,
      carregarConfiguracoes,
      carregarAnosArquivados,
    ],
  );

  return <SchoolDataContext.Provider value={valor}>{children}</SchoolDataContext.Provider>;
}

export function useSchoolData() {
  const contexto = useContext(SchoolDataContext);

  if (!contexto) {
    throw new Error("useSchoolData precisa estar dentro de SchoolDataProvider.");
  }

  return contexto;
}
