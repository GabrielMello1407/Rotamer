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

## Seleção — o que ficou de fora do primeiro corte

Escrito em 27/08/2026, junto com o D-23. A ferramenta Selecionar entregou mover, apagar e trocar
em bloco. Ficaram de fora, em ordem de quanto custam:

- **Inverter a seleção** e **laço à mão livre.** Baratos, mas ninguém pediu: retângulo e fragmento
  cobrem o que o pedido descrevia.
- **Copiar, colar e duplicar.** Puxa área de transferência, ancoragem do que se cola e conflito de
  identificadores. É uma entrega própria.
- **Girar, espelhar e escalar a seleção.** Espelhar **inverte configuração** de centro
  estereogênico: cai no D-21 e precisa de teste que prove que o RDKit vê o enantiômero, não uma
  molécula qualquer.
- **"Selecionar o anel" e "selecionar o grupo funcional".** Percepção de anel e de grupo é do
  RDKit, e `editor2d` não fala com o worker — é a regra de dependência do repositório. Entraria
  como função recebida de quem monta a tela, do mesmo jeito que "Organizar o desenho".
- **Acender a seleção também na cena 3D.** O caminho já existe (`source` liga átomo do grafo a
  átomo da geometria, D-18); o que falta é decidir o que a cena mostra quando a seleção tem
  ligação, e não só átomo.
- **Estereoquímica em bloco.** Vetada no D-23, não adiada: aplicar cunha a várias ligações define
  configurações que ninguém escolheu.

## Momento de dipolo — pedido por professor de verdade

**28 de agosto de 2026.** O professor Pedro, do IFPR, perguntou se o produto mostra o momento de
dipolo, antes mesmo de testar. É o primeiro pedido de funcionalidade vindo de fora, e por isso
vale mais que qualquer ideia nossa.

Hoje **não existe**: não está nos descritores, não está na tela, não está em lugar nenhum do
código.

O que torna o pedido interessante: a geometria 3D já está calculada, e o MMFF94 atribui carga
parcial a cada átomo. Somar carga vezes posição dá um vetor de dipolo — e a **seta** desenhada
sobre a molécula em 3D é justamente o que uma aula de polaridade precisa, mais do que o número.

**Validado pelo professor em 28/08/2026**, antes de qualquer teste: *"Mostraria a polaridade da
molécula. Só a seta, com a direção do dipolo resultante, ajuda bastante."* Ou seja, a saída barata
— seta sem número — é exatamente a que serve para a aula dele. Vale como dado de sessão de
observação, e chegou de graça.

**Só que ela não é barata, e isso foi medido em 28/08/2026.** Nenhum dos dois motores entrega
carga parcial pela API que usamos:

- **OpenChemLib 9.25.0**: `ForceFieldMMFF94` expõe `size()`, `getTotalEnergy()` e `minimise()`, e
  nada mais. O MMFF94 calcula as cargas por dentro para montar o termo eletrostático, mas não as
  devolve.
- **RDKit MinimalLib**: o `JSMol` não tem método de carga parcial (só `get_prop`/`set_prop`
  genéricos), e o `get_json` traz por átomo apenas `impHs`. A string `gasteiger` existe no `.wasm`,
  então o código está compilado — mas não está exposto no JavaScript.

Logo, as saídas possíveis, e nenhuma é de uma tarde:

1. **Achar outra fonte de carga com licença que sirva** (MIT, BSD, Apache) — pergunta para o
   `researcher`.
2. **Compilar a nossa própria MinimalLib** com a função do RDKit exposta. É o caminho mais correto
   quimicamente e o mais caro em infraestrutura; muda o `prebuild` e o `docs/DEPLOY.md`.
3. **Implementar Gasteiger–Marsili à mão.** Tentador e proibido pelo espírito do D-01 e do D-02:
   seria kernel próprio outra vez, agora em carga parcial, e o erro sairia silencioso numa seta que
   aponta para o lado errado.
4. **Não fazer**, e dizer por quê.

O que impede de entrar sem conversa:

- **Dipolo de campo de força é estimativa grosseira.** As cargas do MMFF94 servem para energia, não
  para momento de dipolo; o valor de referência de verdade vem de cálculo quântico. Mostrar
  "1,85 D" para a água quando a conta dá outra coisa seria o erro que este produto não pode
  cometer (D-01) — e o número da água é o primeiro que qualquer professor confere.
- Então há duas saídas honestas, e a escolha é do `pm`: mostrar **só a direção** (a seta, sem
  número, dizendo que é a direção da polaridade e não uma medida), ou mostrar o número com a
  origem dita e uma comparação — o que exige medir antes o quanto ele erra em moléculas de aula.
- Antes das duas: **perguntar ao Pedro o que ele faria com isso na aula**. Se o uso é "mostrar que
  a água é polar e o CO₂ não", a seta basta e é barata.

## Missões como material de aula — proposta de estrutura, aguardando o `pm`

**28 de agosto de 2026.** As missões existem desde a v0.1 e foram pensadas como isca para quem
chega sozinho. A pergunta nova é outra: **servir de exercício dentro da aula**, na sequência em que
o professor ensina. É mudança de dono — de aluno curioso para professor com plano de ensino — e
por isso precisa de decisão de escopo antes de código.

### O que trava hoje

