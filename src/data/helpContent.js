export const perguntasAjuda = [
  {
    categoria: "Início",
    pergunta: "Por que todos aparecem críticos no começo do ano?",
    resposta: "Ao iniciar um novo ano letivo, as notas começam zeradas. Enquanto as primeiras notas não forem lançadas, o sistema pode classificar todos como críticos.",
  },
  {
    categoria: "Notas",
    pergunta: "O que acontece se eu sair de Notas sem salvar?",
    resposta: "Se você alterar notas e tentar sair por um link do site, o sistema pede confirmação. Se fechar ou atualizar o navegador, o navegador também mostra um aviso de alterações não salvas.",
  },
  {
    categoria: "Relatórios",
    pergunta: "Como vejo relatórios salvos sem rolar a página inteira?",
    resposta: "Na página Relatórios, use a aba Relatórios salvos no topo. Ela abre a lista salva diretamente, sem precisar descer até o final da tela.",
  },
  {
    categoria: "Relatórios",
    pergunta: "Como deleto um relatório salvo?",
    resposta: "Entre em Relatórios, abra a aba Relatórios salvos e clique em Deletar no relatório desejado. O site pede confirmação antes de apagar.",
  },
  {
    categoria: "Configurações",
    pergunta: "Como finalizar o ano atual?",
    resposta: "Em Configurações, clique em Finalizar ano atual, revise alunos, anos, turmas, disciplinas e bimestres do próximo ano e confirme o fechamento.",
  },
  {
    categoria: "Configurações",
    pergunta: "O que acontece ao finalizar o ano?",
    resposta: "O ano atual é arquivado, as notas são limpas para o próximo ano e o sistema mantém até dois anos completos guardados. Os relatórios anuais salvos continuam disponíveis sem limite definido pelo site.",
  },
  {
    categoria: "Configurações",
    pergunta: "Como consulto anos antigos?",
    resposta: "Em Configurações, clique em Consultar anos antigos. A página mostra os anos arquivados e a lista de alunos guardada em cada um.",
  },
  {
    categoria: "Destaques",
    pergunta: "Como homenageio os alunos do pódio?",
    resposta: "Na página Destaques, filtre o pódio desejado e clique em Homenagear pódio. O site abre certificados bonitos para imprimir ou salvar como PDF.",
  },
  {
    categoria: "Início",
    pergunta: "Onde vejo o ano letivo atual?",
    resposta: "O ano letivo atual aparece no topo das páginas, ao lado do botão de ajuda, para lembrar em qual ano o sistema está trabalhando.",
  },
  {
    categoria: "Início",
    pergunta: "Como funciona o Início?",
    resposta: "O Início resume a situação do bimestre com média geral, alunos destaque, reforço, críticos, alertas e atalhos para as funções principais.",
  },
  {
    categoria: "Evolução",
    pergunta: "Como funciona a Evolução?",
    resposta: "A Evolução compara notas entre bimestres e também mostra a diferença entre a 1ª e a 2ª etapa. Verde indica melhora, vermelho indica queda.",
  },
  {
    categoria: "Evolução",
    pergunta: "Como funciona o pódio de Evolução?",
    resposta: "Ele mostra os alunos que mais melhoraram entre os bimestres escolhidos. O aluno não precisa estar com nota alta; o que conta é a maior diferença positiva.",
  },
  {
    categoria: "Destaques",
    pergunta: "Como funciona o pódio de Destaques?",
    resposta: "O pódio mostra os melhores alunos acima do limite de destaque conforme os filtros de ano, turma, disciplina, bimestre e busca por nome.",
  },
  {
    categoria: "Configurações",
    pergunta: "Como funcionam os limites em Configurações?",
    resposta: "Os limites definem destaque, meta mínima e situação crítica. Esses valores orientam as cores, listas de risco, relatórios e indicadores do sistema.",
  },
  {
    categoria: "Login",
    pergunta: "Como entro no sistema?",
    resposta: "Na tela inicial, informe o e-mail e a senha cadastrados no Firebase Authentication e clique em Entrar.",
  },
  {
    categoria: "Início",
    pergunta: "Para que serve a página Início?",
    resposta: "Ela mostra um resumo rápido do bimestre: média geral, alunos acima do limite de destaque, alunos em reforço e alunos críticos.",
  },
  {
    categoria: "Alunos",
    pergunta: "Como cadastro um aluno novo?",
    resposta: "Entre em Alunos, preencha nome, ano e turma, depois clique em Cadastrar. O aluno fica salvo no banco de dados.",
  },
  {
    categoria: "Alunos",
    pergunta: "Como deleto um aluno?",
    resposta: "Na página Alunos, encontre o aluno na tabela e clique em Deletar. O site pedirá confirmação antes de remover.",
  },
  {
    categoria: "Alunos",
    pergunta: "Por que preciso escolher ano e turma?",
    resposta: "Ano e turma permitem filtrar relatórios, rankings, notas e alunos em risco de forma organizada.",
  },
  {
    categoria: "Notas",
    pergunta: "Como lançar notas?",
    resposta: "Entre em Notas, escolha ano, turma, disciplina, bimestre e, se quiser, o filtro de reavaliação. Preencha avaliação e reavaliação de cada etapa e clique em Salvar alterações.",
  },
  {
    categoria: "Notas",
    pergunta: "Quanto vale cada etapa?",
    resposta: "A 1ª etapa vale até 50 pontos e a 2ª etapa vale até 50 pontos. Se houver reavaliação, o sistema usa a maior nota de cada etapa e calcula a média: etapa final 1 + etapa final 2, dividido por 2.",
  },
  {
    categoria: "Notas",
    pergunta: "O botão Salvar alterações salva onde?",
    resposta: "Ele salva avaliação, reavaliação, média e total dentro do documento do aluno no Firestore, separado por disciplina e bimestre.",
  },
  {
    categoria: "Notas",
    pergunta: "Quando o aluno precisa fazer reavaliação?",
    resposta: "Quando a avaliação de uma etapa fica abaixo de 30 pontos, o aluno aparece como precisando de reavaliação naquela etapa.",
  },
  {
    categoria: "Risco",
    pergunta: "Quem aparece em Alunos em risco?",
    resposta: "Aparecem alunos abaixo da meta configurada. Abaixo do limite crítico configurado fica marcado como crítico.",
  },
  {
    categoria: "Risco",
    pergunta: "O que significa persistente?",
    resposta: "Persistente significa que o aluno ficou abaixo da meta em bimestres seguidos.",
  },
  {
    categoria: "Risco",
    pergunta: "Por que aparece um alerta na barra lateral?",
    resposta: "O alerta chama atenção quando há alunos em risco no filtro padrão do sistema.",
  },
  {
    categoria: "Evolução",
    pergunta: "Como vejo se o aluno melhorou?",
    resposta: "Na página Evolução, escolha os bimestres para comparar. Verde indica melhora e vermelho indica queda.",
  },
  {
    categoria: "Destaques",
    pergunta: "Quem aparece em Destaques?",
    resposta: "Aparecem alunos com nota igual ou maior que o limite de destaque configurado no filtro selecionado.",
  },
  {
    categoria: "Destaques",
    pergunta: "O pódio muda por turma?",
    resposta: "Sim. Ao filtrar ano e turma, o pódio mostra os melhores alunos daquele recorte.",
  },
  {
    categoria: "Relatórios",
    pergunta: "Como salvo um relatório?",
    resposta: "Na aba Relatórios, escolha o tipo, filtros e clique em Salvar relatório. Ele fica guardado no Firestore.",
  },
  {
    categoria: "Relatórios",
    pergunta: "Como consulto um relatório salvo?",
    resposta: "Na lista Relatórios salvos, clique em Consultar para abrir a prévia daquele relatório novamente.",
  },
  {
    categoria: "Relatórios",
    pergunta: "Como gerar PDF?",
    resposta: "Abra o relatório desejado e clique em PDF. O navegador abre a impressão para salvar como PDF.",
  },
  {
    categoria: "Relatórios",
    pergunta: "O que é relatório anual?",
    resposta: "É um relatório geral do ano letivo, calculando o desempenho dos quatro bimestres.",
  },
  {
    categoria: "Configurações",
    pergunta: "Para que servem as Configurações?",
    resposta: "Elas guardam regras como nota de destaque, meta mínima, limite crítico e ano letivo ativo.",
  },
  {
    categoria: "Ajuda",
    pergunta: "Como encontro uma dúvida rapidamente?",
    resposta: "Use a busca da página Ajuda. Ela procura pelo texto da pergunta, resposta e categoria.",
  },
];

