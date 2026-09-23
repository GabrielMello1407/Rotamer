<p align="right"><strong>Português</strong> · <a href="README.en.md">English</a></p>

<div align="center">
  <img src="brand/rotamer-mark.svg" width="88" alt="Rotamer">
  <h1>Rotamer</h1>
  <p><strong>Desenhe uma molécula em 2D. Descubra o que ela é em 3D.</strong></p>
  <p>Ferramenta de ensino de química orgânica — validação determinística, geometria calculada, IA como tutora e nunca como juíza. Código aberto, licença MIT, gratuita.</p>
</div>

---

## O que é

Um ambiente web onde se desenha uma estrutura em fórmula plana e a geometria tridimensional
aparece no mesmo instante — dobrando-se até encontrar a forma e depois vibrando sob dinâmica
molecular. Junto vêm a fórmula, a massa, os grupos funcionais, os descritores, os modos normais de
vibração e o veredito sobre a missão em curso.

**Para quem é.** Para quem ensina e para quem aprende química orgânica. O aluno usa; o professor
monta listas de exercícios para a turma e cria missões desenhando a resposta; o pesquisador é
usuário avançado bem-vindo — cola o SMILES do composto que já tem e trabalha sem missão nem
pontuação. O produto não compete com ChemDraw, Maestro ou PyMOL, e não finge que compete.

**Rigor não é opcional por ser educação.** Professor de química é químico: se o app afirmar algo
errado, quem pega é ele. E numa ferramenta de ensino um erro não confunde um usuário, confunde
uma sala inteira.

## Experimente

- **Na sua máquina, com Docker** — clone, copie o `.env.example` para `.env`, troque
  `POSTGRES_PASSWORD`, e:

  ```
  docker compose up -d
  ```

  Sobe o app e o Postgres, aplica as migrações e abre `http://localhost:3000`. Variáveis, primeiro
  professor, atualização, backup e proxy com TLS em [docs/INSTALACAO.md](docs/INSTALACAO.md).
- **Na instância mantida pelo autor:** o endereço entra aqui quando ela estiver no ar.
- **Para desenvolver:** `pnpm install`, `docker compose up -d postgres`, `pnpm dev`. O caminho
  inteiro está em [CONTRIBUTING.md](CONTRIBUTING.md).

Como usar, tela a tela: [docs/GUIA.md](docs/GUIA.md).

## A regra que não se quebra

> **O núcleo determinístico decide. A IA explica.**

| Pergunta | Quem responde |
|---|---|
| É válido? Valência, fórmula, massa, SMILES, InChIKey, TPSA, anéis, rotacionáveis, R/S/E/Z | **RDKit.** Nunca o LLM. |
| Qual é a forma? Como vibra? Quais são os modos normais? | **MMFF94**, pelo OpenChemLib. Nunca o LLM. |
| A missão foi cumprida? Qual a pontuação? | **Motor de missões**, no servidor. Nunca o LLM. |
| Por que está errado e como consertar? | LLM, lendo os números já calculados, marcado como hipótese |

Um LLM acerta 90% das perguntas de valência e nos outros 10% produz uma explicação linda,
confiante e errada. Com aluno, passa. Com químico, encerra o produto. Cada bloco na tela declara
sua origem: ponto verde para calculado, âmbar para gerado. O tutor é opcional: sem chave
configurada, ele se desliga e o produto continua inteiro.

## Arquitetura

```
apps/web            Next.js 16 · App Router · rotas, contas, turmas, listas, tutor
  └── packages/
      core          grafo · RDKit worker · geometria · descritores · modos normais
      i18n          os dois idiomas: dicionário tipado, formatação, frase da química
      editor2d      canvas 2D próprio, ferramentas, seleção, histórico
      viewer3d      Three.js · dobramento e dinâmica molecular
      quests        missões declarativas, extração de objetivos e pontuação
      ui            tokens e componentes
```

**Regra de dependência:** `core` não depende de ninguém e ninguém depende de `editor2d`.
O núcleo roda em teste de linha de comando, sem navegador.

