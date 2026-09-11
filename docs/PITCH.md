# Rotamer — por que existe

> **Desenhe uma molécula em 2D. Descubra o que ela é em 3D.**
> Um ambiente em português onde estrutura molecular deixa de ser decoreba e vira intuição
> espacial — com a química validada por motor determinístico, não por chute de IA.

---

**O que é:** ferramenta de **ensino** de química orgânica, **aberta, sob licença MIT e
gratuita** (D-28). O aluno usa; o professor decide o que entra na aula; o pesquisador é usuário
avançado bem-vindo. Não compete com ChemDraw, Maestro ou PyMOL — e não é vendida a ninguém: existe
uma instância no ar mantida pelo autor, e qualquer escola pode subir a sua com Docker
([INSTALACAO.md](INSTALACAO.md)).

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
   do navegador, sem servidor, de graça.
2. **WebGL é universal.** Renderização 3D fluida no celular de escola pública, sem instalar nada.
3. **LLM barato o bastante para ser tutor.** Explicar por que a tentativa falhou, em português, a
   custo de centavos — desde que ele nunca decida a química.

## O que o produto faz

Um ambiente web onde se desenha a estrutura em fórmula plana — como todo químico faz — e a
geometria tridimensional aparece no mesmo instante:

- **Dobra.** A molécula nasce emaranhada e se dobra até encontrar a forma. Não é animação
  decorativa: são os quadros reais da minimização de energia no campo de força MMFF94.
- **Vibra.** Dinâmica molecular no mesmo campo de força, a 300 K — e os **modos normais**, um a um,
  cada um com a sua frequência. A ligação simples gira, a dupla fica rígida, o anel aromático
  treme sem sair do plano. O aluno *vê* a regra, não decora.
- **Julga.** Valência, fórmula, massa, grupos funcionais, TPSA, logP, centros estereogênicos —
  tudo calculado pelo RDKit e exibido enquanto ele desenha. Onde o RDKit diverge do PubChem, a
  tela mostra o valor do RDKit e diz de quem é a definição.
- **Ensina.** Quando erra, o erro explica a química; e, se houver chave configurada, o tutor
  explica em português por que errou — lendo os números já calculados, marcado como hipótese.

E tem enredo: **missões** nas trilhas de estrutura, geometria e propriedade, do "monte um éster
com quatro carbonos" ao centro estereogênico que só fecha com a cunha certa; **listas da turma**,
que o professor monta com missões do catálogo ou cria **desenhando a resposta** — o produto extrai
os objetivos da molécula, nunca de texto digitado; e um **catálogo buscável**, com as missões que
professores publicaram, assinadas. A mesma ferramenta serve o aluno de 16 anos e o mestrando.

## O que não se copia rápido

1. **O editor 2D escrito à mão.** É onde mora o toque — arrastar de um átomo e ver o próximo
   nascer já ligado, selecionar um pedaço e mover em bloco, organizar o desenho e saber o que
   aconteceu com cada cunha. Nenhuma lib pronta entrega isso.
2. **A fronteira rígida entre motor e IA.** O núcleo determinístico decide, a IA só explica. É
   uma decisão de arquitetura, não uma feature — e é o que faz um químico confiar.
3. **Rigor científico dentro de uma ferramenta de ensino.** A concorrência educacional simplifica
   a química até ela ficar errada. Aqui o motor é o mesmo que um pesquisador usaria — e isso
   importa porque **professor de química é químico**: um erro no app não confunde um aluno,
   confunde uma sala inteira.
4. **Português como cidadão de primeira classe.** Mensagens de erro que explicam a química, e um
   corpo de missões alinhado ao que se ensina no Brasil.
5. **O professor vê onde a turma parou** — não quem foi melhor, não o que cada aluno desenhou
   (D-22). É informação de aula, não de ranking.

## O que custa, e para quem

Nada. O código é MIT; a instância no ar é mantida pelo autor sem garantia de disponibilidade; e
quem precisa de garantia — a TI de uma secretaria, uma universidade — sobe a própria instância com
três comandos e cuida do próprio banco. O custo que existe é o do autor: um servidor pequeno e uma
chave de modelo de linguagem para o tutor. Se um dia ele não couber, a instância encolhe; o código
não fecha (D-28).

## O que já existe

Tudo o que está descrito acima, com testes: 300 e tantos de núcleo e servidor que rodam sem
navegador, e 210 de ponta a ponta em desktop e celular. Os valores batem com a literatura —
aspirina em C₉H₈O₄ com 180,16 g/mol e TPSA 63,6; benzeno em hexágono regular de 120°; a cafeína
com o imidazol aromático, que era o caso que o protótipo de kernel próprio errava.

O que falta é campo: sessões de observação com professores e alunos, a revisão de linguagem por
um químico, e a instância no ar com endereço próprio ([ROADMAP.md](ROADMAP.md)).

## Riscos assumidos

- **Escopo.** O maior de todos. Mitigado por `DEPOIS.md`: ideia fora do escopo vai para lá, não
  para o código.
- **Erro químico em público.** Um químico achando um erro sutil derruba a confiança. Por isso
  nunca se contorna o RDKit, e o `reviewer` tem veto sobre isso.
- **Adoção.** Professor de escola pública tem pouco tempo e pouca banda. O produto precisa
  funcionar em celular fraco e fazer sentido em cinco minutos, ou não entra em sala.
- **Custo do tutor.** Controlado por cache, teto por usuário e degradação para dica escrita à mão
  — e o tutor é opcional: sem chave, ele se desliga e o produto continua inteiro.

## O que ajuda

Professor testando com a molécula da própria aula e dizendo onde travou. TI instalando e dizendo
onde a instalação enganou. Químico lendo o texto da tela. Quem programa, lendo
[ARQUITETURA.md](ARQUITETURA.md) e a regra que não se quebra em [`CLAUDE.md`](../CLAUDE.md).
