# Depois

Toda ideia que não está no escopo do MVP mora aqui, não no código.
Escopo estourando é o risco número um deste projeto.

Regra: se surgiu no meio de outra tarefa, escreva aqui e volte ao que estava fazendo.

> Revisado depois de a v0.1 ficar de pé. A lista antiga foi escrita antes de existir código;
> esta foi escrita depois de construir, e por isso tem sete itens que ninguém tinha previsto.

## v0.2 · Atrito e confiança

O critério do corte: **o que faz um professor voltar na segunda semana.** Nada aqui é
funcionalidade nova impressionante — é tirar pedra do caminho de quem já quer usar.

- [x] **Templates de anel em um clique** — benzeno, cicloexano, ciclopentano e piridina.
- [x] **Rascunho salvo no navegador** — volta ao abrir; link com molécula ganha dele.
- [x] **Exportar SVG e PNG** — SVG é o desenho do RDKit; PNG é a tela como está.
- [x] **Pinça** — dois dedos ancorados no ponto do grafo que está embaixo deles. Falta o resto
      do polimento de celular, que só a Fase 3 vai dizer qual é.
- [x] **Busca por nome, via PubChem** — um campo só: o RDKit tenta ler como estrutura, e o que
      ele não lê vira consulta de nome. Levou junto a verificação de novidade do batismo (D-15):
      composto já conhecido não se batiza, e a tela mostra o nome que o PubChem registra.
- [x] **Centros estereogênicos nas métricas** — com a ressalva "sem configuração" do lado,
      enquanto o editor não representar cunhas e traços.
- [ ] **Recuperação de senha** — numa turma de trinta, alguém esquece na primeira semana.
- [ ] **"Minhas moléculas"** — a tabela existe e só é escrita por tentativa de missão. A conta
      guarda progresso e não guarda o trabalho.

## v0.3 · Estereoquímica

- [ ] **Cunhas e traços, feito direito** — mexe no grafo, no molblock, na percepção CIP e na
      coerência com a cena 3D.

Tirada da v0.2 de propósito. É a primeira coisa que um químico vai pedir e o `CLAUDE.md` diz que
merece ser feita direito; espremer junto com oito itens pequenos é exatamente como se faz errado.

## Perguntas em aberto

- ~~O produto vai nomear molécula?~~ **Respondido (D-15):** não calcula nomenclatura; registra
  autoria. Estrutura válida que ninguém batizou pode receber apelido de quem a desenhou, sempre
  exibido com o nome de quem deu. Falta a parte que depende do PubChem: hoje "ninguém batizou"
  quer dizer "ninguém batizou aqui dentro", e o produto não sabe se o composto já existe lá fora.
- **Acessibilidade do canvas.** Desenhar exige ponteiro; teclado só tem atalhos. Compra
  institucional costuma exigir acessibilidade, e isso pode virar bloqueio de venda antes de virar
  pedido de usuário.

## Considerado e adiado

- [ ] Comparar dois análogos lado a lado — é para o usuário avançado, que não é o comprador (D-09)
- [ ] Modo apresentação para o professor projetar sem a interface de edição
- [ ] Retrossíntese e previsão de reação — precisa de modelo em servidor com GPU
- [ ] Docking com proteína — servidor pesado, e cria expectativa de afirmação biológica
- [ ] DFT / química quântica — impossível no navegador
- [ ] Campanhas abertas da comunidade — depende de massa crítica e do modelo de negócio
- [ ] Edição colaborativa em tempo real
- [ ] App nativo
- [ ] Espectros simulados (RMN, IV) — tentador, mas é outro produto

## Ideias soltas

_(anote aqui e siga em frente)_

---

## O roadmap não tem trilha de pesquisa — e isso é decisão ou esquecimento?

**Levantado em 26/08/2026, durante a Fase 4.**

Lendo o plano de ponta a ponta: tudo o que está escrito serve ao ensino. Missões, turmas,
painel do professor, escola como compradora. Para quem **pesquisa** — o químico medicinal, o
aluno de mestrado, o laboratório — não existe trilha nenhuma no roadmap: nem descoberta, nem
comparação sistemática, nem o que fazer com um resultado que valeu a pena guardar.

**A tensão com o que já está decidido.** O D-09 diz, com todas as letras, que o pesquisador é
usuário avançado e **não é cliente** — e a trilha Otimização existe justamente para ele, sem
missão, sem pontuação, sem conquista. Ou seja: a ausência de trilha de pesquisa no roadmap é
coerente com uma decisão tomada, não é esquecimento. O que **não** foi decidido é se essa
decisão continua valendo agora que o produto tem conta, biblioteca, modos normais e
estereoquímica — coisas que um pesquisador usa.

**O que precisaria existir para dizer que o produto serve à pesquisa** — e cada um destes é uma
fase inteira, não um item:

- comparar moléculas lado a lado, com os descritores em tabela e diferença destacada;
- lote: rodar dezenas de estruturas de uma vez e exportar a planilha;
- conjunto de conformações em vez de uma só, com energia relativa e população de Boltzmann;
- histórico de exploração — o que foi tentado, o que foi descartado e por quê;
- exportar em formato que outra ferramenta leia de verdade (SDF com propriedades, não só SMILES);
- citação e reprodutibilidade: versão do RDKit, do campo de força e da semente, junto do
  resultado.

**Por que não entra agora.** Cada linha dessa lista compete com a Fase 3, que é o contato com
professores de verdade — e o risco número um do projeto, escrito no `CLAUDE.md`, é escopo
estourando. Também há uma pergunta de negócio antes da técnica: pesquisador **paga**? Se a
resposta for não, isso é trabalho que não se sustenta; se for sim, é outro produto, com outro
preço e outro ciclo de venda.

**O que fazer com isto.** Levar a pergunta às sessões da Fase 3 — se algum professor for também
pesquisador, ele responde de graça o que nenhuma reunião responderia. Depois disso, ou o D-09 é
reafirmado, ou é revisto por escrito, com uma fase própria no roadmap. As duas respostas servem;
o silêncio, não.
