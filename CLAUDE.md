# Rotamer

Editor de moléculas na web: desenha-se a estrutura em 2D e a geometria 3D aparece no mesmo
instante — dobrando-se até encontrar a forma e depois vibrando sob dinâmica molecular.
Química orgânica para quem ensina e para quem aprende. **Código aberto, licença MIT, sem
comercialização** (D-28): existe uma instância no ar mantida pelo autor, e qualquer pessoa pode
subir a sua com Docker.

Contexto completo em `README.md`. Quando precisar de profundidade, leia sob demanda:
`docs/ORIGEM.md` (como a ideia nasceu e o que cada erro ensinou) · `docs/PITCH.md` (por que o
produto existe) · `docs/DECISOES.md` (o porquê de cada escolha, inclusive as revogadas) ·
`docs/ARQUITETURA.md` · `docs/DESIGN-SYSTEM.md` · `docs/IDIOMAS.md` (pt-BR e inglês, ponta a
ponta) · `docs/ROADMAP.md` · `docs/ROTEIROS.md` (as listas da turma) · `docs/GUIA.md` (o produto
tela a tela) · `docs/INSTALACAO.md` (o self-host) ·
`CONTRIBUTING.md` (o caminho de quem mexe no código). Ideia fora de escopo vai para
`docs/FORA-DE-ESCOPO.md`, não para o código.

## Licença e dependências

O Rotamer é MIT. Toda dependência precisa de licença **compatível com o MIT em redistribuição**:
MIT, BSD, Apache-2.0, ISC. **GPL, LGPL e AGPL não entram** sem conversa antes — imporiam a quem
redistribui o Rotamer obrigações que a nossa licença não impõe. Atribuições exigidas por
dependências ficam em `docs/TERCEIROS.md`.

## Para quem é

**Ferramenta de ensino de química orgânica.** O aluno usa; o professor decide o que entra na
aula; o pesquisador é bem-vindo como usuário avançado (D-09, afrouxado pelo D-28). Não há
cliente: não existe camada paga, nem funcionalidade guardada para uma.

Consequências ao escrever qualquer interface ou texto:

- Linguagem de missão, pontuação e progresso é para as trilhas Estrutura, Geometria e
  Propriedade. **Na trilha Otimização não use missão, tique, contador nem conquista** — ali é
  ferramenta livre, e gamificação lida como brinquedo afasta o usuário avançado.
- Escreva para quem está aprendendo: o erro explica a química, não o código.
- **Educação não autoriza imprecisão.** Professor de química é químico. Um erro no app não
  confunde um usuário, confunde uma sala inteira.

## Documento descreve o que existe

O que está em `docs/` começou como intenção, antes do código; hoje descreve o produto que
existe. Quando um documento e o código discordarem, **o documento está errado** — corrija-o, e
diga isso. Documento desatualizado se atualiza; regra morta se remove; comentário que só repete o
que a linha faz se apaga.

A exceção deliberada é `docs/DECISOES.md`: é o registro do que foi decidido e desfeito. Decisão
revogada fica lá, marcada como revogada, nunca apagada — saber o que foi tentado e por que não
deu vale mais do que o texto limpo.

**Todo documento para leitor tem gêmeo em inglês** (D-30): `X.md` da raiz ao lado de `X.en.md`, e
cada `docs/…` com um gêmeo de **nome em inglês** em `docs/en/` (`GUIA.md` → `USER-GUIDE.md`; a
tabela está em `docs/IDIOMAS.md`). Documento alterado atualiza o gêmeo **na mesma entrega** — o
gêmeo começa com `<!-- source: … · sha256:… -->`, e `packages/i18n/test/docs.test.ts` falha
enquanto o hash não bater com o original ou os títulos não tiverem a mesma estrutura. Este arquivo,
`AGENTS.md` e `.claude/` são instrução de ferramenta e ficam só em português.

## A regra que não se quebra

**O núcleo determinístico decide. A IA explica.**

- Validade, valência, fórmula, massa, SMILES, InChIKey, TPSA, logP, anéis, rotacionáveis,
  aromaticidade, frequência de modo normal, nota de missão → **sempre RDKit, o campo de força ou o
  motor de missões. Nunca o LLM.**
- Por que falhou, o que trocar → LLM, lendo os números já calculados, sempre marcado como hipótese
  na interface.
- O prompt do tutor recebe os descritores prontos e é instruído a nunca recalcular nem contradizer.
- Saída do LLM em JSON de schema fechado, sem nenhum campo numérico.
- Todo bloco de análise na tela carrega indicador de origem: verde = calculado, âmbar = gerado.

Um LLM acerta 90% das perguntas de valência e nos outros 10% produz uma explicação confiante e
errada. Com aluno passa; com químico encerra o produto.

## Arquitetura

