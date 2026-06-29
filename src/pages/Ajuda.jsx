import { useMemo, useRef, useState } from "react";

import { perguntasAjuda, tutoriaisPraticos } from "../data/helpContent";
import { useTutorial } from "../context/TutorialContext";

export default function Ajuda() {
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todas");
  const { iniciarTutorial } = useTutorial();
  const tutoriaisRef = useRef(null);

  const tutorialAjuda = tutoriaisPraticos.find((tutorial) => tutorial.id === "usar-ajuda");
  const demaisTutoriais = tutoriaisPraticos.filter((tutorial) => tutorial.id !== "usar-ajuda");

  const categorias = useMemo(
    () => ["Todas", ...new Set(perguntasAjuda.map((item) => item.categoria))],
    [],
  );

  const irParaTutoriais = () => {
    tutoriaisRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const perguntasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return perguntasAjuda.filter((item) => {
      const categoriaValida = categoriaAtiva === "Todas" || item.categoria === categoriaAtiva;
      const texto = (item.categoria + " " + item.pergunta + " " + item.resposta).toLowerCase();
      const buscaValida = !termo || texto.includes(termo);

      return categoriaValida && buscaValida;
    });
  }, [busca, categoriaAtiva]);

  return (
    <div className="page help-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Suporte</span>
          <h1>Ajuda</h1>
          <p>
            Pesquise dúvidas, leia respostas rápidas ou inicie um tutorial prático guiado pela
            interface do sistema.
          </p>
        </div>
      </header>

      <section className="help-hero">
        <div>
          <span className="pill light">Central de ajuda</span>
          <h2>Ajuda para tudo, inclusive o básico</h2>
          <p>
            Esta área foi pensada para quem está usando o sistema pela primeira vez. Se a dúvida
            parecer óbvia, ela também deve aparecer aqui.
          </p>
        </div>

        <button type="button" className="button secondary help-jump-button" onClick={irParaTutoriais}>
          Ir para tutoriais práticos
        </button>
      </section>

      {tutorialAjuda && (
        <section className="featured-tutorial-panel" data-tour="ajuda-tutorial-destaque">
          <div>
            <span className="eyebrow">Tutorial em destaque</span>
            <h2>{tutorialAjuda.titulo}</h2>
            <p>{tutorialAjuda.descricao}</p>
          </div>

          <button
            type="button"
            className="button primary"
            onClick={() => iniciarTutorial(tutorialAjuda.id)}
          >
            Iniciar tutorial
          </button>
        </section>
      )}

      <section className="panel help-search-panel" data-tour="ajuda-busca">
        <label className="field-group">
          <span>Pesquisar pergunta</span>
          <input
            type="search"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Ex.: cadastrar aluno, salvar notas, PDF, risco..."
          />
        </label>

        <div className="help-category-row">
          {categorias.map((categoria) => (
            <button
              key={categoria}
              type="button"
              className={categoriaAtiva === categoria ? "active" : ""}
              onClick={() => setCategoriaAtiva(categoria)}
            >
              {categoria}
            </button>
          ))}
        </div>
      </section>

      <section className="panel" data-tour="ajuda-faq">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Perguntas frequentes</span>
            <h2>{perguntasFiltradas.length} respostas encontradas</h2>
          </div>
        </div>

        <div className="faq-list">
          {perguntasFiltradas.map((item) => (
            <details className="faq-item" key={item.categoria + "-" + item.pergunta}>
              <summary>
                <span>{item.categoria}</span>
                <strong>{item.pergunta}</strong>
              </summary>
              <p>{item.resposta}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="panel" data-tour="ajuda-tutoriais" ref={tutoriaisRef}>
        <div className="panel-header">
          <div>
            <span className="eyebrow">Passo a passo</span>
            <h2>Tutoriais práticos</h2>
            <p>Ao iniciar, o site navega até a página correta e destaca cada parte da tela.</p>
          </div>
        </div>

        <div className="tutorial-card-grid">
          {demaisTutoriais.map((tutorial) => (
            <article className="tutorial-card" key={tutorial.id}>
              <div>
                <h3>{tutorial.titulo}</h3>
                <p>{tutorial.descricao}</p>
                <span>{tutorial.passos.length} etapas</span>
              </div>

              <button
                type="button"
                className="button primary"
                onClick={() => iniciarTutorial(tutorial.id)}
              >
                Iniciar tutorial
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
