# Rotamer — pitch

> **Desenhe uma molécula em 2D. Descubra o que ela é em 3D.**
> O primeiro ambiente em português onde estrutura molecular deixa de ser decoreba e vira
> intuição espacial — com a química validada por motor determinístico, não por chute de IA.

---

> Como a ideia chegou até aqui, com os pivôs e os erros pelo caminho: [ORIGEM.md](ORIGEM.md).

## O problema

Química orgânica é a matéria que mais reprova em curso de exatas e a que mais afasta aluno de
ensino médio da área. E o motivo é específico, não genérico:

**O livro é plano e a molécula não é.** O estudante decora que o ciclohexano "faz cadeira" sem
nunca ter visto uma cadeira se formar. Decora que a ligação dupla "não gira" sem nunca ter visto
uma ligação simples girando ao lado dela para comparar. A intuição espacial — a única coisa que
realmente separa quem entende orgânica de quem não entende — é justamente a que o material
didático não consegue transmitir.

As ferramentas que resolveriam isso existem, mas nenhuma serve a esse público:

| Ferramenta | Por que não resolve |
|---|---|
| ChemDraw, Maestro, PyMOL | Caras, instaláveis, para pesquisador treinado. Nenhum aluno abre. |
| MolView, ChemTube3D | Gratuitas, mas paradas no tempo, em inglês, pensadas para desktop. |
| PhET e simuladores | Ótimos para conceito isolado; não fazem química orgânica de verdade. |
| Vídeo no YouTube | Passivo. O aluno assiste, não constrói. |

E nenhuma delas fala português.

## Por que agora

Três coisas passaram a ser possíveis quase ao mesmo tempo:

1. **RDKit compila para WebAssembly.** Vinte anos de química computacional validada rodam dentro
   do navegador, sem servidor, de graça. Isso não existia de forma prática até pouco tempo atrás.
2. **WebGL é universal.** Renderização 3D fluida no celular de escola pública, sem instalar nada.
3. **LLM barato o bastante para ser tutor.** Explicar por que a tentativa falhou, em português,
   personalizado, a custo de centavos por aluno por mês.

Quem juntar os três primeiro em português ocupa um espaço vazio.

## A solução

Um ambiente web onde se desenha a estrutura em fórmula plana — como todo químico faz — e a
geometria tridimensional aparece no mesmo instante:

- **Dobra.** A molécula nasce emaranhada e se dobra até encontrar a forma. Não é animação
  decorativa: são os quadros reais da minimização de energia.
- **Vibra.** Dinâmica molecular no mesmo campo de força. A ligação simples gira livremente, a
  dupla fica rígida, o anel aromático treme sem sair do plano. O aluno *vê* a regra, não decora.
- **Julga.** Valência, fórmula, massa, grupos funcionais, TPSA, Lipinski — tudo calculado e
  exibido enquanto ele desenha.
- **Ensina.** Quando erra, o tutor explica em português por que errou e o que fazer.

E tem enredo: missões que começam em "monte um éster com quatro carbonos" e terminam em "reduza
o logP sem perder o farmacóforo". A mesma ferramenta serve o aluno de 16 anos e o mestrando.

## O diferencial defensável

Qualquer um pode plugar uma biblioteca de visualização. O que não se copia rápido:

1. **O editor 2D escrito à mão.** É onde mora o toque — arrastar de um átomo e ver o próximo
   nascer já ligado. Nenhuma lib pronta entrega isso, e acertar leva meses.
2. **A fronteira rígida entre motor e IA.** O núcleo determinístico decide, a IA só explica.
   É uma decisão de arquitetura, não uma feature — e é o que faz um químico confiar. Concorrente
   que colocar LLM respondendo valência vai errar em público e queimar a confiança.
3. **Português como cidadão de primeira classe.** Não tradução: nomenclatura, mensagens de erro
   que explicam a química, e um corpo de missões alinhado ao currículo brasileiro.
4. **O acervo de missões e o mapa de dificuldade.** Cada tentativa registrada mostra onde as
   pessoas travam. Isso vira dado que ninguém mais tem.

## Quem paga

Modelo em camadas, com a base gratuita fazendo o trabalho de distribuição:

| Camada | Quem | Proposta |
|---|---|---|
| **Livre** | Aluno, professor individual | Editor completo e as missões básicas. É o funil e a prova social. |
| **Pro** | Aluno de graduação, professor | Missões avançadas, histórico, exportação em qualidade de publicação, tutor sem limite |
| **Turma** | Escola, cursinho | Painel do professor, turmas, acompanhamento de quem travou onde |
| **Instituição** | Universidade, laboratório | Licença por campus, campanhas privadas, dados de uso |

O professor é o canal. Ele adota de graça, leva a turma junto, e a escola compra o painel.
Venda direta para secretaria de educação existe, mas é ciclo longo — é o segundo movimento,
não o primeiro.

> **A preencher antes de qualquer conversa de investimento:** número de matrículas no ensino
> médio e em cursos de química no Brasil, ticket praticado por plataformas educacionais
> comparáveis, e custo de aquisição por escola. Não invente esses números — levante.

## O que já existe

Um protótipo funcional do núcleo, construído do zero, que prova a parte tecnicamente arriscada:
editor 2D próprio, geometria 3D por campo de força próprio, dinâmica molecular e validação
determinística — tudo no navegador, sem biblioteca de química.

Os valores batem com a literatura: aspirina em C₉H₈O₄ com 180,16 g/mol e TPSA 63,6; benzeno
convergindo para hexágono regular de 120°; ciclohexano caindo em cadeira a 110,6°.

## O caminho

| Fase | Entrega |
|---|---|
| Fundação | monorepo, tokens, RDKit em worker |
| Núcleo | editor, química, geometria, 3D — tudo no cliente |
| Enredo | missões, tutor, contas → **produto vendável** |
| Realidade | validação com professores e alunos |
| Escala | painel de turma, cobrança, campanhas |

## Riscos que assumo

- **Escopo.** O maior de todos. Mitigado por lista de missões congelada e `DEPOIS.md`.
- **Erro químico em público.** Um químico achando um erro sutil derruba a confiança. Por isso
  nunca contornamos o RDKit.
- **Adoção.** Professor de escola pública tem pouco tempo e pouca banda. O produto precisa
  funcionar em celular fraco e fazer sentido em cinco minutos, ou não entra em sala.
- **Custo de IA.** Controlado por cache, teto por usuário e degradação para dica determinística.

## O pedido

_(preencher conforme o interlocutor: professor para validar, escola para piloto, investidor
para capital, ou parceiro técnico. Um pitch sem pedido é uma apresentação.)_