Monorepo Turborepo. **Regra de dependência: `core` não depende de ninguém, e ninguém depende de
`editor2d`.** O núcleo roda em teste de linha de comando, sem navegador.

```
apps/web        Next.js 16 App Router — rotas, contas, turmas, listas, tutor
packages/core       grafo · RDKit worker · geometria · descritores · modos normais
packages/i18n       os dois idiomas: dicionário tipado, formatação, frase da química
packages/editor2d   canvas 2D próprio, ferramentas, seleção, histórico
packages/viewer3d   Three.js · dobramento e dinâmica molecular
packages/quests     missões declarativas, extração de objetivos e pontuação
packages/ui         tokens e componentes
```

**O átomo aceso é um só nas duas telas.** Cada átomo da geometria carrega `source`, o índice do
átomo do grafo que o originou; hidrogênio acrescentado pelo campo de força aponta para o vizinho
(D-18). É o que liga o vértice do desenho à esfera da cena.

**O grafo é a única fonte de verdade.** Fórmula, descritores, coordenadas 3D, nota e texto do
tutor são derivados dele e recalculáveis. O que se persiste como estado do usuário é o grafo
(molblock) e o que ele produziu — tentativas, listas, apelidos.

**O servidor não confia no cliente.** O navegador manda o desenho, nunca o veredito: nota de
missão é reavaliada no servidor, toda entrada passa por schema, dono é sempre conferido.

## Stack

- Next.js 16 (App Router) + TypeScript estrito (`exactOptionalPropertyTypes`,
  `noUncheckedIndexedAccess`)
- RDKit.js (WASM) em Web Worker via Comlink — toda pergunta química; também no servidor, para
  a página pública e para reavaliar o que o cliente mandou
- OpenChemLib no mesmo worker — conformação 3D e MMFF94, depois que o RDKit aprovou (D-10)
- Vibração por velocity-Verlet sobre o gradiente numérico do MMFF94, a 300 K (D-14)
- Modos normais por Hessiana numérica do MMFF94, com projeção do corpo rígido — 3N−6, ou 3N−5
  quando linear (D-20)
- Three.js + React Three Fiber — apenas render, nenhuma química dentro
- Canvas 2D próprio + Zustand — o editor é escrito à mão, sem lib de desenho molecular
- Postgres + Prisma — container em desenvolvimento, no self-host e na instância no ar, que roda
  a mesma imagem (D-11)
- Gemini via rota de servidor para o tutor — opcional: sem chave, o tutor se desliga e o produto
  continua inteiro

## Convenções

- **Idioma:** o produto fala **pt-BR e inglês**, e pt-BR é o padrão. Toda interface e toda
  mensagem de erro existem **nos dois**. Erro explica a química, não o código: "O átomo de C tem
  5 ligações, mas suporta no máximo 4", nunca "valence error". O contrato inteiro — onde o texto
  mora, como se lê, o que não se traduz — está em `docs/IDIOMAS.md` (D-30).
- **Funcionalidade nova chega traduzida, ou não chega.** Não é etiqueta de revisão: o texto se
  declara com `dictionary({ 'pt-BR': …, en: … })`, o tipo do inglês é inferido do português, e
  **chave sem par não compila**. Quem escreve a tela escreve as duas frases na mesma entrega.
- **Código em inglês, texto nos dois.** Nome de arquivo, pasta, variável, função, tipo, classe de
  CSS e chave de dado: **sempre em inglês**. Comentário, JSDoc e nome de teste: **sempre em
  pt-BR**. String de interface e mensagem de erro: **pt-BR e inglês, lado a lado**, no
  `messages.ts` ao lado de quem as usa.
- **O núcleo não fala idioma nenhum.** `core` não depende de ninguém, nem de `@rotamer/i18n`:
  ele devolve **código** de recusa (`valence_exceeded`) com os números que a justificam, e
  `chemistryErrorText` monta a frase. Mesma regra para nome de grupo funcional.
- **Comentário explica por quê.** Nome de teste diz o que protege. Nada de referência a rodada de
  revisão, número de achado ou conversa que gerou a mudança — quem lê daqui a um ano não estava lá.
- **Números:** sempre `font-variant-numeric: tabular-nums`. Fórmulas moleculares em mono com
  subscrito real e carga em expoente, nunca `C6H6` em texto corrido.
- **Cores CPK são reservadas aos átomos.** Nenhum botão, link, borda ou estado semântico pode usar
  cor CPK. Se a interface pinta de vermelho, o vermelho deixa de significar oxigênio. Os 118
  elementos estão em `packages/ui/src/cpk.css`, em dois conjuntos: `--cpk-*` é a esfera desenhada,
  e `--cpk-ink-*` é a mesma cor legível contra a superfície, para quando o elemento aparece escrito
  (D-17). O símbolo pode ser colorido — ele *é* o átomo; o fundo e a borda do botão, nunca.
