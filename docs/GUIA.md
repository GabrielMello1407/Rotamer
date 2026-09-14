# Guia de uso

Como usar o Rotamer, tela a tela — para quem aprende e para quem ensina. Os textos entre aspas
são os que aparecem na tela.

O editor abre **sem cadastro**: quem entra no endereço já desenha. Conta só é preciso para
guardar progresso e moléculas, entrar numa turma e batizar estrutura.

---

## 1. A bancada

A tela de desenho ocupa a página; o resto se apoia nas bordas dela.

| Onde | O quê |
|---|---|
| Faixa de cima | a marca, a **fórmula e a massa** do que está desenhado, o estado (`válida`, `estrutura impossível`, `carregando o motor`), `Guardar`, `Exemplos`, `Missões`, `Análise`, e `Entrar` ou o seu nome |
| Barra em pé, à esquerda | as ferramentas, os elementos, os anéis prontos, organizar, desfazer e refazer, enquadrar, nova molécula, atalhos |
| Faixa de baixo | cinco números que mudam a cada traço — massa, TPSA, rotáveis, anéis, doadores/aceitadores — e a regra dos cinco |
| Canto inferior direito | a **cena 3D**, que dobra e vibra |
| Painel lateral | fechado por padrão: `Análise` (tudo o que o RDKit calculou) e `Missões` (o enredo e o tutor) |

No celular tudo empilha: desenho em cima, painel embaixo. Nada exige mouse.

## 2. Desenhar

- **Clique no vazio** para pôr um átomo do elemento ativo (carbono, no começo). Um carbono
  sozinho já é metano: os hidrogênios ficam implícitos.
- **Arraste de um átomo** para criar outro já ligado a ele. O ângulo trava em 30°, e a cadeia
  sai em zigue-zague, como no quadro.
- **Clique numa ligação** para trocar a ordem: simples, dupla, tripla, simples.
- **Elemento ativo:** os botões `C` `N` `O` `S` da barra, ou `···` para a tabela periódica
  inteira. Com um elemento escolhido, clique no átomo para trocá-lo ou no vazio para pôr um novo.
- **Anéis prontos:** benzeno, cicloexano, ciclopentano e piridina, num clique.
- **Organizar o desenho:** o RDKit refaz as posições — comprimentos de ligação iguais, ângulos
  certos, anéis regulares. `Ctrl+Z` devolve o desenho como estava. Se havia cunha, uma faixa no
  alto conta o que aconteceu com ela (§ 5).
- **Desfazer e refazer:** `Ctrl+Z` e `Ctrl+Shift+Z` (ou `Ctrl+Y`), sem limite dentro da sessão.
- **Nova molécula:** limpa a tela, e `Ctrl+Z` traz de volta.

**Ferramentas** (tecla entre parênteses):

| Ferramenta | O que faz |
|---|---|
| Desenhar (`D`) | o modo normal, descrito acima |
| Mover (`M`) | arrasta um átomo sem criar nada; arrastar no vazio move a vista |
| Selecionar (`V`) | um retângulo pega vários átomos; **duplo clique** pega o fragmento inteiro; arrastar de dentro move o bloco; `Delete` apaga tudo de uma vez; `Ctrl+A` seleciona tudo; `Esc` solta |
| Estereoquímica (`W`) | clique numa ligação para pôr cunha cheia; clique de novo para traço; de novo para tirar. A ponta fina fica no centro estereogênico |
| Apagar (`E`) | clique no átomo ou na ligação |

**Atalhos** valem na página inteira, menos enquanto você escreve num campo de texto. `?` abre a
folha com todos. Elementos: `C` `N` `O` `S` `P` `F` `I` `H`, e `L` para cloro, `B` para bromo.
`0` enquadra a molécula.