export const tutoriaisPraticos = [
  {
    id: "cadastrar-aluno",
    titulo: "Cadastrar um aluno novo",
    descricao: "Mostra onde clicar e quais campos preencher para salvar um aluno no banco.",
    passos: [
      {
        rota: "/alunos",
        seletor: '[data-tour="nav-alunos"]',
        titulo: "Abra a página Alunos",
        texto: "O cadastro começa pela página Alunos. O menu lateral leva você para essa área.",
      },
      {
        rota: "/alunos",
        seletor: '[data-tour="aluno-nome"]',
        titulo: "Digite o nome completo",
        texto: "Escreva o nome do aluno neste campo. Use o nome completo para facilitar buscas e relatórios.",
      },
      {
        rota: "/alunos",
        seletor: '[data-tour="aluno-ano"]',
        titulo: "Escolha o ano escolar",
        texto: "Selecione se o aluno está no 3º, 4º ou 5º ano.",
      },
      {
        rota: "/alunos",
        seletor: '[data-tour="aluno-turma"]',
        titulo: "Escolha a turma",
        texto: "Escolha a turma correta. Isso será usado nos filtros do sistema inteiro.",
      },
      {
        rota: "/alunos",
        seletor: '[data-tour="aluno-cadastrar"]',
        titulo: "Clique em Cadastrar",
        texto: "Depois de conferir os dados, clique em Cadastrar para salvar no Firestore.",
      },
    ],
  },
  {
    id: "lancar-notas",
    titulo: "Lançar e salvar notas",
    descricao: "Ensina a filtrar alunos, preencher notas e salvar alterações.",
    passos: [
      {
        rota: "/notas",
        seletor: '[data-tour="nav-notas"]',
        titulo: "Abra Notas",
        texto: "A página Notas é onde você informa avaliação e reavaliação das duas etapas e salva o resultado.",
      },
      {
        rota: "/notas",
        seletor: '[data-tour="notas-filtros"]',
        titulo: "Escolha os filtros",
        texto: "Use ano, turma, disciplina, bimestre e busca para mostrar apenas os alunos desejados.",
      },
      {
        rota: "/notas",
        seletor: '[data-tour="nota-etapa1"]',
        titulo: "Preencha a 1ª etapa",
        texto: "Digite a nota da avaliação da primeira etapa. Se for abaixo de 30, o aluno entra no filtro de reavaliação.",
      },
      {
        rota: "/notas",
        seletor: '[data-tour="nota-etapa2"]',
        titulo: "Preencha a 2ª etapa",
        texto: "Digite a nota da avaliação da segunda etapa. A média soma a etapa final 1 com a etapa final 2 e divide por 2.",
      },
      {
        rota: "/notas",
        seletor: '[data-tour="nota-etapa1-reavaliacao"]',
        titulo: "Preencha reavaliação se precisar",
        texto: "Quando a avaliação ficar abaixo de 30, use o campo de reavaliação. Se a reavaliação for maior, ela passa a ser a nota final daquela etapa na média.",
      },
      {
        rota: "/notas",
        seletor: '[data-tour="notas-salvar"]',
        titulo: "Salve as alterações",
        texto: "Clique em Salvar alterações para gravar as notas no banco de dados.",
      },
    ],
  },
  {
    id: "ver-risco",
    titulo: "Encontrar alunos em risco",
    descricao: "Mostra como consultar reforço, críticos e persistentes.",
    passos: [
      {
        rota: "/risco",
        seletor: '[data-tour="nav-risco"]',
        titulo: "Abra Risco",
        texto: "A página Risco mostra os alunos abaixo da meta configurada.",
      },
      {
        rota: "/risco",
        seletor: '[data-tour="risco-filtros"]',
        titulo: "Filtre a lista",
        texto: "Você pode procurar por nome, ano, turma, disciplina e bimestre.",
      },
      {
        rota: "/risco",
        seletor: '[data-tour="risco-segmentos"]',
        titulo: "Separe por situação",
        texto: "Use os botões para ver todos, críticos, reforço ou persistentes.",
      },
      {
        rota: "/risco",
        seletor: '[data-tour="risco-lista"]',
        titulo: "Leia os cartões",
        texto: "As cores indicam a gravidade: vermelho para crítico, amarelo para reforço e vermelho claro para persistente.",
      },
    ],
  },
  {
    id: "relatorio-salvo",
    titulo: "Salvar e consultar relatórios",
    descricao: "Ensina a gerar, salvar, consultar e exportar PDF.",
    passos: [
      {
        rota: "/relatorios",
        seletor: '[data-tour="nav-relatorios"]',
        titulo: "Abra Relatórios",
        texto: "Todos os relatórios bimestrais e anuais ficam nesta página.",
      },
      {
        rota: "/relatorios",
        seletor: '[data-tour="relatorio-tipo"]',
        titulo: "Escolha o tipo",
        texto: "Escolha se quer resumo, abaixo da meta, críticos, destaques, evolução ou relatório anual.",
      },
      {
        rota: "/relatorios",
        seletor: '[data-tour="relatorio-filtros"]',
        titulo: "Ajuste os filtros",
        texto: "Escolha turma, ano, disciplina e bimestre para montar o relatório.",
      },
      {
        rota: "/relatorios",
        seletor: '[data-tour="relatorio-salvar"]',
        titulo: "Salve no banco",
        texto: "Clique em Salvar relatório. Se ele já existir, o sistema atualiza sem duplicar.",
      },
      {
        rota: "/relatorios",
        seletor: '[data-tour="relatorios-salvos"]',
        titulo: "Consulte depois",
        texto: "Os relatórios salvos aparecem aqui. Use Consultar para abrir e PDF para imprimir.",
      },
    ],
  },
  {
    id: "usar-ajuda",
    titulo: "Como usar a Ajuda",
    descricao: "Mostra como pesquisar dúvidas, abrir respostas e iniciar tutoriais guiados.",
    passos: [
      {
        rota: "/ajuda",
        seletor: '[data-tour="nav-ajuda"]',
        titulo: "Abra Ajuda",
        texto: "A Ajuda fica destacada no menu e também tem atalho no Início.",
      },
      {
        rota: "/ajuda",
        seletor: '[data-tour="ajuda-busca"]',
        titulo: "Pesquise sua dúvida",
        texto: "Digite palavras como notas, aluno, relatório, PDF, risco ou turma.",
      },
      {
        rota: "/ajuda",
        seletor: '[data-tour="ajuda-faq"]',
        titulo: "Abra uma resposta",
        texto: "As perguntas frequentes ficam antes dos tutoriais. Clique em uma pergunta para ver a resposta completa.",
      },
      {
        rota: "/ajuda",
        seletor: '[data-tour="ajuda-tutoriais"]',
        titulo: "Use tutoriais práticos",
        texto: "Depois das perguntas, ficam os tutoriais guiados. Clique em um tutorial para o site mostrar cada etapa na tela.",
      },
    ],
  },
  {
    id: "entender-inicio",
    titulo: "Como funciona o Início",
    descricao: "Explica os indicadores principais, alertas e atalhos da primeira página do sistema.",
    passos: [
      {
        rota: "/inicio",
        seletor: '[data-tour="nav-inicio"]',
        titulo: "Abra o Início",
        texto: "O Início é o painel rápido do sistema. Ele ajuda a entender a situação da escola sem abrir relatório.",
      },
      {
        rota: "/inicio",
        seletor: '[data-tour="inicio-resumo"]',
        titulo: "Veja o resumo geral",
        texto: "Aqui aparece a média geral e um resumo de quantos alunos estão abaixo da meta no filtro atual.",
      },
      {
        rota: "/inicio",
        seletor: '[data-tour="inicio-metricas"]',
        titulo: "Leia os indicadores",
        texto: "Esses cards mostram alunos avaliados, alunos nota 10, reforço e críticos.",
      },
      {
        rota: "/inicio",
        seletor: '[data-tour="inicio-alertas"]',
        titulo: "Acompanhe alertas e ranking",
        texto: "Nesta área ficam os alunos que precisam de atenção e também os melhores desempenhos.",
      },
      {
        rota: "/inicio",
        seletor: '[data-tour="inicio-atalhos"]',
        titulo: "Use os atalhos",
        texto: "Os atalhos levam rapidamente para Notas, Evolução, Alunos, Relatórios e Ajuda.",
      },
    ],
  },
  {
    id: "entender-evolucao",
    titulo: "Como funciona a Evolução",
    descricao: "Mostra como comparar bimestres e identificar melhora ou queda de desempenho.",
    passos: [
      {
        rota: "/evolucao",
        seletor: '[data-tour="nav-evolucao"]',
        titulo: "Abra Evolução",
        texto: "A Evolução compara o desempenho do aluno em dois momentos diferentes.",
      },
      {
        rota: "/evolucao",
        seletor: '[data-tour="evolucao-filtros"]',
        titulo: "Escolha os filtros",
        texto: "Você pode escolher aluno, ano, turma, disciplina e quais bimestres serão comparados.",
      },
      {
        rota: "/evolucao",
        seletor: '[data-tour="evolucao-metricas"]',
        titulo: "Veja o resumo",
        texto: "Os cards mostram quantos melhoraram, caíram ou ficaram estáveis no período.",
      },
      {
        rota: "/evolucao",
        seletor: '[data-tour="evolucao-podio"]',
        titulo: "Veja o pódio de evolução",
        texto: "Aqui aparecem os alunos que mais subiram entre os bimestres selecionados, mesmo que ainda não estejam entre as maiores notas.",
      },
      {
        rota: "/evolucao",
        seletor: '[data-tour="evolucao-homenagem"]',
        titulo: "Homenageie o pódio",
        texto: "Use este botão para gerar certificados dos alunos com maior evolução no filtro atual.",
      },
      {
        rota: "/evolucao",
        seletor: '[data-tour="evolucao-lista"]',
        titulo: "Leia a lista por aluno",
        texto: "Cada linha mostra a comparação. Verde significa melhora; vermelho significa queda.",
      },
    ],
  },
  {
    id: "entender-destaques",
    titulo: "Como funciona os Destaques",
    descricao: "Explica como o pódio e a lista de alunos acima do limite de destaque são montados.",
    passos: [
      {
        rota: "/destaques",
        seletor: '[data-tour="nav-destaques"]',
        titulo: "Abra Destaques",
        texto: "Destaques mostra os alunos nota 10, ou seja, aqueles com o limite de destaque configurado.",
      },
      {
        rota: "/destaques",
        seletor: '[data-tour="destaques-filtros"]',
        titulo: "Filtre o grupo",
        texto: "Escolha ano, turma, disciplina e bimestre. O pódio muda conforme esses filtros.",
      },
      {
        rota: "/destaques",
        seletor: '[data-tour="destaques-podio"]',
        titulo: "Entenda o pódio",
        texto: "O pódio mostra os três melhores alunos do filtro selecionado.",
      },
      {
        rota: "/destaques",
        seletor: '[data-tour="destaques-lista"]',
        titulo: "Veja a lista completa",
        texto: "A tabela abaixo mostra todos os alunos acima do limite de destaque, não só os três primeiros.",
      },
    ],
  },
  {
    id: "entender-configuracoes",
    titulo: "Como funciona as Configurações",
    descricao: "Mostra onde alterar limites de destaque, meta, crítico e ano letivo ativo.",
    passos: [
      {
        rota: "/configuracoes",
        seletor: '[data-tour="nav-configuracoes"]',
        titulo: "Abra Configurações",
        texto: "Configurações guarda regras importantes que influenciam várias páginas do sistema.",
      },
      {
        rota: "/configuracoes",
        seletor: '[data-tour="config-limiares"]',
        titulo: "Ajuste os limites de nota",
        texto: "Aqui você define o que é destaque, meta mínima e situação crítica.",
      },
      {
        rota: "/configuracoes",
        seletor: '[data-tour="config-ano-letivo"]',
        titulo: "Confira o ano letivo",
        texto: "O ano letivo ativo ajuda a organizar relatórios e histórico anual.",
      },
      {
        rota: "/configuracoes",
        seletor: '[data-tour="config-salvar"]',
        titulo: "Salve as configurações",
        texto: "Depois de alterar limites ou ano letivo, clique em Salvar configurações para gravar no banco.",
      },
    ],
  },
  {
    id: "consultar-relatorios-salvos",
    titulo: "Consultar relatórios salvos",
    descricao: "Mostra onde ficam as abas de Relatórios e como acessar a lista salva.",
    passos: [
      {
        rota: "/relatorios",
        seletor: '[data-tour="relatorio-abas"]',
        titulo: "Use as abas",
        texto: "A aba Relatórios salvos fica no topo da página. Clique nela para consultar, gerar PDF ou deletar relatórios guardados.",
      },
      {
        rota: "/relatorios",
        seletor: '[data-tour="relatorio-abas"]',
        titulo: "Delete com confirmação",
        texto: "Dentro da aba Relatórios salvos, use o botão Deletar no relatório desejado. O sistema sempre pede confirmação antes de apagar.",
      },
    ],
  },
  {
    id: "finalizar-ano-letivo",
    titulo: "Finalizar o ano letivo",
    descricao: "Explica como abrir o fechamento anual e revisar os dados do próximo ano.",
    passos: [
      {
        rota: "/configuracoes",
        seletor: '[data-tour="config-finalizar-ano"]',
        titulo: "Abra o fechamento",
        texto: "Clique em Finalizar ano atual para revisar o que será levado para o próximo ano letivo.",
      },
      {
        rota: "/configuracoes",
        seletor: '[data-tour="config-ano-letivo"]',
        titulo: "Confira o ano atual",
        texto: "Antes de fechar, confira qual ano está ativo. O sistema arquiva esse ano e inicia o próximo.",
      },
      {
        rota: "/configuracoes",
        seletor: '[data-tour="config-finalizar-ano"]',
        titulo: "Revise antes de confirmar",
        texto: "Depois de abrir o formulário, você pode editar alunos, turmas, anos, disciplinas e bimestres antes de confirmar.",
      },
    ],
  },
  {
    id: "consultar-anos-antigos",
    titulo: "Consultar anos antigos",
    descricao: "Mostra onde ficam os anos letivos arquivados.",
    passos: [
      {
        rota: "/configuracoes",
        seletor: '[data-tour="config-anos-antigos"]',
        titulo: "Acesse o histórico",
        texto: "Este botão abre a página de anos antigos, onde ficam os anos letivos arquivados.",
      },
      {
        rota: "/anos-antigos",
        seletor: '[data-tour="anos-antigos-lista"]',
        titulo: "Escolha o ano",
        texto: "Clique em um ano arquivado para ver o resumo e a lista de alunos guardada naquele fechamento.",
      },
    ],
  },
  {
    id: "homenagear-podio",
    titulo: "Homenagear alunos destaque",
    descricao: "Ensina a gerar certificados em PDF para os alunos do pódio.",
    passos: [
      {
        rota: "/destaques",
        seletor: '[data-tour="destaques-filtros"]',
        titulo: "Filtre o pódio",
        texto: "Escolha ano, turma, disciplina e bimestre para montar o pódio correto.",
      },
      {
        rota: "/destaques",
        seletor: '[data-tour="destaques-homenagem"]',
        titulo: "Gere as homenagens",
        texto: "Clique em Homenagear pódio para abrir certificados bonitos, um para cada aluno do pódio, prontos para salvar como PDF.",
      },
    ],
  },
  {
    id: "ver-ano-letivo-atual",
    titulo: "Ver ano letivo atual",
    descricao: "Mostra onde o sistema exibe o ano em uso.",
    passos: [
      {
        rota: "/inicio",
        seletor: '[data-tour="ano-letivo-atual"]',
        titulo: "Veja o ano ativo",
        texto: "Este marcador aparece no topo do sistema para mostrar em qual ano letivo os dados estão sendo usados.",
      },
    ],
  },
];
