# Fora de escopo

O que **não** entra no produto agora, e por quê. Cada item traz o custo de fazê-lo e o que
destrancaria a decisão — uma pergunta respondida, um pedido de professor, uma medição.

É o irmão do `DECISOES.md`: lá está o que foi decidido fazer, aqui o que foi decidido não fazer
por enquanto. Ideia que surgiu no meio de outra tarefa se escreve aqui, e se volta ao que estava
fazendo. Escopo estourando é o risco número um deste projeto.

> Revisado em 11 de setembro de 2026, depois do D-28. O que já foi entregue saiu daqui — mora
> no `docs/ROADMAP.md`, marcado como feito. O que ficou é o que está fora de propósito, com o
> porquê e com o que destrancaria cada item.

## Perguntas em aberto

- **A direção da nomenclatura.** O produto não nomeia, por escolha (D-15) — e a pergunta que
  sobrou não é "se", é "em que direção": o professor quer *nomeie o que eu desenhei* ou *corrija
  o nome que meu aluno escreveu*? Quem responde é a sessão de observação da Fase 3, com as
  perguntas exatas do `docs/ROADMAP.md`. Os caminhos, com o preço de cada um, estão logo abaixo.
- **Acessibilidade do canvas.** Desenhar exige ponteiro; o teclado só tem atalhos. Um aluno que
  não usa mouse nem toque fica fora da aula, e escola pública tem obrigação legal de
  acessibilidade. Não tem resposta barata: o editor é canvas próprio, e uma interface por
  teclado é um segundo editor.
- **Trilha de pesquisa.** O roadmap inteiro serve ao ensino. Para quem pesquisa — o químico
  medicinal, o mestrando — não existe trilha: nem comparação sistemática, nem lote, nem
  reprodutibilidade. O D-09 dizia que o pesquisador é usuário avançado e não cliente; o D-28
  tirou a palavra "cliente" e deixou a pergunta legítima. O que precisaria existir, e cada um é
  uma fase inteira: comparar moléculas lado a lado com os descritores em tabela; lote, com dezenas
  de estruturas de uma vez e a planilha saindo; conjunto de conformações com energia relativa e
  população de Boltzmann; histórico de exploração; exportar SDF com propriedades; e citação —
  versão do RDKit, do campo de força e da semente, junto do resultado. **Por que não entra
  agora:** compete com a Fase 3, que é o contato com professores de verdade. **Destranca se**
  algum professor da Fase 3 for também pesquisador e disser o que faria com isso — aí o D-09 é
  reafirmado ou revisto por escrito, com fase própria no roadmap.

## Nomenclatura — os cinco caminhos, e o que destranca cada um

**Escrito em 27/08/2026, a partir de `docs/pesquisa/nomenclatura.md`.** Nada disto entra agora. O
D-15 fica de pé com justificativa nova, e a escolha entre os caminhos abaixo espera a sessão de
observação.

Ordem de preço, do mais barato ao mais caro.

**(a) Não nomear, e dizer isso em voz alta.** É o que está valendo. Custo quase zero: a
justificativa reescrita (feita) e a frase na tela que responde antes de o professor perguntar
(feita: "Apelido é autoria, não nomenclatura. O Rotamer escolheu não nomear"). Risco: ele lê como
limitação em vez de escolha. Obriga para sempre: a disciplina de recusar apelido que se passe por
nomenclatura — sustentada pela atribuição de autoria e pela regra escrita no D-15.

**(b) O aluno nomeia e o produto confere** (nome → estrutura). **Metade já existe e custa zero:** a
condição `inchiKey` das missões (`packages/quests/src/types.ts`) compara o que o aluno desenhou
com o alvo, e o nome do alvo é digitado por um humano no enunciado — nenhum motor, nenhuma rede,
o D-15 intacto. É a direção que ENEM, Unicamp e SEDUC-SP cobram, é onde o aluno erra (41,59% de
zeros na Unicamp 2005) e é o que Shute (2008) prescreve: o aluno produz, o software confere. A
**outra** metade — nomenclatura livre, o aluno escrevendo qualquer nome — exige OPSIN (JVM na
instância, ou o serviço do EBI) mais uma camada pt→en que **decide estrutura** e portanto não pode
ser o LLM (D-01). Obriga para sempre: um dicionário pt→en revisado por químico, mais um processo
em produção ou uma dependência de terceiro. **Destranca se** a sessão disser "corrija o nome do
meu aluno" — e aí a primeira entrega é a metade grátis: missão com alvo dado por nome, que o
professor já consegue criar hoje cobrando "é exatamente esta molécula".