**Menu do botão direito** (no celular, **toque longo**): no átomo, trocar o elemento com a
tabela periódica em miniatura, pôr carga formal, apagar; na ligação, escolher a ordem direto e
a estereoquímica (cunha, traço, inverter a ponta fina); no vazio, organizar, enquadrar,
desfazer, limpar; com seleção, trocar o elemento ou a ordem de tudo de uma vez, soltar, apagar.

**No celular:** dois dedos aproximam e afastam; toque duplo pega o fragmento; toque longo abre o
menu.

## 3. Ler o que a tela diz

**A faixa de cima** mostra a fórmula e a massa assim que a estrutura fecha, e o estado:

- `válida` — o RDKit aceitou.
- `estrutura impossível` — e a faixa de baixo diz por quê, em português: *"O átomo de C tem 5
  ligações, mas suporta no máximo 4."* O átomo com problema aparece com um círculo tracejado.
  `Ver o que fazer` abre o painel com a explicação e a correção.
- `carregando o motor` — o RDKit ainda está subindo (uma vez por visita; depois fica em cache).

**A faixa de baixo:** massa (g/mol), TPSA (Å²), ligações rotacionáveis, anéis (com quantos são
aromáticos), doadores/aceitadores de ligação de hidrogênio, e se a molécula está dentro da
**regra dos cinco** de Lipinski. Tudo calculado pelo RDKit, a cada traço.

**Onde o RDKit diverge de outra tabela, a tela mostra o valor do RDKit e diz de quem é a
definição.** A cafeína dá TPSA 61,82 (o PubChem publica 58,44 — a diferença é a percepção de
aromaticidade); a aspirina tem 2 rotacionáveis na definição estrita (o PubChem conta 3).

## 4. O painel `Análise`

- **SMILES ou nome.** Cole um SMILES (`CC(=O)Oc1ccccc1C(=O)O`) e `Carregar`. O que o RDKit não
  lê como estrutura vira busca por nome no PubChem: `caffeine`, `aspirin`. Sem resposta do
  PubChem, a tela avisa — colar SMILES continua funcionando.
- **Exemplos** (na faixa de cima): etanol, ácido acético, benzeno, paracetamol, aspirina,
  cafeína.
- **Grupos funcionais** reconhecidos, com nome em português: éster, ácido carboxílico, amida…
- **Identidade:** átomos pesados, heteroátomos, anéis, rotacionáveis, doadores/aceitadores,
  TPSA, logP, refratividade molar, fração sp³, estereocentros (e quantos estão sem
  configuração), massa exata, InChIKey, SMILES.
- **Modos normais:** `3N − 6` modos (`3N − 5` se a molécula é linear), cada um com o número de
  onda em cm⁻¹ e se é estiramento ou dobramento. **Clique num modo e a cena mostra só ele.** As
  frequências são do campo de força MMFF94, calculadas na hora — não são medidas de espectro, e
  a tela diz que campo de força clássico costuma superestimar estiramento em 5% a 10%. Um modo
  com número negativo é frequência imaginária, e a tela explica o que isso significa.
- **Regra dos cinco:** quatro barras, massa, logP, doadores e aceitadores, contra os limites
  publicados. Não é previsão de atividade: descreve onde a molécula está em relação a quatro
  limites.
- **Levar embora:** `SVG` (o desenho do RDKit), `PNG` (a tela como está), `Compartilhar` (copia
  o link da página pública, § 8).
- **Tema:** claro, escuro ou o do sistema.

Rodapé do painel: *"Calculado pelo RDKit… Nenhum número desta tela passa por modelo de
linguagem."*

## 5. Estereoquímica

Com a ferramenta `W`, clique numa ligação: cunha cheia; de novo, traço; de novo, nada. Quem
atribui **R** ou **S** é o RDKit, lendo as cunhas — a letra aparece ao lado do átomo no desenho
e na cena. Centro sem cunha aparece com `?`, e em Identidade como "sem configuração". Ligação
dupla ganha **E** ou **Z**.

