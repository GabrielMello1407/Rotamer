<div align="center">
  <img src="brand/rotamer-mark.svg" width="88" alt="Rotamer">
  <h1>Rotamer</h1>
  <p><strong>Desenhe uma molécula em 2D. Descubra o que ela é em 3D.</strong></p>
  <p>Química orgânica e medicinal no mesmo motor — validação determinística, geometria calculada, IA como tutora e nunca como juíza.</p>
</div>

---

> ### 📌 Status: primeiro modelo
>
> Este repositório é o **ponto de partida**, não a especificação final. É a ideia destilada em
> documento antes da primeira linha de código de produção: o escopo, a arquitetura pretendida,
> o design system e as decisões com o porquê de cada uma.
>
> **Tudo aqui vai mudar.** O produto final será maior e diferente do que está escrito — o que
> estes documentos garantem é que ele mude por um motivo, e não por esquecimento. Quando uma
> decisão for revista, atualize [docs/DECISOES.md](docs/DECISOES.md) em vez de apagar a antiga:
> saber o que foi tentado e por que não deu vale mais do que o texto limpo.

## O que é

Um ambiente web onde se desenha uma estrutura em fórmula plana e a geometria tridimensional
aparece no mesmo instante — dobrando-se até encontrar a forma e depois vibrando sob dinâmica
molecular real. Junto vêm a fórmula, a massa, os grupos funcionais, os descritores e o veredito
sobre a missão em curso.

**Para quem é.** É uma ferramenta de **ensino de química orgânica**. Quem paga é a escola, o
cursinho e a instituição de ensino. O pesquisador é usuário avançado bem-vindo — não é o cliente,
e o produto não finge competir com ChemDraw ou PyMOL. (Ver `docs/DECISOES.md` D-09.)

