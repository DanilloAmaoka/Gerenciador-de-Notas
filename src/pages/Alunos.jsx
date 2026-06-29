import { useMemo, useState } from "react";

import { ANOS, TURMAS } from "../data/notasData";
import { useFeedback } from "../context/FeedbackContext";
import { useSchoolData } from "../context/SchoolDataContext";

export default function Alunos() {
  const { alunos, carregandoAlunos, adicionarAluno, deletarAluno, estruturaEscolar } = useSchoolData();
  const { mostrarFeedback, pedirConfirmacao } = useFeedback();
  const [busca, setBusca] = useState("");
  const [ano, setAno] = useState("Todos");
  const [turma, setTurma] = useState("Todas");
  const [salvando, setSalvando] = useState(false);
  const [novoAluno, setNovoAluno] = useState({ nome: "", ano: "3º ano", turma: "A" });
  const anosEscolares = estruturaEscolar.anosEscolares || ANOS;
  const turmasEscolares = estruturaEscolar.turmas || TURMAS;

  const alunosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return alunos.filter((aluno) => {
      const buscaValida = !termo || aluno.nome.toLowerCase().includes(termo);
      const anoValido = ano === "Todos" || aluno.ano === ano;
      const turmaValida = turma === "Todas" || aluno.turma === turma;

      return buscaValida && anoValido && turmaValida;
    });
  }, [alunos, ano, busca, turma]);

  const cadastrarAluno = async (event) => {
    event.preventDefault();

    if (!novoAluno.nome.trim()) {
      mostrarFeedback("Informe o nome do aluno antes de cadastrar.", "erro");
      return;
    }

    try {
      setSalvando(true);
      await adicionarAluno(novoAluno);
      setNovoAluno({ nome: "", ano: "3º ano", turma: "A" });
      mostrarFeedback("Aluno cadastrado no banco de dados.");
    } catch (error) {
      mostrarFeedback("Não foi possível cadastrar o aluno.", "erro");
    } finally {
      setSalvando(false);
    }
  };

  const confirmarExclusao = async (aluno) => {
    const confirmado = await pedirConfirmacao({
      titulo: "Deletar aluno",
      mensagem: "Deseja deletar " + aluno.nome + "? As notas dele também deixarão de aparecer no sistema.",
      textoConfirmar: "Deletar",
      perigo: true,
    });

    if (!confirmado) return;

    try {
      await deletarAluno(aluno.id);
      mostrarFeedback("Aluno deletado do banco de dados.");
    } catch (error) {
      mostrarFeedback("Não foi possível deletar o aluno.", "erro");
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Cadastro</span>
          <h1>Alunos</h1>
          <p>Lista dos estudantes acompanhados no gerenciador de notas.</p>
        </div>
      </header>

      <section className="content-grid two-columns narrow-left">
        <form className="panel form-stack" onSubmit={cadastrarAluno}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">Novo registro</span>
              <h2>Cadastrar aluno</h2>
            </div>
          </div>

          <label className="field-group">
            <span>Nome completo</span>
            <input
              type="text"
              value={novoAluno.nome}
              onChange={(event) => setNovoAluno({ ...novoAluno, nome: event.target.value })}
              placeholder="Nome do aluno"
              data-tour="aluno-nome"
              disabled={salvando}
            />
          </label>

          <div className="form-grid">
            <label className="field-group">
              <span>Ano</span>
              <select
                value={novoAluno.ano}
                data-tour="aluno-ano"
                onChange={(event) => setNovoAluno({ ...novoAluno, ano: event.target.value })}
                disabled={salvando}
              >
                {anosEscolares.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-group">
              <span>Turma</span>
              <select
                value={novoAluno.turma}
                data-tour="aluno-turma"
                onChange={(event) => setNovoAluno({ ...novoAluno, turma: event.target.value })}
                disabled={salvando}
              >
                {turmasEscolares.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="submit"
            className="button primary full-width"
            data-tour="aluno-cadastrar"
            disabled={salvando}
          >
            {salvando ? "Salvando..." : "Cadastrar"}
          </button>
        </form>

        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Consulta</span>
              <h2>{alunosFiltrados.length} alunos encontrados</h2>
            </div>
          </div>

          <div className="filter-row">
            <label>
              <span>Buscar</span>
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
          </div>

          {carregandoAlunos ? (
            <p className="muted-text">Carregando alunos do banco...</p>
          ) : (
            <div className="table-wrap student-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>Ano</th>
                    <th>Turma</th>
                    <th>Ação</th>
                  </tr>
                </thead>

                <tbody>
                  {alunosFiltrados.map((aluno) => (
                    <tr key={aluno.id}>
                      <td>{aluno.nome}</td>
                      <td>{aluno.ano}</td>
                      <td>{aluno.turma}</td>
                      <td>
                        <button
                          type="button"
                          className="button danger small"
                          onClick={() => confirmarExclusao(aluno)}
                        >
                          Deletar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