Ao **organizar o desenho** com cunhas, a faixa no alto conta o que aconteceu com cada uma: uma
cunha que não definia configuração nenhuma (o átomo não era centro estereogênico) some, e a
faixa diz por quê; uma cunha de centro de verdade pode virar traço quando o átomo passa para o
outro lado do papel — mesma configuração, a letra continua a mesma.

Cunha e traço atravessam o SMILES (`F[C@H](Cl)Br`) e a página pública.

## 6. A cena 3D

Assim que a estrutura fecha, a molécula **nasce emaranhada e se dobra** até a forma de menor
energia — são os quadros reais da minimização no campo de força MMFF94 — e depois **vibra**, por
dinâmica molecular a 300 K. Uma ligação simples gira; a dupla não.

Controles: girar com o mouse ou o dedo; mostrar ou esconder hidrogênios; ver o volume; recentrar;
ampliar (a cena cresce para metade da bancada, e o desenho continua ao lado). O átomo tocado no
desenho acende na cena, e vice-versa. Dupla e tripla aparecem como varetas paralelas.

Elemento que o MMFF94 não parametriza (o painel diz qual): a forma aparece assim mesmo, montada
com comprimentos e ângulos de ligação — o que não existe é a energia, e sem energia não há
vibração nem modos normais.

Com "reduzir movimento" ligado no sistema, dobramento e vibração são desligados e a geometria
final aparece direto.

## 7. Missões

Abra `Missões` na faixa de cima. O seletor `Escolher missão` lista o catálogo por trilha —
**Estrutura**, **Geometria**, **Propriedade** — e `Sem missão — ferramenta livre`, que é o modo
sem enredo: *"Desenhe o que quiser. Os descritores continuam saindo do RDKit a cada traço."*

Cada missão tem enunciado, **objetivos** com tique conforme você cumpre, e nota de 0 a 100,
proporcional aos objetivos cumpridos. O veredito sai do motor de missões comparando os números
que o RDKit calculou — nunca de um modelo de linguagem. `Ver dica` mostra uma dica de cada vez;
elas são escritas à mão, e só aparecem quando pedidas.

Quando todos os objetivos fecham, aparece `cumprida`. Com conta, o progresso é gravado —
*"Progresso salvo. Nota conferida no servidor: 100 de 100."* — e a missão ganha `✓` no seletor.
Sem conta, a tela convida: `Entre na sua conta` para guardar o que já cumpriu.

**O tutor** fica no mesmo painel, com três perguntas: `E agora?`, `Por que não fechou?`,
`O que é isto?`. Ele só aceita pergunta depois de existir molécula válida. A resposta vem
marcada em âmbar e com a frase *"Texto gerado por modelo de linguagem a partir dos números
calculados. É hipótese, não medida."* — os números que aparecem no texto são os que o RDKit
calculou, encaixados pela interface. Na instância sem chave do Gemini, ele diz que está
desligado e devolve você às dicas escritas à mão. Há um teto de perguntas por dia.

## 8. Página pública de uma molécula

`Compartilhar` copia um link `/m/<smiles>` que abre em qualquer lugar, sem conta e sem
JavaScript: fórmula, massa, descritores, grupos, o desenho pelo RDKit e o apelido (§ 10), se
houver. Colado num grupo de WhatsApp, o link vem com imagem e título. `Abrir esta molécula no
editor` traz o desenho de volta.

## 9. Conta e estante

`Entrar`, na faixa de cima, leva a `/entrar`: **entrar** com e-mail e senha, ou **criar conta**
com como quer ser chamado, e-mail, senha (8 caracteres ou mais) e escola ou instituição —
opcional, mas é o que permite acompanhar a turma depois. Criar conta leva direto de volta à
bancada, já identificado.

O que a conta guarda: o progresso nas missões e as moléculas que você guardou. **`Sair` limpa a
tela e o rascunho**: a máquina do laboratório é compartilhada, e quem sentar depois não encontra
a sua molécula.