O **grafo é a única fonte de verdade**. Fórmula, descritores, coordenadas 3D, nota e texto do
tutor são derivados dele e recalculáveis. O **servidor não confia no cliente**: o navegador manda
o desenho, nunca o veredito.

| Camada | Escolha |
|---|---|
| Aplicação | Next.js 16 + TypeScript estrito |
| Química | RDKit.js (WASM) em Web Worker via Comlink — e no servidor, para reavaliar |
| Geometria | OpenChemLib · conformação + MMFF94 |
| Vibração | velocity-Verlet sobre o gradiente do MMFF94, a 300 K; modos normais por Hessiana numérica |
| 3D | Three.js + React Three Fiber |
| Editor 2D | canvas 2D próprio + Zustand |
| Dados | Postgres + Prisma |
| Tutor | Gemini, rota de servidor, JSON de schema fechado sem campo numérico |

Meta de desempenho: primeiro desenho interativo em menos de 3 s num celular fraco em 3G — o WASM
carrega depois da primeira pintura, a cena 3D sob demanda. Escola pública é o caso de uso, não o
caso extremo.

## Design system

A paleta vem do **teste de chama** — a cor que cada elemento emite ao queimar. Os neutros vêm do
cone azul do bico de Bunsen: cinzas com viés azul-violeta, nunca cinza puro.

| Papel | Elemento | Claro | Escuro |
|---|---|---|---|
| Marca / ação | Cobre | `#00806C` | `#35D8BC` |
| Sucesso | Bário | `#537D29` | `#A0DC63` |
| Atenção / hipótese de IA | Sódio | `#9F6507` | `#F7B84B` |
| Erro | Lítio | `#DE1A4E` | `#FF6B85` |
| Informação | Césio | `#4C5FD5` | `#8B99F5` |

> **CPK pertence ao átomo.** Nenhum botão, link, borda ou estado semântico usa cor CPK. Se a
> interface pinta de vermelho, o vermelho deixa de significar oxigênio. O acento da marca é
> turquesa porque nenhum elemento comum é turquesa no CPK.

Tipografia: **Archivo** (display), **IBM Plex Sans** (interface), **IBM Plex Mono** (todo número,
sempre com `tabular-nums`). Tokens em [`packages/ui/src/tokens.css`](packages/ui/src/tokens.css);
o resto em [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md).

## Marca

Uma **projeção de Newman** na conformação escalonada: você olha ao longo do eixo de uma ligação
simples. O círculo é o átomo de trás; as três hastes que partem do centro são as ligações do átomo
da frente; as três que saem da borda são as de trás. Os 60° de separação são a conformação de
menor energia — aquela para a qual a molécula tende.

| Arquivo | Uso |
|---|---|
| `brand/rotamer-mark.svg` | símbolo principal, hastes da frente em `#00A98F` |
| `brand/rotamer-mark-mono.svg` | uma cor só, para gravação e fundo complexo |
| `brand/rotamer-favicon.svg` | abaixo de 32px — traço mais grosso, círculo menor |

Um rotâmero é o isômero que existe por causa da rotação em torno de uma ligação simples — o
momento assinatura do produto, quando a vibração mostra o etano girando livre e o eteno se
recusando.

## O que este projeto não faz

- Não prevê o produto de uma reação nem propõe rota de síntese.
- Não afirma atividade biológica. Descritores são descritores.
- Não nomeia compostos. Deixa **batizar** — autoria de apelido, sempre com o nome de quem deu.
- Não compete com PyMOL, ChemDraw ou Maestro.

## Contribuir

Comece por [CONTRIBUTING.md](CONTRIBUTING.md): o caminho é fork, branch, pull request, e o CI roda no
seu PR. As regras que não se negociam estão em [CLAUDE.md](CLAUDE.md), e o mapa do código em
[docs/ARQUITETURA.md](docs/ARQUITETURA.md). Toda mudança termina com teste que falharia sem ela;
química nova pede caso em `packages/core/test/` rodando sem navegador. Ideia fora do escopo vai para
[docs/FORA-DE-ESCOPO.md](docs/FORA-DE-ESCOPO.md) antes de virar código.