**(c) Integrar motor de terceiro** (estrutura → nome). Candidato realista único: `openclatura`
0.3.1, MIT, determinístico, sobre o RDKit, como microsserviço Python ao lado do Next.js. Custo: um
serviço a mais em toda instância para sempre — inclusive no self-host, que passaria a ser dois
containers e não um —, **mais** a localização pt-BR, que é o trabalho de verdade. Risco: beta
0.3.1 de um laboratório só; inglês; chamada de rede por nome. Obriga para sempre: **só mostrar
nome que a verificação confirmou** — e ativar o `verify_with_opsin` puxa o OPSIN, o Java e a LGPL
junto, que o D-28 deixa de fora. A favor, e é o argumento forte: o `NameAnalysis` devolve o nome
**em pedaços**, com índices de átomo que casam com o grafo — daria para acender no desenho a
parte que corresponde a cada pedaço do nome, a mesma ideia do "átomo aceso é um só" (D-18).
**Destranca se** os três gatilhos do D-15 forem satisfeitos, nesta ordem: sessão → químico
marcando nome a nome → pt-BR determinístico.

**(d) Faixa restrita** — nomear só o que dá para garantir e calar no resto. Risco: a fronteira é
invisível ao usuário, e a faixa **cresce**. Com o round-trip do `openclatura`, a faixa não
precisa ser escrita à mão — pode ser "tudo que a verificação confirmou". Na prática isto não é
caminho separado: é o (c) feito direito.

**(e) Nomear só o conteúdo curado, em tempo de build.** Rodar o motor uma vez sobre o catálogo,
um químico conferir nome a nome, e o resultado entrar como **dado**. Custo zero em produção:
nenhum serviço, funciona offline e no celular fraco. Risco: só responde dentro da missão, e o
professor vai desenhar fora da lista. Obriga para sempre: revisão humana a cada mudança do
catálogo — e agora o catálogo tem missão de professor (D-27), que ninguém revisa. **E isto não é
nomear, é catálogo** — a diferença precisa estar dita na tela. **Destranca se** a sessão disser
"nomeie o que eu desenhei" **e** o professor aceitar que o produto responda só dentro da trilha.

**Vetado, e o motivo já está escrito.** Qualquer motor **neural** de nomenclatura, incluindo o
STOUT (MIT): 83,52% a 89,86% de acerto medidos pelos próprios autores é o mesmo perfil que o
`CLAUDE.md` usa para vetar o LLM. `chem-dl-iupac` (AGPL-3.0) e `iupac-to-structure` (GPL-3.0) caem
pela licença (D-28); `smiles2iupac` e o fork em espanhol do OPSIN não têm licença nenhuma. O
ChemDoodle é proprietário — não se redistribui num repositório MIT — e ainda depende do servidor
da iChemLabs a cada chamada.

## Duas dívidas menores que a nomenclatura deixou

- **Lista de nomes triviais de composto.** Hoje o `checkName` aceita `aspirina`, `cafeina` e
  `anilina` como apelido. **É dado de química**: ou vem de fonte revisada por químico, ou não vem
  — inventar a lista aqui seria o kernel próprio outra vez (D-02). Só entra se a revisão da Fase 3
  mostrar que a colisão incomoda de verdade. Até lá quem carrega o peso é a atribuição de autoria:
  "batizada por Camila" ao lado do apelido.
- **`condense_abbreviations` do RDKit.** Produz rótulos como `CO2Et`, que o aluno lê como nome. Não
  está ligado em lugar nenhum do produto. Se alguém ligar, esses rótulos caem sob a regra do D-15
  e precisam de origem dita na tela.

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
— seta sem número — é exatamente a que serve para a aula dele.

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
   quimicamente e o mais caro em infraestrutura; muda o `prebuild`, a imagem Docker e o
   `docs/INSTALACAO.md`.
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
  a água é polar e o CO₂ não", a seta basta.

## Listas e catálogo — o que ficou de fora (D-25, D-26, D-27)

As listas da turma, a missão criada desenhando a resposta e o catálogo compartilhado existem
(`docs/ROTEIROS.md`). O que ficou fora, e por quê:

