# Rotamer

Editor de moléculas na web: desenha-se a estrutura em 2D e a geometria 3D aparece no mesmo
instante — dobrando-se até encontrar a forma e depois vibrando sob dinâmica molecular.
Química orgânica e medicinal no mesmo motor, para estudantes e pesquisadores.

Contexto completo em `README.md`. Quando precisar de profundidade, leia sob demanda:
`docs/ORIGEM.md` (como a ideia nasceu e o que cada erro ensinou) · `docs/PITCH.md` (produto e
negócio) · `docs/DECISOES.md` (o porquê de cada escolha) ·
`docs/ARQUITETURA.md` · `docs/DESIGN-SYSTEM.md` · `docs/ROADMAP.md`.
Ideia fora de escopo vai para `DEPOIS.md`, não para o código.

<!-- Referências em crase de propósito: com @ elas seriam importadas em toda sessão e
     consumiriam contexto à toa. Assim o Claude lê só quando precisa. -->

**Este é um produto proprietário e fechado.** Toda dependência precisa de licença que permita
uso comercial em software fechado — BSD, MIT, Apache-2.0. **Nunca adicione dependência GPL ou
AGPL** sem levantar a questão antes; ela contamina o produto inteiro. Atribuições obrigatórias
ficam em `docs/TERCEIROS.md`.

## Para quem é

**Ferramenta de ensino de química orgânica.** O usuário é o aluno; o comprador é a escola. O
pesquisador é usuário avançado, não cliente — ver `docs/DECISOES.md` D-09.

Consequências ao escrever qualquer interface ou texto:

- Linguagem de missão, pontuação e progresso é para as trilhas Estrutura, Geometria e
  Propriedade. **Na trilha Otimização não use missão, tique, contador nem conquista** — ali é
  ferramenta livre, e gamificação lida como brinquedo afasta o usuário avançado.
- Escreva para quem está aprendendo: o erro explica a química, não o código.
- **Educação não autoriza imprecisão.** Professor de química é químico. Um erro no app não
  confunde um usuário, confunde uma sala inteira. As regras D-01 e D-02 valem igual ou mais.

## Este repositório é um ponto de partida

O que está documentado aqui é o **primeiro modelo** do produto, escrito antes do código de
produção existir. O sistema final será maior e diferente. Trate estes documentos como intenção
e contexto, não como especificação congelada:

- Quando a realidade contrariar um documento, **diga isso** em vez de forçar o código a caber
  no texto.
- Decisão revista se registra em `docs/DECISOES.md`, sem apagar a anterior — o histórico do que
  não deu certo vale mais que o texto limpo.
- A única coisa que não se negocia por conveniência é a regra abaixo.

## A regra que não se quebra

**O núcleo determinístico decide. A IA explica.**

- Validade, valência, fórmula, massa, SMILES, InChIKey, TPSA, logP, anéis, rotacionáveis,
  aromaticidade, nota de missão → **sempre RDKit ou o motor de missões. Nunca o LLM.**
- Por que falhou, o que trocar, se parece sintetizável → LLM, lendo os números já calculados,
  sempre marcado como hipótese na interface.
- O prompt do tutor recebe os descritores prontos e é instruído a nunca recalcular nem contradizer.
- Saída do LLM em JSON de schema fechado, sem nenhum campo numérico.
- Todo bloco de análise na tela carrega indicador de origem: verde = calculado, âmbar = gerado.

Um LLM acerta 90% das perguntas de valência e nos outros 10% produz uma explicação confiante e
errada. Com aluno passa; com químico encerra o produto.

## Arquitetura

Monorepo Turborepo. **Regra de dependência: `core` não depende de ninguém, e ninguém depende de
`editor2d`.** O núcleo roda em teste de linha de comando, sem navegador.

```
apps/web        Next.js 16 App Router — rotas, contas, API
packages/core       grafo · RDKit worker · geometria · descritores
packages/editor2d   canvas 2D próprio, ferramentas, histórico
packages/viewer3d   Three.js · dobramento e dinâmica molecular
packages/quests     missões declarativas e pontuação
packages/ui         tokens e componentes
```

**O grafo é a única fonte de verdade.** Fórmula, descritores, coordenadas 3D, nota e texto do
tutor são derivados dele e recalculáveis. Nada além do grafo é persistido como estado do usuário.

## Stack

- Next.js 16 (App Router) + TypeScript estrito
- RDKit.js (WASM) em Web Worker via Comlink — toda pergunta química
- OpenChemLib no mesmo worker — conformação 3D e MMFF94, depois que o RDKit aprovou (D-10)
- Three.js + React Three Fiber — apenas render, nenhuma química dentro
- Canvas 2D próprio + Zustand — o editor é escrito à mão, sem lib de desenho molecular
- Postgres + Prisma no próprio servidor — container em desenvolvimento, serviço no VPS (D-11)
- Gemini via rota de servidor para o tutor

## Convenções

- **Idioma:** toda a interface e as mensagens de erro em pt-BR. Erro explica a química, não o
  código: "O átomo de C tem 5 ligações, mas suporta no máximo 4", nunca "valence error".
