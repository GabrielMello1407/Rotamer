# Design system

> Primeira versão. Os valores abaixo foram medidos e validados, mas o sistema é para ser
> estendido conforme o produto crescer — faltam ainda estados de componente, formulários,
> tabelas de dados e tudo que só aparece quando as telas existirem.

Fonte da verdade em código: [`packages/ui/src/tokens.css`](../packages/ui/src/tokens.css). Nenhum hex solto no
código da aplicação.

## Cor

A paleta vem do **teste de chama** — a cor que cada elemento emite ao queimar. Os neutros vêm do
cone azul do bico de Bunsen: cinzas com viés azul-violeta, nunca cinza puro.

### Chama — cores puras

Para preenchimento, superfície e séries de gráfico. Nesta forma saturada não passam contraste
para texto pequeno.

| Elemento | Token | Hex |
|---|---|---|
| Cobre — turquesa (marca) | `--flame-cobre` | `#00A98F` |
| Potássio — lilás | `--flame-potassio` | `#A855C8` |
| Sódio — âmbar | `--flame-sodio` | `#F5A524` |
| Césio — azul-violeta | `--flame-cesio` | `#4C5FD5` |
| Estrôncio — escarlate | `--flame-estroncio` | `#F2542D` |
| Bário — verde-maçã | `--flame-bario` | `#7FBF3F` |
| Lítio — carmim | `--flame-litio` | `#E01A4F` |

### Chama — versões para texto

Escurecidas até cruzar 4,5:1 contra a superfície mais clara; no tema escuro, clareadas.
Todas medidas uma a uma.

| Token | Claro | Escuro |
|---|---|---|
| `--ink-cobre` | `#00806C` (4,60:1) | `#35D8BC` (10,1:1) |
| `--ink-potassio` | `#A24AC5` (4,58:1) | `#C98CE0` |
| `--ink-sodio` | `#9F6507` (4,56:1) | `#F7B84B` |
| `--ink-bario` | `#537D29` (4,57:1) | `#A0DC63` |
| `--ink-litio` | `#DE1A4E` (4,53:1) | `#FF6B85` (6,36:1) |
| `--ink-estroncio` | `#D5350D` | `#FF8256` |
| `--ink-cesio` | `#4C5FD5` (5,07:1) | `#8B99F5` |

### Neutros — o cone azul

| Token | Claro | Escuro |
|---|---|---|
| `--ink-900` | `#12131A` | `#ECEDF5` |
| `--ink-700` | `#2E3140` | `#C7CAD9` |
| `--ink-500` | `#5A5D72` | `#9598AE` |
| `--ink-400` | `#6E7189` | `#7E8196` |
| `--ink-300` (decorativo) | `#9A9DB2` | `#676A80` |
| `--bg` | `#F7F8FC` | `#0D0E14` |
| `--surface` | `#FFFFFF` | `#171A24` |
| `--line` | `#E2E4EF` | `#272B38` |

`--ink-300` é decorativo — nunca texto corrido.

### Papéis semânticos

| Papel | Elemento | Onde aparece |
|---|---|---|
| Marca / ação | Cobre | botão primário, link, seleção, foco |
| Sucesso | Bário | missão cumprida, estrutura válida, dentro de Lipinski |
| Atenção | Sódio | hipótese gerada por IA, valor aproximado, tensão residual |
| Erro | Lítio | valência excedida, violação de Lipinski |
| Informação | Césio | nota de contexto, referência |

### ⚠️ CPK pertence ao átomo

As cores CPK — grafite para carbono, vermelho para oxigênio, azul para nitrogênio, amarelo para
enxofre, verde para halogênios — são vocabulário compartilhado por toda a química há décadas.

**Nenhum botão, link, borda, badge ou estado semântico pode usar uma cor CPK.**

Se a interface pinta um botão de vermelho, o vermelho deixa de significar oxigênio e a tela
inteira fica ambígua justo onde precisa ser exata. Foi por isso que o acento da marca é
turquesa: nenhum elemento comum é turquesa no CPK. As duas paletas vivem em camadas separadas
e nunca se encontram.

**Os 118, em duas formas.** `packages/ui/src/cpk.css` traz a paleta CPK/Jmol inteira em dois
conjuntos:

| Token | Para quê |
|---|---|
| `--cpk-c`, `--cpk-fe`, … | o átomo **desenhado**: a esfera da cena 3D |
| `--cpk-ink-c`, `--cpk-ink-fe`, … | o átomo **escrito**: rótulo no desenho, letra na barra, símbolo na tabela |