- **Prazo de entrega** — traz fuso, atraso e nota parcial; a pergunta do quadro é onde a turma
  parou, não quem entregou a tempo (D-22).
- **Nota que vira nota escolar, exportação, CSV, boletim** — promessa pedagógica que escola
  nenhuma pediu ainda. Pergunta da Fase 3.
- **Copiar lista entre turmas do mesmo professor** — corte de escopo puro, e o mais provável de
  voltar cedo: é a primeira coisa que um professor com duas turmas vai pedir.
- **Missão com mais de uma resposta certa** (composição de `some`) — exigiria um editor de
  condição, que é o que o D-25 existe para não construir. Já existe caminho: cobrar grupo e
  contagem em vez de InChIKey aceita muitas respostas, e a tela de autoria diz isso.
- **Cadeado entre itens** — Classroom e Khan também não trancam por padrão; missão que só abre
  depois de outra quebra a aula de quem quer começar por onde quer.
- **Tempo por item e número de tentativas no quadro** — `Attempt.elapsedMs` e a contagem de linhas
  já existem, e a grade por item convida a mostrá-los. Três estados por célula, e ponto. Passar
  disso é o D-22 virando boletim sem ninguém ter decidido.
- **Grafo de conceitos (`teaches`/`requires`).** Cada missão declararia o que ensina e o que
  pressupõe, em conceitos da disciplina; a ordem sugerida derivaria do grafo em vez de ser fixada
  à mão, e `difficulty` viraria consequência. Entra como **sugestão, nunca como cadeado**. Espera
  o plano de ensino do Idelcio: a lista de conceitos e a ordem deles não deveriam sair da nossa
  cabeça — é pedir o plano, transcrever, e comparar com as 15 missões; o que sobra e o que falta
  aparece sozinho.
- **Tour de primeira visita.** Missão verifica molécula, não gesto (D-01): "gire a molécula",
  "organize o desenho" e "veja um modo de vibração" não mudam o grafo e não podem ser objetivo.
  O que cabe são **missões de tour** — missões de química escritas para que cumprir o objetivo
  obrigue a descobrir uma ferramenta (dupla, heteroátomo, cunha, seleção) — e um **roteiro de
  primeira visita** para o que não é química, como lista de conferência sem nota nem tique. Só
  depois das sessões de observação: onde o usuário novo trava é dado que só a sessão dá.
- **Tela de moderação de denúncia.** Hoje a denúncia (D-27) grava quem, quando e o motivo, e
  retirar do catálogo é ação do próprio professor ou de quem administra, por script. Vira tela na
  primeira denúncia real que chegar sem ninguém para ler.
- **Como o Idelcio chama isso.** "Lista" foi decidido pela medição do `researcher` (D-26). Se a
  sessão mostrar outra palavra na boca dele, troca-se `apps/web/app/turmas/messages.ts` e nada
  mais.

## Dívida da entrega de listas

- **Tetos em memória** (`apps/web/app/actions/assignment.ts` — salvamentos de autoria por dia,
  conferências por minuto; `apps/web/app/actions/classroom.ts` — códigos errados por hora) —
  persistir quando houver mais de um processo do app. Com um container só, como o
  `docker-compose.yml` sobe, está correto; reiniciar o container zera a contagem, o que é
  aceitável para um teto de abuso e inaceitável para uma cota de cobrança — e cobrança não existe.

## O RDKit do servidor segura o laço de eventos

**Medido em 12 de setembro de 2026, na suíte de ponta a ponta.** `saveAttempt`, `checkQuest` e a
página pública de molécula rodam o RDKit dentro do processo do Next, e WebAssembly não devolve o
laço de eventos enquanto calcula. Logo, **pedido de química no servidor não corre em paralelo**:
ele entra na fila, e enquanto ele calcula o processo não serve mais nada — nem outra ação, nem
uma página.

O que isso custou até agora foi teste, duas vezes. Com quatro navegadores em paralelo, a fila passou
de um minuto e derrubou o teste das listas; a suíte caiu para dois trabalhadores e voltou a passar.
Em **18 de setembro de 2026** o mesmo teste caiu de novo, agora só no CI: o runner tem dois núcleos,
os dois trabalhadores rodam o mesmo caminho pesado ao mesmo tempo — desktop e celular — e ele levou
2m12s contra 7,5 s sozinho nesta máquina. O bcrypt em custo 12 de cada login disputa o mesmo núcleo.
As correções foram três, e nenhuma delas mexeu no produto: o orçamento do teste subiu para sete
minutos, a espera interna da contagem voltou para um minuto (duas tornavam a falha pior, porque ela
consumia o orçamento e o teste morria num passo posterior, longe da causa), e os caminhos de papel
viraram testes curtos em vez de um caminho longo.