**Guardar**, na faixa de cima, põe a estrutura em `Minhas moléculas`. A mesma estrutura guardada
duas vezes continua sendo uma linha só. Cada linha mostra fórmula, massa e data; abre no editor,
tem `Página pública` e `Tirar da estante` (com confirmação na própria linha). O que fica
guardado é o grafo: fórmula, massa e descritores são recalculados sempre que a molécula abre.

Sem conta, o rascunho fica no navegador e volta quando você abre de novo — e um link com molécula
ganha do rascunho.

## 10. Batizar uma estrutura

No painel `Análise`, uma estrutura que ninguém batizou pode receber um **apelido** de quem a
desenhou: `Dar um apelido` → `Batizar`. O apelido é da estrutura, vale para todo mundo nesta
instância, e **nunca aparece sem o nome de quem deu** — *"Molécula da Ana · batizada por
Professora Ana"* — no painel, na página pública e na estante. Batizar também guarda a estrutura
em `Minhas moléculas`.

O que o batismo **não é**: nomenclatura. *"O Rotamer escolheu não nomear: quem nomeia escreve em
inglês, e traduzir nome de composto é decidir estrutura."* Por isso a tela recusa apelido que se
passe por nome sistemático (`butanol`) ou por fórmula (`C9H8O4`), e explica por quê.

Antes de oferecer o batismo, o produto pergunta ao PubChem se o composto já existe lá fora.
Composto conhecido não se batiza: a tela mostra o nome que o PubChem registra e o CID. Se o
PubChem não responder, o batismo continua possível, dizendo que não deu para conferir.

## 11. Turmas — para quem estuda

`Turmas` fica no alto da tela, ao lado do seu nome. Digite ali o **código de seis caracteres**
que o professor escreveu no quadro e `Entrar na turma`. Enquanto você não estiver em nenhuma
turma, o painel de missões diz isso e traz o link `Entrar numa turma`. Não há convite por
e-mail. *"O professor vê quais missões você cumpriu e onde parou. O que você desenha fora das
missões é seu, e não aparece para ninguém."*

Depois disso, o painel `Missões` ganha a seção **`DA SUA TURMA`**, acima do catálogo: a lista
que o professor publicou, na ordem dele, com `0 de 5 cumpridas`. Qualquer item abre em qualquer
ordem — não há cadeado. Missão escrita pelo professor traz `missão do seu professor` e a
autoria. Ao cumprir uma, aparece `Cumprida. Faltam 2 na lista.` e `Próxima: … →`; na última,
`Cumprida. Você fechou a lista «…».`

O **Catálogo** (`/catalogo`, no menu da conta) lista tudo o que existe para fazer — as missões
do produto e as que professores publicaram, com busca por nome, trilha ou grupo funcional
(`«éster», «anel»…`). Missão de professor aparece assinada (`missão de Professora Ana · EE Dom
Pedro II`) e tem `Denunciar`, com o motivo em uma linha.

**Esqueceu a senha?** Em `/entrar`, `Trocar com o código do professor` leva a `/senha`: e-mail
da conta, o código de oito caracteres que o professor entregou em mãos e a senha nova. O código
vale por um dia e serve uma vez; trocar a senha encerra as sessões antigas.

## 12. Turmas — para quem ensina

**Virar professor.** Professor não se autodeclara: o papel é dado por quem administra a
instância, com um comando no servidor (`docs/INSTALACAO.md`, "O primeiro professor"). Crie a
conta com a escola preenchida e peça a promoção com o e-mail dela. A própria tela explica isso:
em `Turmas`, quem ainda não é professor lê **"Dá aula e quer abrir uma turma?"** com o caminho.
Depois da promoção, `Turmas que você dá` aparece na próxima página que você abrir — não precisa
sair e entrar.

**Abrir a turma.** Em `/turmas`, `Turmas que você dá` → nome (`3º A — manhã`) → `Abrir turma`.
A resposta traz o **código**: *"Turma "3º A — manhã" aberta. O código é K7M2QX."* Escreva no
quadro. A lista mostra quantos alunos entraram.