- **Código em inglês, texto em português.** Nome de arquivo, pasta, variável, função, tipo,
  classe de CSS e chave de dado: **sempre em inglês**. Comentário, JSDoc, nome de teste, string
  de interface e mensagem de erro: **sempre em pt-BR**. `analyze(input)` devolvendo
  "Não há nenhum átomo para analisar." é o padrão da casa.
- **Números:** sempre `font-variant-numeric: tabular-nums`. Fórmulas moleculares em mono com
  subscrito real, nunca `C6H6` em texto corrido.
- **Cores CPK são reservadas aos átomos.** Nenhum botão, link, borda ou estado semântico pode usar
  cor CPK. Se a interface pinta de vermelho, o vermelho deixa de significar oxigênio. O acento da
  marca é turquesa justamente porque nenhum elemento comum é turquesa no CPK.
- **Tokens:** toda cor, espaço, raio e duração vem de `packages/ui/src/tokens.css`. Nenhum hex
  solto no código.
- **Tipografia:** Archivo (display), IBM Plex Sans (interface), IBM Plex Mono (dados).
- **Temas:** claro e escuro sempre juntos. Nenhuma cor pode ser definida apenas dentro de um
  bloco `@media (prefers-color-scheme)` ou `[data-theme]`.
- **Movimento:** `prefers-reduced-motion` desliga dobramento e vibração e vai direto à geometria
  final.

## Desempenho — restrições, não sugestões

- Sanitização, descritores e conformação **sempre** no worker. A thread principal só desenha.
- Debounce por intenção: métricas a cada 120 ms de silêncio; geometria 3D apenas quando a
  topologia muda, nunca quando um átomo é arrastado.
- Cache por InChIKey — conformação e descritores são função pura do grafo.
- O WASM do RDKit carrega **depois** da primeira pintura. Meta: primeiro desenho interativo em
  menos de 3 s num celular fraco em 3G. Escola pública é o caso de uso, não o caso extremo.

## Fora de escopo no MVP

Não implemente sem conversar antes: retrossíntese ou previsão de reação, docking, DFT,
campanhas abertas da comunidade, edição colaborativa em tempo real, app nativo.

Estereoquímica com cunhas e traços fica para a v0.2 — é a primeira coisa que um químico vai
pedir e merece ser feita direito.

## Nunca afirme

- Que o sistema previu o produto de uma reação.
- Que uma molécula tem atividade biológica. Descritores são descritores.
- Que o Rotamer substitui PyMOL, ChemDraw ou Maestro.

## Comandos

```
pnpm dev          # app em desenvolvimento (Turborepo)
pnpm build        # build de produção
pnpm test         # Vitest — core roda sem navegador
pnpm test:e2e     # Playwright (desktop e celular)
pnpm lint
pnpm typecheck
```

O RDKit compilado é copiado de `node_modules` para `apps/web/public/chem/` nos passos
`predev`/`prebuild`. Não versione essa pasta e não edite os arquivos dela à mão.

## Casos de teste que precisam continuar passando

Estes são os valores que o **RDKit** calcula, verificados em
`packages/core/test/molecules.test.ts`:

| Molécula | Fórmula | Massa | TPSA | Nota |
|---|---|---|---|---|
| Etanol | C2H6O | 46,07 | 20,23 | álcool |
| Ácido acético | C2H4O2 | 60,05 | 37,30 | ácido carboxílico |
| Benzeno | C6H6 | 78,11 | 0 | hexágono regular, 120°, plano |
| Paracetamol | C8H9NO2 | 151,16 | 49,33 | amida + fenol + aromático |
| Aspirina | C9H8O4 | 180,16 | 63,60 | ácido + éster + aromático, **2** rotacionáveis |
| Cafeína | C8H10N4O2 | 194,19 | **61,82** | **imidazol precisa ser aromático** |

A cafeína é o caso que o protótipo errava com kernel próprio: o anel de cinco com nitrogênio é
aromático de verdade e um detector caseiro não pega. Com RDKit tem que passar.

**Onde o RDKit diverge do PubChem, o RDKit ganha** — é a mesma regra do D-01 aplicada a
número de tabela:

- **TPSA da cafeína:** PubChem publica 58,44 Å²; o RDKit calcula 61,82 Å². A diferença vem da
  percepção de aromaticidade, que muda a contribuição dos nitrogênios na soma de Ertl.
- **Rotacionáveis da aspirina:** PubChem conta 3; o RDKit, na definição estrita, conta 2 — a
  ligação do éster não entra. Cada um está certo dentro da própria definição.

A interface mostra o valor do RDKit e diz de quem é a definição. Nunca ajuste o cálculo para
bater com tabela de terceiro.

## Ao trabalhar aqui

- Nunca contorne o RDKit para "resolver rápido" uma pergunta química.
- Ao criar uma cor, um espaçamento ou uma duração, adicione nos tokens primeiro.
- Antes de instalar qualquer pacote, verifique a licença. GPL e AGPL estão vetadas.
- Toda ideia nova que não estiver no escopo do MVP vai para `DEPOIS.md`, não para o código.
  Escopo estourando é o risco número um deste projeto.