Uma trilha de profundidade, um motor: o aluno entra por **Estrutura** ("monte um éster com quatro
carbonos"); o usuário avançado entra por **Otimização** ("reduza o logP mantendo o farmacóforo"),
sem missão nem pontuação, colando o SMILES do composto que já tem em mãos. Química medicinal é
química orgânica aplicada — não são dois produtos.

**Rigor não é opcional por ser educação.** Professor de química é químico: se o app afirmar algo
errado, quem pega é ele. E numa ferramenta de ensino um erro não confunde um usuário, confunde
uma sala inteira.

## A regra que não se quebra

> **O núcleo determinístico decide. A IA explica.**

| Pergunta | Quem responde |
|---|---|
| É válido? Valência, fórmula, massa, SMILES, InChIKey, TPSA, anéis, rotacionáveis | **RDKit.** Nunca o LLM. |
| A missão foi cumprida? Qual a pontuação? | **Motor de missões.** Nunca o LLM. |
| Por que está errado e como consertar? | LLM, lendo os números já calculados |
| Que grupo trocar para melhorar uma propriedade? | LLM, marcado como hipótese na interface |

Um LLM acerta 90% das perguntas de valência e nos outros 10% produz uma explicação linda,
confiante e errada. Com aluno, passa. Com cientista, encerra o produto. Cada bloco na tela
declara sua origem: ponto verde para calculado, âmbar para gerado.

## Arquitetura

```
apps/web            Next.js 16 · App Router · rotas, contas, API
  └── packages/
      editor2d      canvas 2D próprio, ferramentas, histórico
      viewer3d      Three.js · dobramento e dinâmica molecular
      quests        missões declarativas e pontuação
      ui            tokens e componentes
      core          grafo · RDKit worker · geometria · descritores
```

**Regra de dependência:** `core` não depende de ninguém e ninguém depende de `editor2d`.
O núcleo roda em teste de linha de comando, sem navegador; a interface é substituível.

O **grafo é a única fonte de verdade**. Fórmula, descritores, coordenadas 3D, nota e texto do
tutor são todos derivados dele e recalculáveis. Nada além do grafo é persistido como estado.

### Stack

| Camada | Escolha |
|---|---|
| Aplicação | Next.js 16 + TypeScript |
| Química | RDKit.js (WASM) em Web Worker via Comlink |
| Geometria | OpenChemLib · conformação + MMFF94 |
| Vibração | Velocity-Verlet sobre o gradiente do MMFF94, a 300 K |
| 3D | Three.js + React Three Fiber |
| Editor 2D | Canvas 2D próprio + Zustand |
| Dados | Postgres + Prisma, na própria infraestrutura |
| LLM | Gemini, rota de servidor, saída em JSON de schema fechado |

### Desempenho

- Sanitização, descritores e conformação **sempre** no worker — o desenho não pode cair de 60 fps.
- Debounce por intenção: métricas a cada 120 ms de silêncio; geometria só quando a topologia muda.
- Cache por InChIKey — conformação e descritores são função pura do grafo.
- Meta: primeiro desenho interativo em menos de 3 s num celular fraco em 3G. O WASM carrega
  **depois** da primeira pintura.

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

Todas medidas contra a superfície do tema e aprovadas em WCAG AA (≥ 4,5:1).

> ⚠️ **CPK pertence ao átomo.** Nenhum botão, link, borda ou estado semântico pode usar uma cor
> CPK. Se a interface pinta de vermelho, o vermelho deixa de significar oxigênio. É por isso que
> o acento da marca é turquesa: nenhum elemento comum é turquesa no CPK.

Tipografia: **Archivo** (display), **IBM Plex Sans** (interface), **IBM Plex Mono** (todo número,
sempre com `tabular-nums`).

Tokens completos em [`packages/ui/src/tokens.css`](packages/ui/src/tokens.css).

## Marca

Uma **projeção de Newman** na conformação escalonada: você olha ao longo do eixo de uma ligação
simples. O círculo é o átomo de trás; as três hastes que partem do centro são as ligações do átomo
da frente; as três que saem da borda são as de trás. Os 60° de separação não são estética — é a
conformação de menor energia, aquela para a qual a molécula tende.

| Arquivo | Uso |
|---|---|
| `brand/rotamer-mark.svg` | símbolo principal, hastes da frente em `#00A98F` |
| `brand/rotamer-mark-mono.svg` | uma cor só, para gravação e fundo complexo |
| `brand/rotamer-favicon.svg` | abaixo de 32px — traço mais grosso, círculo menor |

**A cor separa profundidade:** frente em turquesa, trás e círculo na cor do texto. Nunca inverta —
inverter faz o átomo de trás parecer o da frente. Não gire para a conformação eclipsada, não
preencha o círculo, não acrescente seta de rotação.

## Sobre o nome

Um rotâmero é o isômero que existe por causa da rotação em torno de uma ligação simples — o
momento assinatura do produto, quando a vibração mostra o etano girando livre e o eteno se
recusando. Em português é *rotâmero*, reconhecível sem tradução.

Nomes descartados por colisão verificada: **Kekulé** (Kekule.js, paper no JCIM), **Bunsen**
(produto da Schrödinger), **Ylide** (ylide.io), **Anomer** (anomer.bio), **Moiety** (Moiety, Inc.)
e **Kovalent** ([Grupo Kovalent](https://grupokovalent.com.br/), empresa brasileira de reagentes
para análises clínicas — mesmo país, campo adjacente).

> ⚠️ DNS sem registro ≠ disponível no registrador ≠ livre no INPI. Confirme os dois antes de
> comprar domínio ou depositar pedido.

## Roadmap

| Fase | Semanas | Entrega |
|---|---|---|
| 0 · Fundação | 1–2 | monorepo, tokens, RDKit em worker, deploy |
| 1 · Núcleo | 3–7 | editor 2D, química, geometria, 3D — tudo no cliente |
| 2 · Enredo | 8–12 | missões, tutor com guardrails, contas → **MVP v0.1** |
| 3 · Realidade | 13–16 | validação com professores e alunos, correções |
| 4 · Comunidade | 17–22 | campanhas abertas, ranking, extensão universitária |

Cada fase publica algo que vale sozinho. A única data que importa é a Fase 2.

## O que este projeto não faz

- Não prevê o produto de uma reação nem propõe rota de síntese.
- Não afirma atividade biológica. Descritores são descritores.
- Não compete com PyMOL, ChemDraw ou Maestro — e não finge que compete.

## Licença

**Proprietário. Todos os direitos reservados.** Ver [LICENSE](LICENSE).

Este repositório é fechado. As bibliotecas de base — RDKit (BSD-3) e Three.js (MIT) — permitem
uso comercial em produto proprietário, desde que as atribuições sejam mantidas em
[docs/TERCEIROS.md](docs/TERCEIROS.md) e exibidas na interface. Confirme cada licença no
repositório de origem antes do lançamento comercial.

## Documentação

| Documento | O que cobre |
|---|---|
| [docs/ORIGEM.md](docs/ORIGEM.md) | Como a ideia nasceu, os pivôs e o que cada erro ensinou |
| [docs/PITCH.md](docs/PITCH.md) | Problema, solução, diferencial, mercado e modelo de negócio |
| [docs/DECISOES.md](docs/DECISOES.md) | Registro de decisões e o porquê de cada uma |
| [docs/ARQUITETURA.md](docs/ARQUITETURA.md) | Camadas, pacotes, fluxo de dados, modelo de dados |
| [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) | Cor, tipografia, forma, movimento, marca |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Fases até janeiro, riscos e métricas |
| [docs/DEPLOY.md](docs/DEPLOY.md) | O que já está automatizado e o que falta para o produto ficar no ar |
| [DEPOIS.md](DEPOIS.md) | Tudo que ficou fora do MVP |
| [CLAUDE.md](CLAUDE.md) | Instruções permanentes para o Claude Code |