**Três contribuições não pedem o ambiente inteiro:** relatar erro de química (é issue, com formulário
próprio, e é o relato que mais importa aqui), corrigir documento que discorda do código, e
acrescentar caso de teste em `packages/core/`, que roda sem navegador e sem banco.

Convivência em [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) — o produto é usado por adolescente em sala,
e isso muda o que se escreve numa issue. Falha de segurança **não** vai para issue pública: o caminho
privado e o que conta como falha estão em [SECURITY.md](SECURITY.md).

```
pnpm dev          # app em desenvolvimento
pnpm test         # Vitest — o núcleo roda sem navegador; os testes de ação pedem Postgres
pnpm test:e2e     # Playwright, desktop e celular
pnpm lint · pnpm typecheck
```

## Licença

**MIT.** Ver [LICENSE](LICENSE). As bibliotecas de base e suas licenças estão em
[docs/TERCEIROS.md](docs/TERCEIROS.md); toda dependência precisa ser compatível com o MIT em
redistribuição.

## Documentação

| Documento | O que cobre |
|---|---|
| [docs/GUIA.md](docs/GUIA.md) | Como usar, para aluno e professor |
| [docs/INSTALACAO.md](docs/INSTALACAO.md) | Como subir a sua instância com Docker |
| [docs/ARQUITETURA.md](docs/ARQUITETURA.md) | Camadas, pacotes, fluxo de dados, modelo de dados |
| [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) | Cor, tipografia, forma, movimento, marca |
| [docs/ROTEIROS.md](docs/ROTEIROS.md) | As listas da turma: modelo, regras de servidor, telas |
| [docs/DECISOES.md](docs/DECISOES.md) | Registro de decisões e o porquê de cada uma, inclusive as revogadas |
| [docs/PITCH.md](docs/PITCH.md) | Por que o projeto existe |
| [docs/ORIGEM.md](docs/ORIGEM.md) | Como a ideia nasceu, os pivôs e o que cada erro ensinou |
| [docs/ROADMAP.md](docs/ROADMAP.md) | O que está feito, o que falta, riscos |
| [docs/DEPLOY.md](docs/DEPLOY.md) | A instância mantida pelo autor |
| [docs/FORA-DE-ESCOPO.md](docs/FORA-DE-ESCOPO.md) | Tudo que ficou fora, com o porquê |
| [docs/IDIOMAS.md](docs/IDIOMAS.md) | Os dois idiomas do produto e da documentação |

**Toda a documentação existe também em inglês**: [README.en.md](README.en.md) nesta raiz, e em
[`docs/en/`](docs/en/) um gêmeo de nome em inglês para cada documento daqui — o `GUIA.md` é o
`USER-GUIDE.md`. Documento que muda em português muda em inglês na mesma entrega — a tabela
completa está em [docs/IDIOMAS.md](docs/IDIOMAS.md).

A página do produto e esta documentação em forma de site vivem em outro repositório,
`rotamer-site`, que puxa a pasta `docs/` daqui na hora de construir — o site nunca descreve uma
versão que não é a do código.

---

<details>
<summary><strong>English</strong></summary>

**Rotamer** is a web-based molecular editor for teaching organic chemistry. Draw a structure in
2D and watch its 3D geometry appear at once — folding into shape, then vibrating under molecular
dynamics — with formula, mass, functional groups, descriptors, normal modes and mission feedback
alongside. Everything chemical is computed deterministically (RDKit and MMFF94); the optional
LLM tutor only explains numbers that were already calculated, and is always labelled as a
hypothesis. The interface and the documentation are in Brazilian Portuguese and English — read
the full English README in [README.en.md](README.en.md). Open source under the MIT license; run
your own instance with Docker ([docs/en/INSTALLATION.md](docs/en/INSTALLATION.md)).

</details>