**O quadro da turma** (clique no nome): o resumo (*"12 alunos, de 15 missões no catálogo"*), as
**listas da turma**, um quadro por lista publicada, **`Onde a turma travou`** — as missões em que
mais gente tentou e não cumpriu, que é de onde sai a próxima aula — e **`Aluno a aluno`**: quem,
cumpridas, travado em, última vez. *"Travar é ter tentado e não ter cumprido — quem nem abriu a
missão não conta aqui."* Nenhuma molécula do aluno aparece nesta tela.

**Montar uma lista.** `Nova lista` → nome (`Funções oxigenadas — 3ª série`). Na lista:

- `Escolher do catálogo`: marque as missões, por trilha, e `Acrescentar (n)`.
- `Criar missão desenhando`: a bancada abre com `Criando missão · <lista>` e a aba **`Autoria`**.
  Desenhe a **resposta**; o painel mostra a fórmula com o selo `calculado` e os **objetivos que
  dá para cobrar**, extraídos da molécula — a fórmula, a molécula exata, cada grupo funcional,
  cada contagem de átomos e de descritores. Marque os que quer cobrar. Escreva `Título da
  missão`, `Enunciado` (*"Fale de química, não de interface"*; sem link; sem nome de aluno) e
  até três `Dicas`, uma de cada vez. `Salvar missão` põe a missão na lista: *"«O álcool do dia
  a dia» entrou na lista, na posição 2."*

  Marcar `é exatamente esta molécula` desliga os outros objetivos — *"A nota vira 0 ou 100 e um
  isômero parecido não vale nada. Para aceitar mais de uma resposta certa, cobre grupos e
  contagens em vez desta."* Não dá para escrever objetivo: *"o que o aluno vai ter de cumprir é
  sempre o que o RDKit mediu aqui"*. Uma missão que a própria resposta não cumpre é recusada,
  nomeando o objetivo. A resposta fica guardada dentro da missão e **o aluno nunca a recebe**.
- Ordem: `Subir`, `Descer`, `Remover` (com `Desfazer` por alguns segundos).
- `Publicar para a turma`: a partir daí a turma vê a lista, e **os objetivos das missões suas
  ficam travados** — mudar objetivo mudaria a nota de quem já tentou. Título, enunciado e dicas
  continuam editáveis.
- `Publicar no catálogo` / `Retirar do catálogo`, missão a missão: publicada, qualquer conta da
  instância a encontra pela busca, com o seu nome e a sua escola. Exige escola preenchida.
  Retirar encerra o acesso pelo catálogo; quem chega pela lista da própria turma continua.
- `Arquivar lista` tira a lista das duas telas sem apagar nada; `Desarquivar` traz de volta.

**O quadro por lista:** uma linha por aluno, uma coluna por item, com `✓ cumpriu · • travou
(abriu e não cumpriu) · – não abriu`, `cumpridas` (`3 / 5`) e `última vez`. Em cima, `ONDE A
TURMA TRAVOU NESTA LISTA`.

**Códigos de senha.** O link `Códigos de senha` fica em dois lugares que você já visita: na
seção `Turmas que você dá`, em `Turmas`, e no alto da página de cada turma. Lá dentro: e-mail de
quem perdeu a senha → `Emitir código`. O código aparece **uma vez** — anote e entregue em mãos.
Vale por um dia, serve uma vez, e só para alguém da mesma escola que a sua. Emitir outro
invalida o anterior.

## 13. O que o Rotamer não faz

- Não prevê o produto de uma reação nem propõe rota de síntese.
- Não afirma atividade biológica. Descritores são descritores.
- Não calcula nome IUPAC. Deixa batizar, que é outra coisa.
- Não substitui PyMOL, ChemDraw ou Maestro.
- As frequências são do campo de força, não medidas de espectro — e a tela diz isso.
