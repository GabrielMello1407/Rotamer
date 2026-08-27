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
  **Reaberta e refechada em 27/08/2026.** O `researcher` derrubou a premissa — "não existe
  motor aberto e permissivo" é falso, o `openclatura` 0.3.1 é MIT e determinístico — e o D-15
  foi reescrito por cima com justificativa nova. A resposta continua **não**, agora por escolha
  e não por impossibilidade. O que ficou aberto é só a **direção**, e quem responde é o professor,
  na sessão de observação da Fase 3. Os caminhos estão logo abaixo.
- **Acessibilidade do canvas.** Desenhar exige ponteiro; teclado só tem atalhos. Compra
  institucional costuma exigir acessibilidade, e isso pode virar bloqueio de venda antes de virar
  pedido de usuário.

## Nomenclatura — os cinco caminhos, e o que destranca cada um

**Escrito em 27/08/2026, a partir de `docs/pesquisa/nomenclatura.md`.** Nada disto entra agora. O
D-15 fica de pé com justificativa nova, e a escolha entre os caminhos abaixo **espera a sessão de
observação**, que responde de graça a única pergunta que decide tudo: o professor quer "nomeie o
que eu desenhei" ou "corrija o nome que meu aluno escreveu"? As perguntas exatas estão na Fase 3
do `docs/ROADMAP.md`.

Ordem de preço, do mais barato ao mais caro.

**(a) Não nomear, e dizer isso em voz alta.** É o que está valendo. Custo quase zero: a
justificativa reescrita (feita) e uma frase na tela que responda antes de o professor perguntar.
Risco: ele lê como limitação em vez de escolha — o que encolhe se a frase disser **o que** o
produto não faz e **por quê**, em vez de "não dá". Obriga para sempre: a disciplina de recusar
apelido que se passe por nomenclatura — hoje sustentada mais pela atribuição de autoria do que
pela regra escrita, e isso agora está dito no D-15.

**(b) O aluno nomeia e o produto confere** (nome → estrutura). **Metade já existe e custa zero:** a
condição `inchiKey` das missões (`packages/quests/src/types.ts`) já compara o que o aluno desenhou
com o alvo, e o nome do alvo é digitado por um humano no dado da missão — nenhum motor, nenhuma
rede, o D-15 intacto. É a direção que ENEM, Unicamp e SEDUC-SP cobram, é onde o aluno erra (41,59%
de zeros na Unicamp 2005) e é o que Shute (2008) prescreve: o aluno produz, o software confere. A
**outra** metade — nomenclatura livre, o aluno escrevendo qualquer nome — exige OPSIN (JVM no VPS,
ou o serviço do EBI) mais uma camada pt→en que **decide estrutura** e portanto não pode ser o LLM
(D-01). Obriga para sempre: um dicionário pt→en revisado por químico, mais um processo em produção
ou uma dependência de terceiro. **Contra, e é sério:** reabre o item 3 do D-09, que pôs entrada por
nome depois do MVP. **Destranca se** a sessão disser "corrija o nome do meu aluno" — e aí a
primeira entrega é a metade grátis: missão com alvo dado por nome, sem motor nenhum.

**(c) Integrar motor de terceiro** (estrutura → nome). Candidato realista único: `openclatura`
0.3.1, MIT, determinístico, sobre o RDKit, como microsserviço Python ao lado do Next.js. Custo: um
serviço a mais em produção para sempre, **mais** a localização pt-BR, que é o trabalho de verdade.
Risco: beta 0.3.1 de um laboratório só; inglês; chamada de rede por nome, que não funciona offline
e cai junto com o VPS. Obriga para sempre: **só mostrar nome que a verificação confirmou** — e
ativar o `verify_with_opsin` puxa o OPSIN, o Java e a LGPL junto. A favor, e é o argumento forte: o
`NameAnalysis` devolve o nome **em pedaços**, com índices de átomo que casam com o grafo — daria
para acender no desenho a parte que corresponde a cada pedaço do nome, que é a mesma ideia do
"átomo aceso é um só nas duas telas" (D-18). Isso deixa de ser dar a resposta e vira explicação.
**Destranca se** os três gatilhos do D-15 forem satisfeitos, nesta ordem: sessão → químico marcando
nome a nome → pt-BR determinístico.

**(d) Faixa restrita** — nomear só o que dá para garantir e calar no resto. Risco: a fronteira é
invisível ao usuário, e a faixa **cresce** — escopo estourando é o risco número um deste projeto.
Observação que muda o preço: com o round-trip do `openclatura`, a faixa não precisa ser escrita à
mão — pode ser "tudo que a verificação confirmou", que é fronteira medida e não opinada. Na
prática isto não é caminho separado: é o (c) feito direito.

**(e) Nomear só o conteúdo curado, em tempo de build.** Rodar o motor uma vez sobre a lista fechada
das missões, um químico conferir nome a nome, e o resultado entrar como **dado** — do mesmo jeito
que o nome já entra hoje na missão. Custo zero em produção: nenhum serviço, funciona offline e no
celular fraco. Risco: só responde dentro da missão, e o professor vai desenhar fora da lista — que
é exatamente o que ele fará na sessão. Obriga para sempre: revisão humana a cada mudança da lista,
trabalho de professor que some se ninguém for pago para fazê-lo. **E isto não é nomear, é
catálogo** — a diferença precisa estar dita na tela, ou vira a impressão de que o produto nomeia,
que é justamente o que o D-15 quis evitar. **Destranca se** a sessão disser "nomeie o que eu
desenhei" **e** o professor aceitar que o produto responda só dentro da trilha.

**Vetado, e o motivo já está escrito.** Qualquer motor **neural** de nomenclatura, incluindo o
STOUT (MIT): 83,52% a 89,86% de acerto medidos pelos próprios autores é o mesmo perfil que o
`CLAUDE.md` usa para vetar o LLM. `chem-dl-iupac` (AGPL-3.0) e `iupac-to-structure` (GPL-3.0) caem
pela licença; `smiles2iupac` e o fork em espanhol do OPSIN não têm licença nenhuma. O ChemDoodle
**não** está vetado por política — a licença comercial da iChemLabs serve a produto fechado; ele
está fora por preço (US$ 29/mês por usuário, sem desconto acadêmico) e por depender do servidor
deles a cada chamada. Chamar isso de "vetado" transformaria juízo de negócio em proibição de regra.

## Duas dívidas menores que a nomenclatura deixou

- **Lista de nomes triviais de composto.** Hoje o `checkName` aceita `aspirina`, `cafeina` e
  `anilina` como apelido. **É dado de química**: ou vem de fonte revisada por químico, ou não vem
  — inventar a lista aqui seria o kernel próprio outra vez (D-02). Só entra se a revisão da Fase 3
  mostrar que a colisão incomoda de verdade. Até lá quem carrega o peso é a atribuição de autoria:
  "batizada por Camila" ao lado do apelido.
- **`condense_abbreviations` do RDKit.** Produz rótulos como `CO2Et`, que o aluno lê como nome. Não
  está ligado em lugar nenhum do produto hoje (verificado por grep). Se alguém ligar, esses rótulos
  caem sob a regra do D-15 e precisam de origem dita na tela.

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
