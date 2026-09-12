# Nomenclatura — o Rotamer vai nomear molécula?

**27 de agosto de 2026.** Levantamento do `researcher`, sobre quatro frentes de pesquisa e sete
tentativas de refutação. Não é decisão: escopo é do `pm`. O que está aqui é o que se sabia neste
dia, com o endereço de cada coisa.

> Escrito quando o produto era fechado (D-08). Em 11 de setembro de 2026 o D-28 abriu o código
> sob MIT e mudou a regra de licença — o que este levantamento diz sobre licença comercial e
> produto fechado é registro daquele dia, não a regra de hoje. A leitura atual dos caminhos está
> no `docs/FORA-DE-ESCOPO.md`, em "Nomenclatura — os cinco caminhos".

---

## A pergunta

O professor da sessão de observação da Fase 3 vai desenhar uma estrutura e perguntar "qual é o
nome disto?" — e hoje o Rotamer não responde, porque o D-15 decidiu deixar batizar em vez de
nomear. A pergunta é se essa decisão continua de pé.

## Resposta curta

Tecnicamente o D-15 continua certo, mas **pelo motivo errado**. A premissa "o RDKit.js não resolve
isso" foi conferida três vezes e é verdade. Já a premissa implícita "não existe motor aberto e
permissivo" ficou **falsa em 27 de agosto de 2026**: existe o `openclatura` (MIT, determinístico,
sobre o próprio RDKit), que medi aqui nomeando 30 de 30 moléculas de orgânica de ensino médio com
round-trip perfeito e nomes com forma de livro. O que barra não é mais licença nem qualidade — é
que ele **só fala inglês**, **roda em Python no servidor** (nunca no navegador, nunca offline) e
está em **beta 0.3.1, de um laboratório só**.

---

## O que está verificado

### 1. O que o Rotamer tem hoje — medido no repositório

- **O núcleo não tem nada perto de nomenclatura.** `@rotamer/core` expõe 39 símbolos em runtime e
  o filtro `/name|nomen|iupac|title/i` devolve vazio. O objeto `Molecule` não tem campo de nome:
  `smiles, formula, inchi, inchiKey, molblock, descriptors, groups, atomHydrogens, stereo`.
  — sonda temporária em `packages/core/test/`, criada, rodada e removida.
- **O mais perto de nomear é `detectFunctionalGroups`**: 21 padrões SMARTS com nome em pt-BR
  (ácido carboxílico, éster, amida, fenol, …). É classe funcional, não nome de composto — não dá
  cadeia principal, numeração nem ramificação.
  — `packages/core/src/chemistry/groups.ts`, linhas 63-175.
- **O batismo recusa cinco categorias**, cada uma com mensagem própria em pt-BR: `curto`, `longo`,
  `caracteres`, `parece-formula`, `parece-sistematico`.
  — `apps/web/lib/molecule-name.ts`, `MESSAGES` linhas 43-50, `checkName` linhas 52-66.
- **A regra `parece-sistematico` erra nos dois sentidos, e isso foi medido.** Ela é um sufixo
  solto (`/(ano|eno|ino|ol|al|ona|oico|amina|amida|ato|ila|ilo)$/i`) sobre palavra única.
  Rodando `checkName`: **recusa** `Camila`, `Sol`, `Cristal`, `Girassol`, `Farol`, `Carnaval`,
  `Ludmila`; **aceita** `cafeina`, `aspirina`, `anilina`. Ou seja: barra o nome próprio da aluna e
  deixa passar o nome trivial de composto real — exatamente o inverso do que ela existe para
  fazer. Também recusa `Ba` e `Na` como `parece-formula`.
  — sonda `apps/web/lib/zz-probe.test.ts`, criada, rodada e removida.
- **A busca resolve uma direção só.** `findByName` manda o texto ao PubChem e o SMILES devolvido
  passa pelo RDKit antes de virar molécula. `findCompoundByInchiKey` pergunta pela chave e, se
  achar, pega o `Title` do CID — e isso vira a tela "já existe lá fora", nunca um campo de nome.
  — `apps/web/app/actions/search.ts` linhas 42-85; `apps/web/lib/pubchem.ts` linhas 154-234.
- **O produto já sabe conferir nome→estrutura sem motor nenhum.** A condição
  `{ kind: 'inchiKey', value }` existe em `packages/quests/src/types.ts:42` e é avaliada em
  `conditions.ts:40-41`. E a chave não depende de como o aluno desenhou: quatro escritas SMILES
  diferentes da aspirina (aromática e Kekulé, átomos de partida diferentes) devolveram todas
  `BSYNRYMUTXBXSQ-UHFFFAOYSA-N`. O nome, aí, é digitado por um humano no dado da missão — o
  produto nunca o gera, e o D-15 fica intacto.
- **Três estados quando o PubChem cai, não dois**: timeout de 5 s por ida, orçamento de 6 s por
  pergunta, disjuntor que abre após 3 recusas e fica 60 s fechado; `knownCompound` devolve
  `nao-sei` e o batismo continua valendo, com a ressalva na tela.
  — `apps/web/lib/pubchem.ts` linhas 20-41; `known-compound.ts` linhas 22-37.
- **A suíte passa hoje**: `pnpm test` → 21 arquivos em 5 pacotes, `Tasks: 5 successful, 5 total`.

### 2. As duas bibliotecas de química que já estão na stack não nomeiam

- **RDKit.js 2025.03.4 (BSD-3):** enumerei o runtime, não o `.d.ts`. 21 funções no módulo e 55
  métodos de API no `JSMol`; o filtro amplo
  `/name|iupac|nomen|systematic|preferred|synonym|label|title/i` devolve `(nenhum)`.
  `get_descriptors()` traz 43 chaves, todas numéricas. `get_prop_list()` de um mol vindo de SMILES
  devolve `{}`. Grep por `iupac` no `.js` e no `.wasm` → **0**, com controle positivo: `inchi` no
  mesmo `.wasm` → **62**. O método acha string que existe, logo o zero é ausência real. `nomencl`,
  `butane` e `hexyl` no `.wasm` → 0, ou seja, não há léxico de nomenclatura compilado. Não há build
  alternativo: `dist/` só tem `RDKit_minimal.{js,wasm}` e `Code/MinimalLib/dist/` é cópia idêntica
  por md5.