**Um trabalhador só não é saída.** Medido nesta máquina: a suíte inteira em série passa de vinte
minutos, contra 1,4 min com quatro. No CI seria bem pior que os dezoito minutos que a suíte gasta
hoje com dois trabalhadores.

O que isso pode custar numa aula: trinta alunos cumprindo a mesma missão no mesmo minuto são
trinta análises enfileiradas. Cada uma é de dezenas a poucas centenas de milissegundos, então a
espera é de segundos, não de minutos — mas ela existe, e cresce com o tamanho da molécula.

**Não entra agora, e as saídas conhecidas são estas**, em ordem de custo:

- **Medir antes de mexer.** Ninguém cronometrou `analyzeOnServer` com molécula de aula sob carga
  real. Sem esse número, qualquer das saídas abaixo é chute com forma de engenharia.
- **Tirar o RDKit do laço**, num `worker_threads` dentro do próprio processo. É a correção certa
  e cabe no self-host de um container só.
- **Mais de um processo do app.** Resolve a fila e quebra os tetos em memória
  (`assignment.ts`, `classroom.ts`), que viram tabela no mesmo dia — está anotado logo acima.

**Revisar se** um professor relatar espera ao fim da aula, ou se a instância no ar mostrar
requisição lenta com mais de uma turma ativa.

## Sobras da leitura de 12 de setembro de 2026

Duas revisões leram o repositório inteiro com os olhos de quem chega nele pela primeira vez. O
que era defeito foi corrigido; o que segue é o que foi visto, medido e deixado de propósito.

- **A paleta do teste de chama não pinta nada.** `--flame-litio`, `--flame-sodio` e as outras
  cinco existem só para alimentar `--cat-1`…`--cat-7`, e nenhum arquivo usa `--cat-*`: o produto
  ainda não tem gráfico. `--t-fold`, `--t-slow` e `--track-flat` também estão sem consumidor. São
  a narrativa de marca do `DESIGN-SYSTEM.md`, então apagá-las é decisão do `ui-ux`, não limpeza —
  e o primeiro gráfico do produto decide se elas ficam como estão ou mudam.
- **`assignment.ts` tem 1594 linhas e três assuntos.** Lista e item, missão de professor, e
  catálogo com denúncia. O corte já está desenhado: `actions/teacher-quest.ts`,
  `actions/catalog.ts`, `checkQuest` indo para `attempt.ts` junto do irmão `saveAttempt`,
  `lib/text.ts` para as regras R-13 e R-14, e `lib/rate-limit.ts` para a janela em memória que
  hoje está escrita três vezes igual. Não entra agora porque mover trinta exports de uma vez
  atravessa a entrega inteira das listas; entra na próxima mudança que já mexer nesses arquivos.
- **`Editor2D.tsx` tem 1453 linhas.** Dois pedaços saem sem tocar no DOM: a construção do menu
  de contexto (`entriesFor`, `selectionEntries`, `commonElementOf` e as constantes de carga,
  ordem e cunha) e o texto de dica (`hintFor`, `selectionCount`, `selectedWord`). Os dois viram
  função pura testável em linha de comando. `render.ts`, com 641 linhas, **não** entra: é uma
  responsabilidade só, na ordem em que a cena é pintada.
- **`questsOfTrack` existe e ninguém usa.** Duas telas filtram o catálogo à mão e perdem a
  ordenação por dificuldade que a função do motor faz. Trocar é de uma linha em cada lugar; o que
  falta é decidir se a ordem por dificuldade é a que as telas querem.
- **Identificador de teste em português.** São 142, todos em pt-BR, contra uma regra escrita que
  manda chave de dado em inglês. Trocar mexe em cada `data-testid` e em cada teste que o procura,
  sem nada mudar para quem usa o produto. A saída barata é a regra dizer que identificador de
  teste é a exceção, e é isso que o `ui-ux` decide.

## Self-host — o que ficou de fora (D-28)

- **Imagem para `arm64`.** A imagem é `amd64`. Raspberry Pi e Mac com Apple Silicon constroem
  localmente com `docker compose up -d --build`, que funciona e demora; publicar as duas
  arquiteturas é um `platforms:` no `image.yml` e o dobro do tempo de CI.