A esfera do hidrogênio é branca e continua branca; a letra H, não — a variante `ink` é a mesma
cor levada até 4,5:1 contra a superfície do tema. O matiz nunca muda com o tema, só a claridade.

**O símbolo do elemento é átomo.** A letra `O` na barra de ferramentas e na tabela periódica pode
ser vermelha: ali ela *é* o oxigênio, não um estado da interface. O que nunca pode receber cor
CPK é o fundo, a borda ou o estado do botão — seleção e foco são sempre turquesa.

### Séries de gráfico

Ordem fixa: cobre, potássio, sódio, césio, estrôncio, bário, lítio. Ordenada para que vizinhos
permaneçam distinguíveis em deuteranopia — a primeira separação é matiz-luminosidade, não só
matiz. Acima de sete séries, agrupe em "outros" em vez de inventar a oitava cor.

## Estereoquímica no desenho

| O quê | Como aparece |
|---|---|
| Cunha cheia | triângulo preenchido, ponta fina no centro estereogênico |
| Cunha tracejada | barras perpendiculares que **crescem** para o fundo — largura igual seria pontilhado, que quer dizer outra coisa |
| Configuração do centro | `R` ou `S` em itálico, ao lado do átomo, na tinta do texto |
| Centro em aberto | `?` em itálico, em tom mais claro — existe e ninguém disse de que lado |
| Geometria da dupla | `E` ou `Z` em itálico, encostado na ligação, do lado de fora |

Nada disso é escolha de estilo: é a convenção de livro, e um aluno que aprende aqui precisa
reconhecer a mesma coisa no quadro. Quem atribui as letras é o RDKit (D-21).

**Na cena 3D não existe cunha nem traço.** Eles são notação de projeção, e ali a profundidade é
real; traço pontilhado no espaço significaria ligação de hidrogênio. O que atravessa é a letra `R`
ou `S`, ao lado do mesmo átomo. **A ordem de ligação, essa sim, atravessa**: dupla são duas varetas
paralelas e tripla são três, como no modelo de plástico — no plano da ligação quando há um vizinho
que o defina, e no plano da tela quando a molécula é linear e não há plano químico a respeitar.

## Bancada

A tela de desenho é a página. Tudo o mais se apoia nas bordas dela:

| Onde | O quê | Por quê |
|---|---|---|
| Faixa de cima, 46 px | marca, fórmula, massa, estado, exemplos, missões, análise | as três coisas que precisam ser vistas sempre |
| Borda esquerda, em pé | ferramentas, elementos, anéis, histórico | barra deitada rouba a altura que falta à molécula |
| Pé, centrado | massa, TPSA, rotáveis, anéis, doadores/aceitadores, Lipinski | os números que mudam a cada traço |
| Canto inferior direito | cena 3D flutuante, com vibração, volume, hidrogênios e recentrar | vizinha do desenho, não uma aba longe dele |
| Painel lateral, fechado por padrão | análise completa, missões, tutor, batismo, SMILES | apoio, não objeto |

Ampliar a cena 3D **não** toma a tela: ela cresce para metade da bancada e o desenho continua
visível ao lado — ver a fórmula plana e a forma no espaço ao mesmo tempo é o produto.

Enquadrar desconta o que está por cima: barra, faixa e cena viram margem, e a molécula é centrada
no espaço livre. No celular tudo empilha — desenho em cima, painel embaixo — porque escolher uma
missão não pode significar não poder desenhar.

## Tipografia

- **Archivo** — display. Desenhada para manchete de alto desempenho; tem o peso industrial de
  sinalização de laboratório.
- **IBM Plex Sans** — interface. Herança de engenharia, usada em software científico.
- **IBM Plex Mono** — todo número e toda fórmula.

| Papel | Tamanho | Tracking |
|---|---|---|
| display | 52px | −0,035em |
| título | 36px | −0,025em |
| seção | 26px | −0,018em |
| corpo | 16px | 0 |
| interface | 14px | 0 |
| rótulo caixa alta | 11px | +0,13em |

**Regras:**

- Todo número usa `font-variant-numeric: tabular-nums`. Sem exceção.
- Display sempre com tracking negativo — Archivo abre demais no padrão.
- Rótulo em caixa alta nunca passa de três palavras.
- Texto corrido no máximo 66 caracteres de largura.
- Fórmulas moleculares em mono com subscrito real — nunca `C6H6` em texto corrido.

## Forma