O catálogo tem 16 missões, cada uma com `track` e `difficulty: 1 | 2 | 3`. O número é **rótulo, não
progressão**: ele não diz o que a missão ensina, não diz o que ela pressupõe, e não tem relação
nenhuma com a ordem em que o conteúdo aparece no semestre. Para o produto, "dificuldade 2" é uma
fatia; para o professor, a unidade é "aula de funções oxigenadas, semana 4".

Falta também o que agrupa: não existe jeito de o professor dizer "estas cinco, nesta ordem, para a
minha turma".

### A ideia: conceito e pré-requisito, e a ordem deixa de ser opinião

Cada missão passaria a declarar o que **ensina** e o que **pressupõe**, em conceitos da disciplina
— não em números:

```
teaches:  ['carbonila', 'cetona']
requires: ['valencia-do-carbono', 'ligacao-dupla']
```

Com isso a ordem **deriva do grafo de conceitos** em vez de ser fixada à mão, a mesma missão pode
ser alcançada por caminhos diferentes, e `difficulty` vira consequência (quantos conceitos ela
exige) em vez de declaração. Também aparece de graça a resposta para "o que vem depois desta?".

### O que o professor precisa, em ordem de valor

1. **Escolher** — montar um roteiro: um punhado de missões, na ordem dele, com um nome ("Funções
   oxigenadas — 3ª série"). É o que transforma o produto em material de aula, e não exige que ele
   escreva missão nenhuma.
2. **Acompanhar** — já existe (D-22): o painel mostra onde a turma parou, não quem foi melhor.
3. **Criar missão própria** — capacidade **só do professor**, e opcional para ele (D-25,
   28/08/2026): o roteiro pode ser só de catálogo, só de missões dele, ou misto. O jeito de fazer isso sem quebrar o
   D-01 é o professor **desenhar a resposta** e o produto extrair os objetivos verificáveis dela;
   ele escolhe quais cobrar e escreve o enunciado. A parte que decide química nunca é digitada.

### A escolha que precisa ser feita, e a recomendação

Duas leituras de "de acordo com o aprendizado do aluno":

- **Adaptativo automático** — o produto escolhe a próxima missão pelo desempenho. Tentador e
  arriscado: é afirmação sobre aprendizagem que não temos como sustentar, tira o controle do
  professor, e exigiria dado de aluno que hoje o produto de propósito não guarda.
- **Sequência do professor, com o produto medindo** — ele monta o roteiro, o grafo de conceitos
  **sugere** o que vem depois, e o painel mostra onde a turma travou.

A segunda é a que cabe no D-09 (o professor decide) e no D-22 (progresso, não ranking). O grafo de
conceitos entra como sugestão, **nunca como cadeado**: missão que só abre depois de outra é o tipo
de coisa que quebra a aula do professor que quer começar por onde ele quer.

### O que já está certo e não se mexe

- **Dica só quando pedida**, uma de cada vez (`QuestPanel` libera por clique). Isso não é detalhe de
  interface: Shute (2008) mede que resposta dada antes da tentativa anula o efeito do retorno.
- **A nota sai do motor determinístico**, e cada objetivo vale a mesma fatia — nota que o aluno
  consegue explicar.
- **A direção do exercício.** ENEM e Unicamp cobram *nome → estrutura*, e é onde o aluno erra
  (41,59% de zeros na questão 9 da Unicamp 2005). As missões já pedem para desenhar a partir de uma
  descrição; isso é acerto, e vale reforçar em vez de inverter.

### Missões de primeira visita — e o limite do que uma missão pode verificar

Ideia de 28/08/2026: deixar algumas missões para o usuário novo **explorar a ferramenta**, não só a
química. A ideia é boa e já está meio feita: "O primeiro traço" e "O álcool do dia a dia" ensinam
clique, arrasto e a tecla `O` por dentro de um objetivo químico.

O limite que precisa ficar dito: **missão verifica molécula, não gesto** (D-01 e o desenho do
`quests`). "Faça uma ligação dupla" é verificável — a molécula tem a dupla. "Gire a molécula em
3D", "organize o desenho" e "veja um modo de vibração" **não** são: nada muda no grafo. Pôr isso
como objetivo de missão exigiria o motor de missões ler estado de interface, que é justamente o
que ele não deve ler.

Então são duas coisas, e não uma:

- **Missões de tour** continuam sendo missões de química, escritas para que cumprir o objetivo
  **obrigue** a descobrir uma ferramenta: dupla (clique na ligação), heteroátomo (tecla ou tabela
  periódica), centro estereogênico (cunha), um pedaço grande (seleção). Cada uma verificada pelo
  RDKit, como todas.
- **Um roteiro de primeira visita** para o que não é química — girar, vibrar, organizar, modos
  normais — é lista de conferência da interface, sem nota, sem tique, mostrada uma vez e apagável.
  Não é missão e não deve parecer missão; a trilha Otimização nem tem gamificação (D-09).

E a ordem certa de fazer: **depois** das primeiras sessões de observação. Onde o usuário novo trava
é dado que só a sessão dá, e desenhar o tour antes de assistir é adivinhar o problema.

### O que decide tudo, e custa zero

**O plano de ensino do Idelcio.** Ele está com a disciplina neste semestre. A lista de conceitos e
a ordem deles não deveriam sair da nossa cabeça: é pedir o plano, transcrever, e comparar com as 16
missões que existem — o que sobra e o que falta aparece sozinho.

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