- **Proxy com TLS dentro do compose.** Hoje o `docs/INSTALACAO.md` mostra o Caddy por fora.
  Entraria como perfil opcional do compose, com o domínio numa variável. Espera a primeira
  escola que instale e peça.
- **Exportar e importar entre instâncias.** Cada self-host é um mundo próprio, com os seus
  apelidos e o seu catálogo (D-28). Uma escola que migre da instância no ar para a própria leva o
  progresso dos alunos como? Hoje, não leva. É pergunta de escola, e nenhuma perguntou.
- **Umami dentro do compose.** Telemetria é opt-in e quem liga sobe o próprio Umami. Um perfil
  do compose com ele pronto deixaria a opção mais barata — e a decisão de ligar continua sendo
  de quem hospeda.
- **Imagem mais leve.** A linha de comando do Prisma pesa perto de 250 MB dentro da imagem e só
  serve para `prisma migrate deploy` na subida; ela exige ao carregar os módulos do
  `prisma studio` e do `prisma dev`, então não dá para podar (medido em 11/09/2026: podar
  quebrou a migração em `effect` e em `@prisma/studio-core`). As saídas seriam aplicar as
  migrações por outro caminho ou esperar o Prisma separar a CLI. Entra quando alguém reclamar do
  tamanho — a imagem inteira fica abaixo de 1 GB e sobe em segundos.

## Papéis da escola — o que ficou de fora (D-29)

O D-29 delegou **um** degrau: um administrador, criado no terminal, promove os professores da
própria escola. Quatro coisas ficaram deliberadamente fora, e a decisão diz por quê.

- **Escola verificada.** `Profile.institution` é um texto que a própria pessoa digita no cadastro,
  ninguém confere, e não existe tela para mudá-lo. Numa instância com mais de uma escola — a que
  fica no ar — as escolas convivem separadas só por esse texto, e um administrador alcança quem
  digitou o mesmo. O que segura isso hoje é uma pessoa conferindo o nome antes de confirmar, e o
  rastro dizendo quem confirmou. Entra quando a instância no ar tiver duas escolas de verdade
  usando; aí o recorte precisa ser uma entidade, não uma string, e o caminho provável é o professor
  entrar na escola por código, como o aluno entra na turma.
- **Escrever a escola de uma conta pela tela**, inclusive a que está em branco. Só o terminal faz
  isso, com `--escola`. A primeira versão do D-29 preenchia a escola vazia na promoção, para resolver
  o caso de quem passou o campo no cadastro; a auditoria mostrou que isso dava a qualquer
  administrador alcance sobre toda conta em branco da instância, e a tomada de conta que vinha
  depois. Mudar a escola de uma conta **é** mudar quem a alcança, então nenhuma tela faz. Quem
  digitou a escola errada no cadastro depende de quem tem o servidor.
- **Convite por código para o professor**, em vez de promoção direta. Seria consistente com os
  outros dois fluxos do produto e a pessoa consentiria em vez de ser promovida. Custa tabela,
  validade e uma tela de resgate para resolver o que a confirmação pelo nome já resolve. Entra no
  dia em que o administrador não souber os e-mails de quem vai dar aula.
- **Tela para ver o histórico de papéis.** `RoleChange` guarda toda mudança, e a lista de
  `Professores da escola` mostra só a última de cada conta. O histórico inteiro sai por SQL, para
  quem tem o servidor. Entra se uma escola pedir auditoria de verdade.

## Considerado e adiado

- [ ] Comparar dois análogos lado a lado — é para o usuário avançado, e faz parte da trilha de
      pesquisa (acima)
- [ ] Modo apresentação para o professor projetar sem a interface de edição
- [ ] Retrossíntese e previsão de reação — precisa de modelo em servidor com GPU, e é o que o
      produto promete não fazer
- [ ] Docking com proteína — servidor pesado, e cria expectativa de afirmação biológica
- [ ] DFT / química quântica — impossível no navegador
- [ ] Campanhas abertas da comunidade — depende de massa crítica e de moderação, que não existe
- [ ] Edição colaborativa em tempo real
- [ ] App nativo
- [ ] Espectros simulados (RMN, IV) — tentador, mas é outro produto

## Ideias soltas

_(anote aqui e siga em frente)_