- **Espaço:** escala de 4 — `4 8 12 16 24 32 48 64 96`.
- **Raio:** `6` controle · `10` cartão · `14` painel flutuante · `20` cartão 3D. O raio codifica
  hierarquia de elevação; não use o mesmo em tudo.
- **Elevação:** dois níveis apenas. Sombra pequena para o que responde ao mouse, sombra grande
  para o que flutua sobre a tela. Painel ancorado usa linha de 1px, não sombra.

## Movimento

| Movimento | Duração | O que é |
|---|---|---|
| Estado de controle | 120ms ease-out | hover, foco, pressionado |
| Painel e gaveta | 260ms ease-out | entrada lateral, expansão do cartão 3D |
| **Dobramento** | ~2000ms | quadros reais da minimização de energia |
| **Vibração** | contínua | dinâmica molecular no mesmo campo de força |

As duas últimas são física, não enfeite. `prefers-reduced-motion` desliga ambas e vai direto
à geometria final; todas as transições caem para 0,01 ms.

## Temas

Claro e escuro sempre juntos, em três estados: escolha explícita marca `data-theme` no elemento
raiz, e o padrão "sistema" não marca nada — só `prefers-color-scheme` separa.

**Nenhuma cor pode ser definida apenas dentro de um bloco `@media (prefers-color-scheme)` ou
`[data-theme]`.** O `:root` puro define a paleta clara completa; os blocos condicionais apenas
redefinem tokens. Cor definida só atrás de condicional não se aplica no estado não marcado, e a
página renderiza texto de um tema sobre o fundo do outro.

## Marca

O símbolo é uma **projeção de Newman** na conformação escalonada: olha-se ao longo do eixo de
uma ligação simples. O círculo é o átomo de trás; as três hastes que partem do centro são as
ligações do átomo da frente; as três que saem da borda são as de trás.

Os 60° de separação não são estética — é a conformação de menor energia, aquela para a qual a
molécula tende.

### Construção

- Grade de 96, centro em `48,48`. Círculo de raio 26; hastes da frente do centro até o raio 26;
  hastes de trás do raio 26 até o raio 41.
- Ângulos da frente: `−90°`, `30°`, `150°`. De trás: `−30°`, `90°`, `210°`.
- Traço 5 na grade, pontas arredondadas. Abaixo de 32px, engrossa para 6,5 e o círculo encolhe
  para 24.
- Margem de respiro igual ao raio do círculo em volta de todo o símbolo.

### A cor separa profundidade

Frente em turquesa, trás e círculo na cor do texto. **Nunca inverta** — inverter faz o átomo de
trás parecer o da frente, e aí o desenho está quimicamente errado.

### O que não fazer

Não girar para a conformação eclipsada · não pintar as hastes de trás no acento · não preencher
o círculo · não usar outro elemento da paleta no lugar do cobre · não adicionar seta de rotação ·
não empilhar o wordmark abaixo do símbolo.

### Arquivos

| Arquivo | Uso |
|---|---|
| `brand/rotamer-mark.svg` | símbolo principal |
| `brand/rotamer-mark-mono.svg` | uma cor só, gravação e fundo complexo |
| `brand/rotamer-favicon.svg` | abaixo de 32px |

## Atalhos de teclado

Desenhar molécula é repetição: o mesmo elemento, a mesma ferramenta, dezenas de vezes. Quem passa
do primeiro dia larga a barra e usa a letra.

| Tecla | O que faz |
|---|---|
| `C` `N` `O` `S` `P` `F` `I` `H` | troca o elemento ativo |
| `L` `B` | cloro e bromo — a inicial já é do carbono e do bromo não sobrou |
| `D` `M` `W` `E` | desenhar · mover · cunha e traço · apagar |
| `0` | enquadrar a molécula |
| `Delete` | apaga o que está sob o cursor |
| `Ctrl+Z` / `Ctrl+Shift+Z` | desfazer e refazer |
| `?` | a folha com tudo isto |

Três regras que vieram de defeito, não de gosto:

- **Valem na página inteira**, não só com a tela de desenho em foco. Uma missão diz "tecle O", e
  isso só era verdade depois de clicar na tela — quem vinha do painel teclava no vazio.
- **Não valem enquanto se escreve.** Em campo de texto, `o` é a letra o. Com folha modal aberta,
  quem manda é a folha.
- **Letra de elemento não divide com ferramenta.** O enquadrar morava no `F` e respondia antes do
  mapa de elementos: o flúor era o único elemento da barra sem atalho. Enquadrar mudou para `0`.

O botão diz a tecla no `title`. Atalho que ninguém descobre é atalho que não existe.