- **OpenChemLib 9.25.0 (BSD-3):** `iupac` → 0 no bundle; nenhum `toName`/`fromName`/`StructureName`
  no `.d.ts`; `resources.json` (1,35 MB) só tem MMFF94, torção e toxpredictor.

**Consequência:** qualquer nomenclatura é **dependência nova**, não flag a ligar.

### 3. Nome → estrutura: existe, é MIT, e não fala português

- **OPSIN 2.9.0, MIT.** `LICENSE.txt` do próprio projeto lido em
  https://raw.githubusercontent.com/dan2097/opsin/master/LICENSE.txt — texto MIT integral,
  "Copyright 2017 Daniel Lowe". Release 2.9.0 publicada em **15 de março de 2026**
  (`api.github.com/repos/dan2097/opsin/releases`), a anterior era de 2023. Repositório vivo,
  push em 19 de agosto de 2026, 232 estrelas.
- **Direção única.** O próprio banner do CLI: *"OPSIN converts systematic chemical names to CML,
  SMILES or InChI/StdInChI/StdInChIKey"*. Não existe modo estrutura→nome.
- **Rápido e correto.** 15 nomes convertidos em 0,407 s de relógio **incluindo a partida da JVM**.
  Acerta sistemático e trivial (`acetic acid` e `ethanoic acid` dão o mesmo SMILES) e devolve
  estereoquímica (`(2R)-butan-2-ol` → `C[C@H](CC)O`). Os SMILES dele passados pelo RDKit deste
  repositório reproduzem a tabela do `CLAUDE.md`: etanol 46,07/20,23; ácido acético 60,05/37,30;
  aspirina 180,16/63,60; cafeína 194,19/61,82.
- **Não entende português.** Bateria de 42 nomes de ensino médio: **PT 3/42** (e os três são
  coincidência ortográfica, tipo `propan-2-ol`), **EN 42/42**. Falham `etanol`, `benzeno`,
  `acido acetico`, `2-metilbutano`, `acido acetilsalicilico`, `propanona`, `cafeina`. Confirmado
  também no serviço do EMBL-EBI: `curl https://www.ebi.ac.uk/opsin/ws/etanol.smi` → HTTP 404.
- **Toda falha é alta e visível.** Em 62 nomes testados entre as frentes, **zero divergências
  silenciosas** — o OPSIN nunca devolveu a molécula errada calado; ou acerta ou recusa. Isto
  importa sob D-01: é o perfil de erro que uma sala de aula tolera.
- **Uma camada pt→en é tratável, mas é léxico e não some.** Um normalizador morfológico de ~20
  linhas (ano/ane, ol/ol, ona/one, oico/oic) levou o conjunto ajustado a 41/42 e um *held-out* de
  20 nomes sem regras novas a 14/20, com **0 divergências silenciosas** nos dois. As 6 perdas são
  entradas de dicionário: `hidroxi→hydroxy`, `gli→gly`, `ureia→urea`, `estireno→styrene`, e o
  éster "acetato de …". Traduzir nome de composto **é decidir estrutura**, então essa camada não
  pode ser o LLM (D-01).
- **Cuidado de licença dentro do jar.** O `opsin-cli-2.9.0-jar-with-dependencies.jar`
  (14.335.652 bytes, sha256 `c2e29326c281f87b59a05d934d8589adac6e9d17b95b984931b3e739111b360f`)
  empacota `jna-inchi-core` 1.3.1, cujo POM no Maven Central declara **LGPL 2.1 ou posterior**
  (77 entradas `io/github/dan2097/jnainchi/` dentro do jar). LGPL não está no veto literal do
  `CLAUDE.md` (GPL/AGPL) — e é justamente por isso que precisa de decisão explícita e não de
  omissão. O `opsin-core` sozinho fica limpo (automaton BSD-2, woodstox/commons-io/log4j
  Apache-2.0), mas é ele quem deixou de ter `Main-Class` a partir do 2.9.0.
- **Não existe porte JS/WASM.** No npm o pacote `opsin` é biblioteca Vue sem relação;
  `opsin-js`, `opsinjs`, `opsin-wasm`, `js-opsin`, `@opsin/core`, `node-opsin` → todos 404.
  Busca no GitHub por `opsin+wasm` → 0; `opsin+javascript` → 1 resultado, uma extensão do Safari
  de 2014 que consome o serviço. Usar OPSIN é rodar Java, ou chamar o EBI.
- **O fork em espanhol existe e é inutilizável aqui.** `quimifyapp/opsin` (14 estrelas) **não tem
  arquivo de licença nenhum** — derivado de MIT sem concessão declarada.

### 4. Estrutura → nome: o achado que muda o quadro — `openclatura`

Isto **não estava nas quatro frentes**; entrou por um cético e eu medi hoje.

