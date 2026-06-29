import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

import { useSchoolData } from "../context/SchoolDataContext";

function formatarData(valor) {
  if (!valor) return "Sem data";
  if (typeof valor.toDate === "function") return valor.toDate().toLocaleString("pt-BR");
  return String(valor);
}

export default function AnosAntigos() {
  const { anosArquivados, carregarAnosArquivados } = useSchoolData();
  const [anoSelecionadoId, setAnoSelecionadoId] = useState(null);

  const anoSelecionado = useMemo(() => {
    if (!anosArquivados.length) return null;
    return anosArquivados.find((ano) => ano.id === anoSelecionadoId) || anosArquivados[0];
  }, [anoSelecionadoId, anosArquivados]);

  return (
    <div className="page old-years-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Histórico</span>
          <h1>Anos antigos</h1>
          <p>Consulte os anos letivos arquivados. O sistema mantém até dois anos completos.</p>
        </div>

        <div className="button-row compact-actions">
          <button type="button" className="button secondary" onClick={carregarAnosArquivados}>
            Atualizar
          </button>
          <NavLink className="button secondary" to="/configuracoes">
            Voltar
          </NavLink>
        </div>
      </header>

      <section className="content-grid two-columns narrow-left">
        <div className="panel" data-tour="anos-antigos-lista">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Arquivos</span>
              <h2>{anosArquivados.length} anos guardados</h2>
            </div>
          </div>

          <div className="old-year-list">
            {anosArquivados.length === 0 && (
              <p className="muted-text">Nenhum ano antigo foi arquivado ainda.</p>
            )}

            {anosArquivados.map((ano) => (
              <button
                key={ano.id}
                type="button"
                className={anoSelecionado?.id === ano.id ? "old-year-card active" : "old-year-card"}
                onClick={() => setAnoSelecionadoId(ano.id)}
              >
                <strong>{ano.ano}</strong>
                <span>{ano.resumo?.totalAlunos || 0} alunos</span>
                <small>{formatarData(ano.finalizadoEm)}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          {anoSelecionado ? (
            <>
              <div className="panel-header">
                <div>
                  <span className="eyebrow">Ano arquivado</span>
                  <h2>{anoSelecionado.ano}</h2>
                  <p>Finalizado em {formatarData(anoSelecionado.finalizadoEm)}.</p>
                </div>
              </div>

              <div className="report-summary">
                <div>
                  <span>Alunos</span>
                  <strong>{anoSelecionado.resumo?.totalAlunos || 0}</strong>
                </div>
                <div>
                  <span>Anos</span>
                  <strong>{anoSelecionado.resumo?.anosEscolares?.length || 0}</strong>
                </div>
                <div>
                  <span>Turmas</span>
                  <strong>{anoSelecionado.resumo?.turmas?.length || 0}</strong>
                </div>
                <div>
                  <span>Disciplinas</span>
                  <strong>{anoSelecionado.resumo?.disciplinas?.length || 0}</strong>
                </div>
              </div>

              <div className="table-wrap student-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Aluno</th>
                      <th>Ano</th>
                      <th>Turma</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(anoSelecionado.alunos || []).map((aluno) => (
                      <tr key={aluno.id || aluno.nome}>
                        <td>{aluno.nome}</td>
                        <td>{aluno.ano}</td>
                        <td>{aluno.turma}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="muted-text">Finalize um ano para consultar o histórico aqui.</p>
          )}
        </div>
      </section>
    </div>
  );
}