- **Tokens:** toda cor, espaço, raio e duração vem de `packages/ui/src/tokens.css`. Nenhum hex
  solto no código.
- **Tipografia:** Archivo (display), IBM Plex Sans (interface), IBM Plex Mono (dados).
- **Temas:** claro e escuro sempre juntos. Nenhuma cor pode ser definida apenas dentro de um
  bloco `@media (prefers-color-scheme)` ou `[data-theme]`.
- **Movimento:** `prefers-reduced-motion` desliga dobramento e vibração e vai direto à geometria
  final.
- **Atalhos** valem na página inteira, menos em campo de texto e com folha modal aberta.
  A tabela mora em `packages/editor2d/src/keys.ts`, e é dela que saem o comportamento, o
  selo do botão e a folha de ajuda — os três liam cópias próprias, e a ajuda já prometia
  tecla que o teclado não fazia. Letra de elemento não divide tecla com ferramenta.

## Desempenho — restrições, não sugestões

- Sanitização, descritores e conformação **sempre** no worker. A thread principal só desenha.
- Debounce por intenção: métricas a cada 120 ms de silêncio; geometria 3D apenas quando a
  topologia muda, nunca quando um átomo é arrastado.
- Cache por InChIKey — conformação e descritores são função pura do grafo.
- O WASM do RDKit carrega **depois** da primeira pintura. Meta: primeiro desenho interativo em
  menos de 3 s num celular fraco em 3G. Escola pública é o caso de uso, não o caso extremo.

## Fora de escopo

Não implemente sem conversar antes: retrossíntese ou previsão de reação, docking, DFT, edição
colaborativa em tempo real, app nativo, nomenclatura IUPAC (D-15: o produto não nomeia, deixa
batizar).

**Estereoquímica existe** (D-21): cunha e traço no editor, `wedge` no grafo, molblock V2000 com a
coluna de estereoquímica, e `R`/`S`/`E`/`Z` atribuídos pelo RDKit. Nunca calcule prioridade CIP à
mão — é a mesma regra do D-01, e o erro sairia silencioso.

## Nunca afirme

- Que o sistema previu o produto de uma reação.
- Que uma molécula tem atividade biológica. Descritores são descritores.
- Que o Rotamer substitui PyMOL, ChemDraw ou Maestro.
- Que o Rotamer nomeia compostos. Ele deixa batizar, que é autoria de apelido.

## O time de agentes

Nove papéis vivem em `.claude/agents/`, um arquivo cada: `pm`, `ui-ux`, `frontend`, `backend`,
`security`, `deploy`, `researcher`, `marketing` e `reviewer`. O `README.md` de lá diz quando
chamar cada um e como eles conversam. O caminho normal de uma entrega é `pm` → especialista →
`reviewer`; o `researcher` entra onde faltar informação; o `marketing` fala para fora; e o
`reviewer` tem veto sobre a regra que não se quebra. Nenhum desses arquivos substitui este.

## Comandos

```
docker compose up -d postgres   # só o banco de desenvolvimento
pnpm dev          # app em desenvolvimento (Turborepo)
pnpm build        # build de produção
pnpm test         # Vitest — o núcleo roda sem navegador; os testes de ação pedem Postgres
pnpm test:e2e     # Playwright (desktop e celular)
pnpm lint
pnpm typecheck
docker compose up -d            # a instância inteira, app e banco, como quem faz self-host
```

O RDKit compilado é copiado de `node_modules` para `apps/web/public/chem/` nos passos
`predev`/`prebuild`. Não versione essa pasta e não edite os arquivos dela à mão. Os testes de ação
(`apps/web/app/actions/*.test.ts`) falam com o Postgres do `docker-compose.yml`; sem banco, eles
pulam avisando; com `REQUIRE_DATABASE=1`, falham.

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
| Cafeína | C8H10N4O2 | 194,19 | **61,82** | **imidazol precisa ser aromático** — dois anéis aromáticos |

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
- Antes de instalar qualquer pacote, verifique a licença: compatível com MIT, ou não entra.
- Toda ideia nova fora do escopo vai para `docs/FORA-DE-ESCOPO.md`, não para o código. Escopo
  estourando é o risco número um deste projeto.
- Texto novo na tela nasce no `messages.ts` ao lado dela, nos dois idiomas. Nenhum
  `Intl.NumberFormat('pt-BR')` escrito à mão: número e data vêm de `useFormatters()` ou de
  `formatNumber`/`formatDate` com o idioma em mãos.
- Não se traduz o que uma pessoa escreveu — nome de turma, enunciado de missão de professor,
  apelido de molécula — nem notação química: fórmula, SMILES, InChIKey, símbolo, unidade, `R`/`S`.
- Toda entrega termina com teste que falharia sem ela, e com o documento que ela tornou
  desatualizado corrigido na mesma entrega.