- **`openclatura` 0.3.1, MIT, determinístico, sobre o RDKit.** `LICENSE` lido na fonte
  (https://raw.githubusercontent.com/lamalab-org/openclatura/main/LICENSE): "MIT License /
  Copyright (c) 2026 lamalab-org". API do GitHub: `spdx_id: MIT`, criado em **8 de maio de 2026**,
  push em 24 de agosto de 2026, 80 estrelas, Python. PyPI: `openclatura 0.3.1`, classificador
  "License :: OSI Approved :: MIT License". **Dependência de runtime única: `rdkit>=2023.09`**
  (BSD-3) — instalei num venv descartável do scratchpad e a árvore inteira ficou
  `numpy, pillow, rdkit, openclatura`. Nada de GPL, nada de Java obrigatório.
- **Sem modelo e sem tabela.** README: *"There is no model and no lookup table: the same structure
  always yields the same name"* e *"Both are deterministic — same input, same output, no LLM in
  the loop"*. Isto é o oposto do STOUT e é o que o torna compatível com "o núcleo determinístico
  decide".
- **MEDIDO AQUI — 30 moléculas, e os nomes têm forma de livro.** Rodei `oc.name_smiles()` sobre os
  6 casos do `CLAUDE.md` mais 24 de orgânica de ensino médio. Saída literal, entre outras:

  | desenhei | openclatura devolveu |
  |---|---|
  | `CCO` | `ethanol` |
  | `CC(=O)O` | `acetic acid` |
  | `c1ccccc1` | `benzene` |
  | `CC(=O)Nc1ccc(O)cc1` | `N-(4-hydroxyphenyl)acetamide` |
  | `CC(=O)Oc1ccccc1C(=O)O` | `2-(acetoxy)benzoic acid` |
  | `Cn1cnc2c1c(=O)n(C)c(=O)n2C` | `1,3,7-trimethyl-3,7-dihydro-1H-purine-2,6-dione` |
  | `CC(=O)OCC` | `ethyl acetate` |
  | `CC(C)=O` | `propan-2-one` |
  | `C/C=C/C` | `(2E)-but-2-ene` |
  | `OCC(O)CO` | `propane-1,2,3-triol` |
  | `CC(O)C(=O)O` | `2-hydroxypropanoic acid` |
  | `C[C@@H](N)C(=O)O` | `(2R)-2-aminopropanoic acid` |
  | `CC(C)CC(C)(C)C` | `2,2,4-trimethylpentane` |

  Compare com o que a frente mediu do **NISPO 0.1.7**, o outro candidato BSD-3: ácido acético →
  `1-hydroxy-1-oxo-ethane`, acetato de etila → `2-oxo-3-oxapentane`, propanona → `2-oxopropane`,
  ciclo-hexano → `cyclohexan`. O NISPO é quimicamente certo e reprovaria numa aula de éster; o
  `openclatura` nomeia éster como éster e cetona como cetona.

- **MEDIDO AQUI — round-trip 30/30, zero divergência silenciosa.** Peguei os 30 nomes do
  `openclatura`, passei pelo OPSIN 2.9.0 local (`java -jar opsin-cli-2.9.0.jar -o smi`) e comparei
  InChIKey pelo RDKit. Saída: `round-trip openclatura 0.3.1 -> OPSIN 2.9.0 -> InChIKey: 30/30
  iguais` · `OPSIN nao entendeu o nome (falha alta): 0` · `DIVERGENCIA SILENCIOSA: 0`.
- **MEDIDO AQUI — ele verifica a si mesmo.** `NamingResult` tem os campos `opsin_check` e
  `self_audit`, e `verify_with_opsin(nome, smiles)` devolve um `OpsinCheck` com `status`. Instalei
  o extra `py2opsin`, `oc.opsin_available()` → `True`, e rodei: acetato de etila, cafeína,
  aspirina e alanina → **`status=matched` nos quatro**. Isto é o mecanismo que permitiria mostrar
  **só** nome que o round-trip confirmou, e calar no resto — o desenho que o D-01 pediria.
- **MEDIDO AQUI — o nome sai em pedaços, não em string.** `analyze_smiles()` devolve um
  `NameAnalysis` com `trace_segments`, `decisions`, `substituent_tree` e `operations`. Cada
  segmento traz `atoms`, `bonds`, `name_terms` e `rule_hint` apontando a regra do Blue Book
  (`P-44`, `P-45`). Para `CC(=O)OCC`: `{'key':'parent', 'atoms':[0,1], 'name_terms':['acetate',
  'acetat'], 'rule_hint':'Parent hydride / parent structure: Blue Book P-44 and P-45.'}`. Dois
  efeitos: **(i)** os índices de átomo casam com o grafo, então dá para acender no desenho a parte
  que corresponde a cada pedaço do nome — a mesma ideia do "átomo aceso é um só nas duas telas";
  **(ii)** localizar para pt-BR seria mapear termos, não traduzir frase — o que reduz o problema,
  mas não o elimina, porque a ordem muda (`ethyl acetate` → "acetato de etila").
- **Dois nomes dos 30 saíram em forma menos comum que a do livro**: `1-ethoxyethane` (o locant
  parece supérfluo diante de "ethoxyethane") e `2-(acetoxy)benzoic acid` (a forma citada em
  ENEM/PubChem é "2-acetyloxybenzoic acid"). Conferi que o OPSIN aceita as quatro grafias e todas
  dão a **mesma molécula** — `ethoxyethane` e `1-ethoxyethane` → `C(C)OCC`;
  `2-(acetyloxy)benzoic acid` e `2-(acetoxy)benzoic acid` → o mesmo SMILES da aspirina. Portanto o
  desvio é de **estilo**, não de química. Se estilo desses reprova numa prova é pergunta para um
  professor de química, não para mim — está em aberto abaixo.

### 5. Estrutura → nome: os outros candidatos, e por que caem

- **NISPO 0.1.7, BSD-3** (Oxford Protein Informatics Group), Python sobre RDKit, publicado no PyPI
  em 23 de agosto de 2026. Licença verificada em duas fontes. Round-trip 26/26 na frente que o
  mediu — e o próprio README avisa: *"It is optimized for OPSIN round-trip validity rather than
  preferred IUPAC nomenclature"*. Pelo menos 8 dos 26 nomes reprovariam numa aula.
- **STOUT (MIT) é rede neural, e cai pela regra que não se quebra.** `LICENSE` MIT verificado;
  PyPI `STOUT-pypi 2.0.5`. Mas o artigo dos próprios autores (J. Cheminform. 2024, 16:146) mede
  **89,86%** de acerto por correspondência exata no melhor experimento e **83,52%** no treino de
  larga escala. É literalmente o perfil que o `CLAUDE.md` descreve para vetar o LLM. E está
  inutilizável hoje: repositório canônico 404, pesos no Zenodo **410 GONE** (controle: outro
  registro do Zenodo responde 200), `pip install STOUT-pypi` falha com `ResolutionImpossible`,
  `stout.decimer.ai` não resolve.
- **`nobyt/smiles2iupac`** é determinístico e ativo (push em 10 de agosto de 2026), mas
  **`license: null`** — todos os direitos reservados, juridicamente inutilizável.
- **`JasonYCHuang/chem-dl-iupac` é AGPL-3.0 e `sneedkap/iupac-to-structure` é GPL-3.0** — vetados
  pelo `CLAUDE.md`.
- **Nenhum motor estrutura→nome em JS ou WASM com licença permissiva.** Varredura do npm por
  `iupac`, `smiles name` e `opsin`: nada. `indigo-ketcher` 1.46.0 (Apache-2.0, WASM, o candidato
  mais óbvio): baixei o bundle de 10.146.858 bytes e `grep -c -i -a "iupac"` → **0**.
  `ketcher-core` 3.17.2 (Apache-2.0): também não. **Consequência de arquitetura: qualquer
  nomenclatura no Rotamer é chamada de rede, não código no worker.**

### 6. O mercado — nomenclatura é recurso pago e de servidor

- **ChemDoodle Web Components é GPLv3, e mais restritivo do que se dizia.** Baixei a distribuição
  oficial (`ChemDoodleWeb-11.0.0.zip`, 4.641.214 bytes) e li o `COPYING.txt`: é o texto da GPLv3
  da FSF, 35.147 caracteres, **sem uma linha modificada**. O cabeçalho do fonte diz *"either
  version 3 of the License, or (at your option) any later version"* → **GPL-3.0-or-later**.
- **E a nomenclatura dele não roda no navegador — isto foi executado, não lido.** No fonte
  distribuído, `generateIUPACName` e `readIUPACName` são invólucros de uma linha sobre
  `_contactServer`, que faz `fetch(SERVER_URL, {method:'POST', credentials:'include'})`.
  Carreguei a lib em Node com `fetch` instrumentado, montei etanol e pedi o nome: **1 requisição
  de rede, zero nomenclatura local**, e errback quando a rede é bloqueada. O `SERVER_URL` de
  fábrica é `https://ichemlabs.cloud.chemdoodle.com/icl_cdc_v090000/WebHQ`; o `/cdcloud.php` do
  site `iupacnaming.com` é override daquele site. POST direto devolveu
  `{"content":{"iupac":"Ethanol","attemptedPIN":"ethanol"}}`.
- **A nomenclatura do ChemDoodle é "powered by OPSIN"** — a própria página de demo diz isso, e o
  OPSIN é MIT. Ou seja, a direção nome→estrutura **não** está fechada pela GPL deles.
- **Preço do ChemDoodle: US$ 29 é assinatura mensal por usuário, não compra.** A loja lista
  `Monthly $29`, `Yearly $199`, `Lifetime $999`, para a "iChemLabs Suite User License" com quatro
  produtos, e diz *"We do not license them separately"*. O desconto acadêmico **não alcança** esses
  valores: *"we offer a significant academic discount on our Site licenses… As for our user
  subscriptions or Lifetime user licenses, we are sorry"*. Site license é sob orçamento, sem preço
  público.
- **Ketcher (EPAM, Apache-2.0) não faz nomenclatura nenhuma** — nem gera, nem lê nome.
  `api.github.com/repos/epam/ketcher` → Apache-2.0, push em 27 de agosto de 2026.
- **MolView não nomeia**: busca em PubChem, RCSB PDB, COD e NIST WebBook — o que o Rotamer já faz.
  E é pilha GPL: `curl https://molview.org/` devolve 12 ocorrências de ChemDoodle, 15 de Jmol, 12
  de GLmol; o repositório é `NOASSERTION` no GitHub. Não serve nem de referência de código.
- **Consolidação de mercado.** Lido no site do próprio fabricante
  (https://www.acdlabs.com/resources/free-chemistry-software-apps/chemsketch-freeware/):
  *"ChemSketch Freeware Discontinued. In January 2026, ACD/Labs was acquired by RS who develop
  ChemDraw"*. Dois dos cinco fornecedores citados como independentes são hoje a mesma empresa, e a
  opção **gratuita** que existia para escola sumiu.

### 7. O que o ensino brasileiro cobra — e em que direção

- **A BNCC do Ensino Médio não cobra nomenclatura.** Baixei o PDF oficial do MEC
  (http://basenacionalcomum.mec.gov.br/images/historico/BNCC_EnsinoMedio_embaixa_site_110518.pdf)
  e rodei `pdftotext -layout` + `grep -c -i`: **IUPAC 0**, **carbono 0**, **hidrocarboneto 0**,
  **isomeria 0**, **átomo 0**; "nomenclatura" 1 vez, e é terminologia da educação. A única menção
  a orgânica é "estrutura e propriedades de compostos orgânicos", numa lista de conhecimentos que
  "podem ser mobilizados" na Competência Específica 3 (p. 543-544) — sugestão de contexto, não
  habilidade. São exatamente 23 habilidades (EM13CNT101-106, 201-207, 301-310) e nenhuma cita
  nomenclatura, fórmula estrutural ou função orgânica.
- **A BNCC não atribui série.** O "13" do código significa "qualquer série do Ensino Médio,
  conforme definição dos currículos" (p. 33).
- **Quem cobra é o estado, na 3ª série, e nas duas direções.** O documento "Habilidades Essenciais
  de Química – EM" da SEDUC-SP traz, em **3ª série / 3º bimestre**: *"Escrever fórmulas estruturais
  de hidrocarbonetos a partir de sua nomenclatura e vice-versa"*. Só São Paulo foi lido, inteiro.
- **O ENEM quase não cobra, e quando cobra é nome → estrutura.** Provas oficiais do 2º dia,
  caderno 5 amarelo, 2020 a 2025, baixadas do INEP: **"IUPAC" 0 ocorrências nos seis anos**;
  "nomenclatura" 1 vez (2023). **Nenhuma questão dos seis anos pede o nome de uma estrutura
  desenhada.** A questão 96 de 2023 lista cinco compostos só pelo nome (n-decano, n-heptano,
  2,2,4-trimetilpentano, …) sem nenhuma estrutura desenhada.
- **A Unicamp manda desenhar, e o aluno erra.** Provas comentadas de 2005 a 2010: "fórmula
  estrutural" aparece 18 vezes e nenhuma questão pede o nome IUPAC de uma estrutura. Em 2005, a
  questão 9 dá "3-penten-2-ol" e manda desenhar. A própria banca escreveu que "esperava-se que
  esta questão não apresentasse muita dificuldade" — e o resultado foi **41,59% de zeros**.
- **Dar a resposta pronta antes da tentativa anula o feedback.** Shute, V. J. (2008), *Focus on
  Formative Feedback*, Review of Educational Research 78(1), 153-189, Tabela 2 (p. 177-178):
  *"Provide feedback after learners have attempted a solution. Do not let learners see answers
  before trying to solve a problem on their own (i.e., presearch availability)"*; e no corpo:
  *"feedback can inhibit learning if it encourages mindlessness, as when the answers are made
  available before learners begin their memory search"*. Periódico revisado por pares, sem produto
  envolvido.
- **E, para tarefa difícil, o feedback deve ser imediato** — *"a helpful safety net for the learner
  so she does not get bogged down and frustrated"* (Tabela 4, p. 179); para aluno de baixo
  desempenho, feedback **elaborado** rende mais que verificação simples.
- **A literatura brasileira já diagnosticou o problema.** Matos et al. (2009), *Nomenclatura de
  Compostos Orgânicos no Ensino Médio*, Química Nova na Escola 31(1), p. 40-46: *"os estudantes do
  Ensino Médio são conduzidos a memorizar denominações, regras, classificações, mas por não usarem
  com frequência, acabam esquecendo"*, e o objetivo básico do conteúdo seria "permitir a conexão
  entre o nome e a classe funcional de uma substância" — o valor está no vínculo nome↔função, não
  no nome.

### 8. O PubChem esteve fora do ar o dia inteiro

Cinco conjuntos independentes de tentativas, entre ~09:44 e ~14:00 (horário local) de **27 de
agosto de 2026**, todos com `PUGREST.ServerBusy`. A última, feita por mim:
`curl -G ".../rest/pug/compound/smiles/property/IUPACName,Title/JSON" --data-urlencode
"smiles=CCO"` → `{"Fault":{"Code":"PUGREST.ServerBusy"}}` **[HTTP 503]**, e o mesmo para a
aspirina. Antes, a página HTML comum (`/compound/2244`) também devolveu 503, e o cabeçalho trazia
`Retry-After: 30` e `X-Throttling-Control: … too many requests per second or blacklisted`. A API
do GitHub respondeu 200 no mesmo instante, então não é falha de rede daqui.

**Isto importa duplamente:** o produto **já depende** do PubChem hoje (verificação de existência do
D-15), e o `IUPACName` do PUG REST era candidato a fonte de nome. Não consegui medir nem o formato
nem a cobertura. O terceiro estado do D-15 ("não consegui verificar") não é hipótese remota — foi
o estado do mundo durante todo o dia de hoje.

### 9. Sujeira encontrada no repositório

`git status` na raiz mostra dois arquivos **não rastreados**: `cd.html` (96.535 bytes) e `st.html`
(31.541 bytes), com horário de 27 de agosto de 2026, 09:55. Os tamanhos batem exatamente com as
páginas do ChemDoodle e da loja iChemLabs baixadas durante esta pesquisa. São lixo de coleta que
caiu na raiz do produto por engano. Não apaguei — quem varre a árvore antes de commitar decide.

---

## O que a fonte afirma, e ninguém conferiu

- **ChemDraw faz os dois sentidos, mas só na edição cara.** "Name-to-Structure and Structure-to-Name
  functions" consta como recurso do ChemDraw **Professional**; o Prime não traz. — página do
  fabricante (https://perkinelmerinformatics.com/products/research/chemdraw/, **fonte
  interessada**) e a página de TI de Stanford (https://software.stanford.edu/index.php/node/1873,
  independente do fabricante), lidas em 27 de agosto de 2026. O PDF oficial de comparação de
  edições devolve HTTP 403 para leitura automatizada.
- **Na Chemaxon (hoje sob a Certara) nomenclatura é produto licenciado à parte, nos dois sentidos.**
  *"Name import is only available for a single molecule with the free MarvinSketch desktop
  application. For batch conversion … you need the 'Name to Structure' license."* E no Marvin JS:
  *"a separate license for Name to Structure and/or Structure to Name is required"*. —
  documentação do fabricante (docs.chemaxon.com), **fonte interessada**.
- **O Marvin JS manda quase tudo para o servidor.** Os Web Services listados são CIP Stereo Info,
  Elemental Analysis, Mol Export, Clean, Formats, Hydrogenizer e afins — nomenclatura nem aparece
  na lista padrão. — fabricante, **fonte interessada**.
- **Certara/ChemAxon Naming Toolkit entrega por Java, Python, .NET e microsserviço**; **ACD/Name**
  é desktop/servidor; **Lexichem TK** (OpenEye/Cadence) é toolkit C++/Python de servidor; **ChemDraw
  JS** é o único que roda no navegador e faz as duas direções, entregue como `.tgz` npm privado
  mais licença XML. — todas páginas de venda dos próprios produtos, **fontes interessadas**.
  Nenhuma publica preço. Um agregador (SourceForge) menciona US$ 475,00/ano para ACD/Name, mas é
  terceiro e é licença de usuário, não SDK embutível: **não confie nesse número**.
- **A licença comercial do ChemDoodle serve tecnicamente a produto fechado**: *"Contact us for a
  proprietary license instead, which can be integrated and distributed with proprietary
  products."* — fabricante, **fonte interessada**, sem preço público.
- **O `IUPACName` do PubChem vem do LexiChem da OpenEye** — encontrado em descrições de campo do
  SDF do PubChem replicadas em datasets de terceiros e citado na bibliografia do artigo do STOUT.
  Não li a documentação primária do PubChem afirmando isso. Confiança alta, fonte primária não
  lida.
- **Cobertura do `openclatura`: QM9 100%, PubChem 99,3%, ZINC22 97,4%.** — README dos próprios
  autores, **fonte interessada**, e é *round-trip coverage*, não "nome que o professor aceita".
  Eu medi 30 moléculas; eles medem milhões. Os dois números respondem perguntas diferentes.
- **KingDraw é gratuito e faz os dois sentidos**, em app de celular e desktop, não web. — fabricante
  (kingdraw.com) e um guia de biblioteca da Vanderbilt. Não sei se nomeia no aparelho ou manda a
  estrutura para servidor da KingAgroot, e não li o termo de uso.
- **CheerpJ roda jar em WASM sem modificar**, mas a Community Edition é só para projeto pessoal e
  FOSS; uso comercial custa £100 por desenvolvedor/mês no plano Small Business. — Leaning
  Technologies, **fonte interessada**. Não testei com o jar do OPSIN.
- **O EMBL-EBI hospeda o OPSIN desde 21 de maio de 2025.** O serviço responde HTTP 200 hoje
  (verifiquei), mas a página **não declara limite de taxa, cota nem compromisso de
  disponibilidade** — só um "Terms of use" genérico.

---

## O que os céticos derrubaram ou puseram em dúvida

Esta seção não está vazia. Sete refutações foram tentadas; **duas alegações caíram, três ficaram
duvidosas e duas se confirmaram sob teste mais duro**.

**REFUTADO — "não existe motor estrutura→nome aberto e permissivo".** Era a frase que sustentava
metade da resposta, e é falsa. Existem pelo menos dois: o STOUT (MIT) e o `openclatura` (MIT). O
autor do achado tinha se protegido — "é ausência de evidência, não prova de ausência; se aparecer
um, muda". Apareceram dois. **Se o D-15 for mantido, esta não pode ser a justificativa**, porque
alguém vai descobrir que é falsa. A justificativa que se sustenta é outra, e é melhor: os motores
abertos ou são neurais com 83-90% de acerto (STOUT), ou são beta de um laboratório só, e **nenhum
deles fala português nem roda no navegador**.

**REFUTADO — "ChemDoodle está vetado nos dois casos".** O `CLAUDE.md` veta GPL e AGPL; a licença
comercial da iChemLabs é explicitamente para produto proprietário fechado. O braço pago **não é
vetado por política** — é caro, de preço não publicado, e dependente de servidor de terceiro por
chamada. Chamar de "vetado" transforma juízo de negócio em proibição de regra, e quem ler isso em
seis meses vai acreditar que a porta estava fechada.

**REFUTADO — "US$ 29 pelo bundle 2D+3D" e "os depoimentos são de escola".** São US$ 29/mês por
usuário nomeado, sem desconto acadêmico. E o depoimento sobre *"cash-strapped state schools"* está
atribuído, no HTML bruto, a "University of Missouri, Kansas City" — em inglês americano "state
school" é universidade pública. Dos 37 depoimentos com atribuição, 4 parecem ensino médio, 21 são
universidade e 12 são empresa. Além disso, **nenhum dos 37 menciona naming, nomenclature ou
IUPAC**: ligar "vende nomenclatura" a "vende para escola" era inferência apresentada como
observação.

**DUVIDOSO — "o português do OPSIN é o obstáculo central".** As medições reproduzem e ficaram mais
fortes (PT 3/42 contra EN 42/42), mas: um dos oito nomes falhou com mensagem diferente da citada;
"aspirin" sugeria limitação de classe que não existe (`caffeine` e `acetylsalicylic acid` passam —
é lacuna de um sinônimo no dicionário); e sobretudo **o OPSIN é a direção oposta da pergunta**. Ele
não obstrui "nomear"; obstrui "entrar por nome", que o D-09 item 3 já põe depois do MVP. E o
tamanho do muro foi medido: ~20 linhas de regras morfológicas resgatam 14/20 num held-out, com
zero divergência silenciosa. **É léxico, não muro.**

**DUVIDOSO — "OPSIN é MIT" (certo, e incompleto).** O jar que se baixa e se roda carrega
`jna-inchi` **LGPL-2.1-or-later** dentro. Dizer "OPSIN é MIT" e parar aí faz o time instalar
copyleft achando que instalou permissivo. E a conclusão "significaria um serviço Java ao lado do
Next.js" é falso binário: existe o serviço hospedado do EBI (que funciona hoje, e que traz outro
problema — mandar o que o aluno digitou para servidor de terceiro).

**DUVIDOSO — "a nomenclatura do ChemDoodle é chamada de rede com cota".** O mecanismo foi provado
(POST, e a página intercepta mensagem contendo `exceeded`), mas **a cota não foi observada**: 10
chamadas idênticas passaram todas. Mecanismo provado, limite não.

**CONFIRMADO sob teste mais duro — "o RDKit.js não tem nomenclatura".** Sobreviveu a quatro
tentativas de derrubada, com rede mais larga que a original e com o **controle positivo** que
faltava (`inchi` → 62 no mesmo `.wasm` em que `iupac` → 0). Duas correções ficaram: o `.d.ts` do
pacote **está desatualizado** e promete `get_mol_from_pickle`, que não existe em runtime — grep no
`.d.ts` erra para menos e para mais, e "57 métodos" não reproduz sob contagem nenhuma (são 55 de
API). E o `LICENSE` do pacote diz BSD-3, mas o `.wasm` linka estaticamente InChI, Boost, coordgen,
FreeType e Avalon; a **FTL do FreeType exige atribuição**, e `docs/TERCEIROS.md` precisa de mais
que uma linha.

**Um alerta que nenhuma frente levantou:** o `condense_abbreviations` do RDKit.js produz rótulos
como `CO2Et` (rodado: etil salicilato → CXSMILES `*Oc1ccccc1* |$Et;;;;;;;;CO2Et$|`). Não é
nomenclatura, mas **é exatamente o tipo de string que um aluno lê como nome**. Se esses rótulos
chegarem à tela, a regra do D-15 precisa cobri-los.

---

## Os caminhos possíveis, com o preço de cada um

Ordenados do mais barato ao mais caro. **Nenhum deles é recomendação** — escopo é do `pm`.

### (a) Não nomear, e dizer isso em voz alta

Mantém o D-15 como está e prepara uma resposta escrita para a pergunta do professor, em vez de
deixar o silêncio responder.

- **Custo:** quase zero de engenharia. Uma frase na tela e a decisão reescrita — porque a
  justificativa atual **é falsa desde hoje** (ver céticos).
- **Risco:** o professor lê como limitação, não como escolha. E existe concorrente gratuito que
  nomeia de graça no celular do aluno (KingDraw, não conferido). O risco cresce se a resposta for
  "não dá"; encolhe se for "dá, mas em inglês e com 1 em 15 fora do padrão do livro — preferimos
  não confundir a sua sala".
- **O que obriga a manter para sempre:** a disciplina de recusar apelido que se passe por
  nomenclatura. E essa regra **hoje está medida errando nos dois sentidos** — recusa "Camila",
  aceita "aspirina". Este caminho é o mais barato de todos e ainda assim tem uma dívida aberta.

### (b) O aluno nomeia e o produto confere

Direção nome→estrutura: o aluno digita o nome, o produto converte e compara com o que ele
desenhou, ou com o alvo da missão.

- **Custo:** o mais baixo dos que fazem alguma coisa nova, porque **metade já existe**: a condição
  `inchiKey` das missões faz exatamente essa comparação hoje, sem motor nenhum, com o nome digitado
  por um humano no dado da missão. Nomenclatura livre (o aluno escreve qualquer nome) exige OPSIN
  — serviço Java no VPS, ou `opsin-core` sem InChI, ou o EBI — **mais** a camada pt→en.
- **Risco:** (1) o OPSIN não fala português, medido; (2) a camada de tradução **decide estrutura**,
  logo não pode ser o LLM (D-01) e vira código determinístico nosso, com dicionário; (3) o jar
  completo carrega LGPL; (4) o EBI não promete disponibilidade e receberia texto do aluno.
- **O que obriga a manter para sempre:** um dicionário pt→en de nomenclatura orgânica, revisado por
  quem entende, e mais um processo em produção (JVM) ou uma dependência de terceiro.
- **A favor:** é a direção que ENEM e Unicamp cobram, é onde o aluno erra (41,59% de zeros), e é
  o que Shute prescreve — o aluno produz, o software confere. É também a única direção em que o
  erro do motor é **alto e visível**: em 62 nomes, zero divergências silenciosas.
- **Contra, e é sério:** o D-09 item 3 já colocou "busca por nome" **depois do MVP**. Este caminho
  reabre uma decisão de escopo que foi tomada.

### (c) Integrar motor de terceiro para estrutura→nome

O que o professor pediu, literalmente. Candidato realista único: `openclatura` (MIT), rodando como
microsserviço Python ao lado do Next.js — o pacote já traz um extra `[web]` com FastAPI.

- **Custo:** um serviço a mais em produção, para sempre. Mais a **localização pt-BR**, que é o
  trabalho de verdade: o `NameAnalysis` entrega o nome em segmentos com `name_terms`, então é
  mapeamento de termo e reordenação, não tradução de frase — mas ninguém mediu quanto disso são
  regras e quanto são exceções.
- **Risco:** (1) **beta 0.3.1**, um laboratório, criado em 8 de maio de 2026, 80 estrelas — se
  parar, o problema é nosso; a licença MIT deixa fazer fork, o que limita o dano mas não o
  elimina; (2) **inglês**; (3) **chamada de rede por nome** — não funciona offline e some quando o
  VPS cai, do mesmo jeito que o PubChem sumiu o dia inteiro hoje; (4) round-trip válido não é nome
  do livro: 2 dos 30 saíram em forma menos comum.
- **O que obriga a manter para sempre:** a política de **só mostrar nome que a verificação
  confirmou**. O `openclatura` já traz o mecanismo (`verify_with_opsin` → `status=matched`,
  rodado aqui), mas ativá-lo puxa o OPSIN junto, e com ele o Java e a LGPL. Sem verificação, é um
  motor beta falando sozinho para uma sala inteira.
- **A favor, e é o argumento forte:** é determinístico, sem modelo e sem tabela; carrega o rastro
  da decisão com o número da regra do Blue Book; e os índices de átomo de cada segmento casam com
  o grafo — o que abriria a versão do produto que ninguém mais tem: **acender no desenho a parte
  que corresponde a cada pedaço do nome**. Isso deixa de ser "dar a resposta" e vira explicação.

### (d) Nomenclatura só para uma faixa restrita

Nomear apenas o que dá para garantir: cadeias abertas até N carbonos, uma função só, sem
estereocentro — e calar no resto, dizendo por que calou.

- **Custo:** menor que (c) em risco, maior em atenção continuada. Precisa da faixa **definida em
  teste**, não em comentário.
- **Risco:** (1) a fronteira é invisível ao usuário — o aluno desenha o que quiser, e um produto
  que às vezes nomeia e às vezes não parece quebrado, a menos que a mensagem explique a química da
  recusa; (2) **a faixa cresce**, e escopo estourando é o risco número um declarado deste projeto:
  cada aula traz um caso a mais que "faltou pouco".
- **O que obriga a manter para sempre:** a definição da faixa, um teste que trave a fronteira, e a
  mensagem que explica o silêncio em pt-BR.
- **Observação que muda o custo:** com o `openclatura` verificando a si mesmo, a faixa não precisa
  ser escrita à mão — ela pode ser **"tudo que o round-trip confirmou"**, que é uma fronteira
  medida e não opinada. Isso é (c) e (d) juntos, e é a combinação mais barata que dá uma resposta
  ao professor.

### (e) Nomear só o conteúdo curado, e nunca ao vivo

Não estava no pedido, mas é o caminho mais barato que produz alguma resposta. As missões usam um
conjunto **fechado** de moléculas. Dá para rodar o `openclatura` uma vez, em tempo de build, sobre
essa lista, um professor confere nome a nome, e o resultado entra como **dado**, do mesmo jeito
que o nome já entra hoje no dado da missão.

- **Custo:** nenhum em produção. Nenhum serviço, nenhuma rede, funciona offline e no celular fraco.
- **Risco:** só responde dentro da missão. O professor que desenhar algo fora da lista continua
  sem resposta — e é justamente o que ele vai fazer na sessão de observação.
- **O que obriga a manter para sempre:** o passo de revisão humana sempre que a lista mudar. É
  trabalho de professor, recorrente, e some se ninguém for pago para fazê-lo.
- **Nota:** isto **não é nomear**. É catálogo. A diferença precisa estar dita na tela, ou vira a
  impressão de que o produto nomeia — que é exatamente o que o D-15 quis evitar.

---

## Em aberto

- **O gatilho literal do D-15 não disparou.** Ele diz "revisar se aparecer motor de nomenclatura
  confiável **em WebAssembly**". O `openclatura` é Python. Se o gatilho é para valer como está
  escrito, nada mudou; se o que ele queria dizer era "motor confiável e com licença que sirva",
  então mudou hoje. Quem escreveu a decisão é quem sabe qual dos dois. — para o `pm`.
- **Qual pergunta o professor faz de verdade.** "Nomeie o que eu desenhei" (estrutura→nome, caminho
  c) ou "corrija o nome que meu aluno escreveu" (nome→estrutura, caminho b)? São produtos
  diferentes, com custos muito diferentes. **A sessão de observação da Fase 3 responde isso de
  graça, e antes de escolher motor.** É a coisa mais barata desta lista.
- **Quantos nomes o `openclatura` erra didaticamente, e não quimicamente.** Meus 30 são amostra que
  eu escolhi; 2 saíram em forma menos comum. Descobre-se assim: montar a lista de moléculas que
  as trilhas realmente usam (`packages/quests`), rodar o `openclatura` sobre ela, e ter um
  professor de química marcando aceita/não aceita nome a nome. Sem esse número, ninguém sabe se
  é "quase lá" ou "não serve".
- **Quanto custa a localização pt-BR do `openclatura`.** O nome sai em segmentos com `name_terms`,
  o que sugere mapeamento e não tradução. Mede-se contando quantos termos distintos aparecem ao
  nomear a lista das missões, e quantos casos exigem reordenação ("ethyl acetate" → "acetato de
  etila"). Não fiz.
- **O `IUPACName` do PubChem** continua sem medida: 503 o dia inteiro, cinco conjuntos de
  tentativas. Repetir em outro horário e de outro IP. Se ele nomear SMILES arbitrário, existe um
  caminho estrutura→nome gratuito e determinístico sem instalar nada — mas o PubChem só nomeia o
  que já existe lá, que é o oposto do caso do batismo.
- **A queda do PubChem foi do serviço ou bloqueio deste IP?** Se for bloqueio por origem, o VPS de
  produção pode ter o mesmo destino e ninguém saberia até a aula acontecer. Descobre-se repetindo
  o mesmo `curl` de outra rede. — para o `backend` e o `deploy`.
- **A taxa real de falso positivo do `SYSTEMATIC`.** Minha bateria foi inventada por mim.
  Descobre-se passando uma lista de primeiros nomes brasileiros (IBGE) e um vocabulário pt-BR por
  `checkName` — roda offline, em minutos.
- **Latência sob carga de sala.** Uma chamada isolada não diz nada sobre 30 alunos ao mesmo tempo.
  E medir o limite de um serviço público gratuito derrubando-o é o que não se deve fazer — o que,
  por si só, já é argumento contra depender de um.
- **Fuvest e UNESP** não foram conferidas (erro de TLS no acervo). O padrão ENEM+Unicamp é forte,
  mas fecharia melhor com mais uma banca. **Currículos de Goiás, Minas, Bahia e Paraná** também
  não foram lidos — se algum pedir estrutura→nome com código EM13CNT, reabre a conversa.
- **Um estudo que compare diretamente "software dá o nome" contra "aluno dá e software confere"**
  em nomenclatura orgânica não foi encontrado. O argumento de Shute é geral, não específico de
  química. Descobre-se instrumentando o próprio produto.

---

## Para quem interessa

- **`pm` — é quem decide, e há duas coisas para decidir, não uma.** Primeira: a justificativa do
  D-15 caiu ("não existe motor aberto" é falso desde hoje) mesmo que a decisão fique de pé; se
  ficar, precisa de argumento novo, e o novo é melhor que o velho. Segunda: o caminho (b) reabre o
  D-09 item 3, que já tinha posto busca por nome depois do MVP. E antes de qualquer escolha, a
  pergunta mais barata da lista é a da sessão de observação: qual das duas direções o professor
  quer.
- **`security` — antes de qualquer instalação, e há quatro coisas.** (1) O
  `opsin-cli-2.9.0-jar-with-dependencies.jar` carrega `jna-inchi` **LGPL-2.1-or-later** dentro;
  não está no veto literal do `CLAUDE.md`, e por isso mesmo precisa de decisão explícita.
  (2) `openclatura` 0.3.1 é MIT com dependência de runtime única `rdkit` (BSD-3) — limpo, mas é a
  primeira dependência **Python** do produto e muda a forma do deploy. (3) O caso STOUT é a lição
  geral: LICENSE MIT com **pesos destilados de software proprietário sob licença acadêmica** — a
  licença do código não lava a proveniência dos dados de treino, e isso vale para qualquer modelo
  que o time considere. (4) `quimifyapp/opsin` e `nobyt/smiles2iupac` não têm licença nenhuma.
  Some-se a isso: qualquer motor de nomenclatura é chamada de rede, e o que trafega é o desenho de
  um aluno frequentemente menor de idade, para servidor de terceiro — base legal LGPD a definir
  antes, não depois.
- **`reviewer` — dois vetos prontos.** Se alguém propuser STOUT ou qualquer motor neural de
  nomenclatura, os números **83,52% e 89,86%**, medidos pelos próprios autores, são o argumento, e
  são o mesmo perfil que o `CLAUDE.md` usa para vetar o LLM. E se algum caminho de nomenclatura
  entrar, a regra que o acompanha é **não mostrar nome que a verificação não confirmou**.
- **`backend` e `deploy` — o PubChem esteve 503 o dia inteiro de 27 de agosto de 2026**, e o
  produto já depende dele. Vale saber se é o serviço ou o IP, e vale medir do IP do VPS, que é o
  que conta.
- **`frontend` e `ui-ux` — a regra `parece-sistematico` recusa "Camila" e aceita "aspirina"**, o
  que é o inverso do que ela existe para fazer. E o `condense_abbreviations` do RDKit produz
  rótulos como `CO2Et`, que o aluno lê como nome — se aparecerem na tela, caem sob a mesma regra
  do D-15.
- **Quem varrer a árvore antes do próximo commit:** `cd.html` e `st.html` na raiz são lixo desta
  pesquisa, não rastreados.
