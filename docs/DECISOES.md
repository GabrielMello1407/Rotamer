# Registro de decisões

Cada entrada diz o que foi decidido, por quê, e o que teria que mudar para a decisão ser
revista. Decisão sem contexto vira dogma; com contexto, vira ferramenta.

---

## D-01 · O núcleo determinístico decide, a IA só explica

**Decisão.** Validade, valência, fórmula, massa, SMILES, InChIKey, descritores e nota de missão
vêm sempre do RDKit ou do motor de missões. O LLM nunca responde nenhuma dessas perguntas — ele
lê os números já calculados e explica, sugere e provoca, sempre marcado como hipótese.

**Por quê.** Um LLM acerta cerca de 90% das perguntas de valência e nos outros 10% produz uma
explicação linda, confiante e errada. Com aluno, passa despercebido. Com químico, encerra o
produto — ele testa um caso limite nos primeiros trinta segundos, vê a besteira e conta para os
colegas. Confiança em ferramenta científica não se recupera.

**Como se manifesta no produto.** Cada bloco de análise carrega indicador de origem: ponto verde
para calculado, âmbar para gerado. O prompt recebe os descritores prontos e é instruído a nunca
recalcular. A saída é JSON de schema fechado, sem nenhum campo numérico.

**Revisar se.** Nunca por conveniência. Só se existir um modelo com garantia formal de correção
química — o que não é o caso hoje.

---

## D-02 · Não reimplementar química; usar RDKit

**Decisão.** O grafo, o editor 2D, o render 3D e a mecânica de jogo são escritos à mão. A
química — parser de SMILES, valência, aromaticidade, conformação, campo de força — é RDKit
compilado para WebAssembly.

**Por quê.** O protótipo provou isso na prática. Um núcleo químico próprio foi escrito em algumas
centenas de linhas e funcionava bem para etanol, ácido acético, benzeno, paracetamol e aspirina —
e **errava na cafeína**: o anel de cinco membros com nitrogênio é aromático de verdade
(imidazol), mas um detector caseiro só reconhecia aromaticidade em anéis de seis. O erro
aparecia também na física, porque sem detectar aromaticidade o anel não recebia restrição de
planaridade.

Tautomeria, estereoquímica e formas de ressonância são a mesma armadilha, maiores.

**A analogia.** Você escreve sua própria engine de jogo, mas não reimplementa ponto flutuante.

**Revisar se.** O RDKit.js se mostrar inviável em celular fraco — e aí a resposta é mover o
cálculo para servidor, não escrever química à mão.

---

## D-03 · 2D é a entrada, 3D é a consequência

**Decisão.** O desenho acontece em fórmula estrutural plana. A geometria 3D é derivada e
sincronizada, nunca editada diretamente.

**Por quê.** Ninguém projeta molécula arrastando átomo no espaço tridimensional — é impreciso,
cansativo e não é como químico pensa. Químico desenha em bastão, em 2D, desde sempre.

**O bônus.** O momento "desenhei plano e agora vejo que no espaço isso não fecha" é exatamente a
intuição mais difícil de ensinar em orgânica. Ela vem de graça, como efeito colateral da
arquitetura.

---

## D-04 · Orgânica e medicinal no mesmo motor

**Decisão.** Um produto só, com trilhas de profundidade crescente: Estrutura → Geometria →
Propriedade → Otimização.

**Por quê.** Química medicinal é química orgânica aplicada. O que muda entre um aluno de ensino
médio e um mestrando não é o motor — é a régua de vitória. Separar em dois produtos duplicaria o
trabalho e dividiria a audiência.

**O cuidado.** A união é em profundidade, não em densidade de tela. Mostrar tudo para todos ao
mesmo tempo é o que polui a interface.

---

## D-05 · Interface de tela, não painel de instrumentos

**Decisão.** A tela de desenho ocupa tudo. Ferramentas flutuam numa barra discreta, métricas
essenciais numa faixa compacta, e todo o resto vive numa gaveta que abre sob demanda.

**Por quê.** A primeira versão do protótipo mostrava tudo o tempo todo e ficou poluída. Um
ambiente de criação precisa que a criação seja o objeto principal e o resto se afaste.

**A referência mental.** Figma e Excalidraw, não Bloomberg Terminal.

---

## D-06 · A paleta vem do teste de chama

**Decisão.** Cobre (turquesa) como cor da marca; bário, sódio, lítio e césio como papéis
semânticos. Neutros com viés azul-violeta, tirados do cone interno da chama do bico de Bunsen.

**Por quê.** É literalmente a cor que a química tem: cada elemento emite na própria frequência
ao queimar. Nenhuma cor foi escolhida por gosto — todas têm um elemento por trás. E dá de
graça uma paleta categórica coerente para gráficos.

**A restrição que saiu daí.** As cores CPK pertencem ao átomo. Nenhum botão, link, borda ou
estado semântico pode usar cor CPK — se a interface pinta de vermelho, o vermelho deixa de
significar oxigênio. Foi por isso que o acento é turquesa: nenhum elemento comum é turquesa
no CPK.

---

## D-07 · O nome é Rotamer

**Decisão.** Rotamer, com símbolo em projeção de Newman escalonada.

**Por quê.** Um rotâmero é o isômero que existe por causa da rotação em torno de uma ligação
simples — o momento assinatura do produto, quando a vibração mostra o etano girando livre e o
eteno se recusando. Em português é *rotâmero*, reconhecível sem tradução. E atravessa as duas
trilhas: análise conformacional na orgânica, contagem de rotacionáveis em Lipinski e Veber
na medicinal.

**Descartados, com a colisão encontrada:**

| Nome | Colisão |
|---|---|
| Kekulé | Kekule.js, toolkit de quimioinformática com paper no JCIM e pacote npm |
| Bunsen | produto lançado pela Schrödinger, co-cientista de IA para descoberta molecular |
| Ylide | ylide.io, protocolo de mensageria web3 com investimento |
| Anomer | anomer.bio, empresa de monossacarídeos sintéticos |
| Moiety | Moiety, Inc., com marcas registradas |
| Kovalent | Grupo Kovalent, empresa brasileira de reagentes para análises clínicas — mesmo país, campo adjacente |

**A lição de processo.** A primeira verificação do Kovalent deu "livre" porque a busca usada
devolveu blogs de naming em vez de empresas, e o DNS não foi consultado. **Ordem correta:
consultar DNS primeiro, depois buscar empresa, depois INPI.** DNS sem registro não é o mesmo que
disponível no registrador, e disponível no registrador não é o mesmo que livre no INPI.

**Pendente.** Confirmar `rotamer.app` / `.org` / `.dev` no registrador e a marca no INPI.
A verificação feita aqui foi por DNS e busca; não substitui consulta de marcas.

**Ressalva conhecida.** O UCSF Chimera tem uma *ferramenta* chamada Rotamers — funcionalidade
dentro de um programa, não um produto. E rotâmeros são mais associados a cadeias laterais de
proteína do que a moléculas pequenas.

---

## D-08 · Produto fechado e comercial — **revogada pelo D-28 em 11/09/2026**

**Decisão.** Código proprietário, todos os direitos reservados. Monetização em camadas, com
uma base gratuita fazendo a distribuição.

**Por quê.** Decisão do titular. Substitui a recomendação anterior de AGPL-3.0.

**O que isso permite.** RDKit é BSD-3 e Three.js é MIT — ambas permitem uso comercial em produto
fechado, mantidas as atribuições. Tecnicamente não há impedimento. Ver `TERCEIROS.md`.

**Atualização — a cobrança fica para depois do contato com escola de verdade (26/08/2026).** A
camada de assinatura estava na Fase 4 e foi **adiada de propósito**. O comprador declarado é a
escola pública, que não compra com cartão: compra por empenho, com nota fiscal, num processo que
nenhum checkout self-service atende. Construir gateway agora seria escolher a forma de cobrar
antes de saber o que se cobra, por quê e de quem — e escopo estourando é o risco número um do
projeto.

Quando a Fase 3 acontecer, a pergunta volta com resposta de professor de verdade. O caminho que
parece certo hoje é **licença por código**: a escola paga por fora e recebe um código que libera a
camada paga para as contas dela, com a mesma mecânica que já move turma e troca de senha. Mas isso
se decide depois de ouvir, não antes.

**O que isso exige atenção:**

1. **Nenhuma dependência GPL ou AGPL entra.** Uma só contamina o produto inteiro. Verificar
   licença antes de instalar virou regra no `CLAUDE.md`.
2. **A Fase de campanhas comunitárias perde a lógica original.** O modelo Foldit/Drugit funciona
   porque as pessoas contribuem para ciência aberta. Contribuir de graça para um produto fechado
   é outra proposta. Ou vira funcionalidade B2B — o laboratório paga para rodar campanhas
   internas com a própria equipe — ou precisa de contrapartida clara para quem participa.
3. **Projeto de extensão universitária fica em xeque.** Extensão pressupõe retorno público, e
   desenvolver produto comercial usando tempo ou recursos da instituição pode configurar
   conflito de interesses. **Antes de vincular o Rotamer à UENP de qualquer forma, verifique as
   regras internas da instituição.** Isso é carreira, não detalhe jurídico.
4. **A tese original era valor para a comunidade.** O modelo em camadas preserva isso — aluno e
   professor individual usam de graça, instituição paga — mas é uma escolha ativa que precisa
   ser mantida quando a pressão por receita aparecer.

**Revisar se.** A adoção travar por desconfiança de ferramenta fechada em ambiente acadêmico,
ou se abrir o núcleo (mantendo fechada a camada de missões e o painel de turma) se mostrar
melhor para distribuição.

---

## D-09 · Educação é o produto; o pesquisador é usuário avançado, não o cliente

**Decisão.** O Rotamer é uma ferramenta de ensino de química orgânica. O comprador é a escola, o
cursinho e a instituição de ensino. O pesquisador é um usuário avançado bem-vindo — não é quem
paga a conta, e o produto para de ser desenhado como se fosse.

**O que provocou.** A pergunta foi direta: *"qual a necessidade de ter missões, sendo que é para
cientistas?"* E a crítica estava certa — missão com tique verde e contador "3/6" é linguagem de
aluno; um mestrando lê aquilo como brinquedo educativo e fecha a aba.

Ao investigar, apareceu uma inconsistência nos próprios documentos deste repositório: o
`ORIGEM.md` registra um pivô "para cientistas", mas o `PITCH.md` descreve um problema de
educação e lista escola e cursinho como compradores. Os dois não concordavam.

**Por quê educação.**

- **Cientista é mercado ruim para este produto.** Pequeno, cético, e já equipado — ChemDraw e
  Maestro pagos pela instituição, PyMOL de graça. E o próprio produto declara que não é
  ferramenta de bancada e não compete com elas. Vender ferramenta científica para quem já tem
  ferramenta científica é subida íngreme.
- **Educação tem gap real e defensável.** Nada decente em português, nada que funcione em celular
  de escola pública, nada que mostre a ligação simples girando ao lado de uma dupla travada.
- **As missões são justamente o que se vende.** São o que o professor usa para dar aula. Cortá-las
  para agradar um público que provavelmente não pagaria seria remover a peça que sustenta a
  receita.

**O que muda no produto.**

1. As missões ficam, e são centrais. Continuam com linguagem de aluno, porque o aluno é o usuário.
2. A trilha Otimização continua existindo, mas **sem linguagem de missão, pontuação ou conquista**.
   Para o usuário avançado ela é ferramenta livre, não jogo.
3. O que preenche a tela em branco para o usuário avançado não é missão — é **importar**. Colar
   SMILES entra no escopo; busca por nome e comparação de análogos ficam para depois do MVP.
4. O `PITCH.md` mantém o foco em educação, agora explicitamente.

**O que isso NÃO significa.** Educação não é licença para ser impreciso. **Professor de química é
químico.** Se o app afirmar algo quimicamente errado, quem pega é ele — e ele não leva mais a
turma para lá. O rigor do núcleo determinístico (D-01, D-02) vale exatamente igual, talvez mais:
numa ferramenta de ensino, um erro não confunde um usuário, confunde uma sala inteira.

**Revisar se.** Um laboratório ou uma empresa aparecer disposto a pagar antes de qualquer escola.
Aí o sinal de mercado vence o raciocínio — mas espere o sinal, não o presuma.

---

## D-10 · A geometria 3D vem do OpenChemLib, não do RDKit

**Decisão.** O RDKit continua respondendo toda pergunta química — validade, valência,
aromaticidade, fórmula, descritores, InChIKey. A **geometria** — conformação inicial e
minimização por campo de força — vem do OpenChemLib (BSD-3-Clause), rodando no mesmo worker,
sempre a partir do molblock que o RDKit já sanitizou.

**O que provocou.** A `ARQUITETURA.md` dizia "Geometria: RDKit ETKDG + MMFF94". Ao implementar,
o pacote publicado se mostrou incapaz disso: o `@rdkit/rdkit` do npm traz apenas a MinimalLib,
que gera coordenadas **2D** e nada mais. Verificado em execução — `has_coords()` devolve 2, e não
existe nenhuma porta para ETKDG, campo de força ou conformação. O plano original não era
executável com a biblioteca que existe.

**As três saídas avaliadas.**

| Saída | Por que não foi escolhida agora |
|---|---|
| Compilar um RDKit WASM próprio com `DGeomHelpers` e `ForceField` | Exige Docker e emscripten, build longo, WASM bem maior e manutenção a cada versão do RDKit. Trava a Fase 1 inteira até o build sair. |
| Calcular a geometria no servidor | É o escape previsto no D-02, mas quebra o "tudo no cliente" da Fase 1: cada mudança de topologia vira ida ao servidor, e escola com internet ruim é o caso de uso, não o caso extremo. |
| **OpenChemLib no cliente** | **Escolhida.** |

**Por quê OpenChemLib.** Licença BSD-3-Clause, compatível com produto fechado. Gerador de
conformações e MMFF94 de verdade, medidos aqui: a aspirina sai de 102,22 para 18,91 kcal/mol, e o
campo de força custa 0,3 ms para montar. São 1,1 MB de JavaScript mais 1,3 MB de tabelas —
frações do WASM do RDKit. E devolve energia a cada parada, o que faz o dobramento na tela ser a
minimização acontecendo, não uma interpolação inventada entre começo e fim.

**Como o D-02 continua valendo.** Não estamos reimplementando química: estamos usando uma segunda
biblioteca estabelecida para a parte que a primeira não cobre. A fronteira é clara e verificada
em teste: **o OpenChemLib só recebe estrutura que o RDKit já aprovou**, e nenhum veredito químico
— validade, aromaticidade, descritor, nota de missão — passa por ele.

**O detalhe que mudou a implementação.** O minimizador do OpenChemLib só escreve coordenadas
quando converge: pedir "doze iterações e me mostre" roda e não devolve nada. Os quadros do
dobramento são obtidos apertando o gradiente aos poucos — cada parada é uma geometria real do
caminho até o mínimo.

**Revisar se.** Sair um build oficial do RDKit.js com ETKDG e MMFF94, ou o OpenChemLib divergir do
RDKit em algum caso que chegue à tela. Neste caso a troca é barata: a fronteira é uma função só,
`generateGeometry(molblock)`.

---

**Atualização — o campo de força não cobre a tabela periódica, e isso não tira a forma.** O MMFF94
tem parâmetros para os elementos da orgânica e um punhado de íons; desenhar estanho, tungstênio ou
qualquer outro fora dessa lista faz o OpenChemLib recusar a montar o campo de força. Antes, a
exceção crua ("Couldn't assign an atom type to atom 3 (Sn)") subia até a tela como erro de programa
e derrubava o editor inteiro, com a molécula desenhada junto.

O que se descobriu ao consertar: **o gerador de conformações não depende do campo de força**. Ele
monta o arranjo tridimensional a partir de comprimentos e ângulos de ligação, e monta bem — o
tetrametilestanho sai com C–Sn de 2,15 Å, contra 2,14 Å de tabela. Então a separação certa não é
"tem geometria ou não tem": é **geometria relaxada** contra **geometria montada**.

A `Geometry` passou a dizer isso (`relaxed`, `unsupported`, e `energy` que pode ser `null`), e a
tela segue a mesma divisão: a forma aparece e gira normalmente; a energia some, porque não existe;
o botão de vibrar fica desligado, com o motivo no `title`; e o painel de modos normais explica que
sem energia não há frequência. Cada coisa que sai da tela sai porque deixou de existir, não porque
o produto desistiu.

---

## D-11 · Postgres local, sem serviço gerenciado

**Decisão.** O banco é Postgres rodando na própria infraestrutura: container em
desenvolvimento, serviço no VPS ao lado do PM2. Nada de Supabase.

**Por quê.** Decisão do titular. O que o Supabase entregava no plano original — banco, auth e
storage numa assinatura só — deixa de valer quando o deploy já é um VPS com PM2: o Postgres passa
a ser um serviço a mais na mesma máquina, e a autenticação vira umas duzentas linhas de sessão
com cookie, que é código que dá para ler inteiro numa tarde.

**O que muda.** A `ARQUITETURA.md` dizia "Postgres + Prisma (Supabase no início)". Continua
Postgres + Prisma; some o intermediário. A única coisa que troca entre ambientes é a
`DATABASE_URL`.

**O que ganhamos junto.** Sem dependência de terceiro no caminho do login, sem cota de linhas, e
o dado de aluno fica onde a instituição consegue apontar — o que importa quando o comprador é
escola.

**O que perdemos.** Backup, réplica e atualização de versão passam a ser nossos. Vale escrever
isso no `DEPLOY.md` antes de existir o primeiro aluno, não depois.

---

## D-12 · O catálogo de missões vive no código, não no banco

**Decisão.** Não existe tabela `quest`. As missões são um módulo TypeScript versionado junto com
o motor que as avalia; a tentativa guarda o `slug`.

**Por quê.** A `spec` da missão é código executável: condições sobre descritores que o RDKit
calcula. Guardar isso no banco criaria duas fontes — a linha na tabela e a função que a interpreta
— e elas podem discordar. Missão editada no banco mudaria a nota de todo mundo sem nenhum commit,
sem revisão e sem teste. Enunciado de missão é conteúdo de aula: passa por revisão como código.

**A ressalva da `ARQUITETURA.md`.** O documento previa a tabela `quest` com `spec jsonb`. Isso
volta a fazer sentido quando existir editor de missões para professor — aí a missão passa a ser
dado do usuário, e não conteúdo do produto. Até lá, seria complexidade sem dono.

**Revisar se.** Professor pedir para criar a própria missão. É pedido provável na Fase 4.

---

## D-13 · O tutor não escreve número

**Decisão.** A saída do modelo é JSON de schema fechado com três campos de texto, e **texto com
dígito é recusado**. Para citar um valor, o modelo escreve uma referência entre chaves —
`{{tpsa}}`, `{{molarMass}}` — e quem troca a referência pelo número é a interface, com o valor que
o RDKit calculou.

**Por quê.** O D-01 diz que a IA explica e não decide. Na prática isso vaza pelo texto: basta o
modelo escrever "a massa é 180,2" com um arredondamento diferente do que está na faixa de métricas
para a tela se contradizer sozinha — e quem lê não tem como saber qual dos dois está certo. Com
referência, não existe caminho pelo qual um número gerado chegue à tela.

**Como é imposto.** A validação recusa em vez de corrigir: resposta com dígito solto é descartada
e o tutor diz que não conseguiu explicar. Quantidade pequena por extenso continua permitida —
"dois carbonos" não é número na tela, é português.

**O que mais entrou junto.** Cache por `(inchikey, missão, tipo de ajuda)`, porque o mesmo erro na
mesma missão produz a mesma explicação e ela serve para todo mundo; teto de pedidos por pessoa por
dia, com degradação para as dicas escritas à mão; e o tutor desligado quando não há chave, sem
tirar nada do resto do produto.

**Revisar se.** Aparecer necessidade de o tutor citar valor que o núcleo não calcula. Aí a
resposta é ampliar a lista de referências — nunca liberar o dígito.

---

## D-14 · A vibração é dinâmica molecular de verdade

**Decisão.** Depois que o dobramento chega ao mínimo, a molécula passa a vibrar por integração de
Newton — velocity-Verlet, passo de meio femtossegundo, banho a 300 K — com as forças saindo do
**mesmo potencial MMFF94** que encontrou a geometria. A trajetória é pré-calculada no worker e
entra no cache por InChIKey junto com a conformação.

**O que quase aconteceu.** O `README.md` prometia "vibrando sob dinâmica molecular" desde o
primeiro dia, e a promessa ficou sem lastro durante toda a Fase 1: o OpenChemLib expõe energia mas
não expõe gradiente, e reconstruir o campo de força a cada avaliação custava vinte milissegundos
por passo. A alternativa era animar uma senoide e chamar de vibração — que é exatamente o tipo de
mentira que o D-01 existe para impedir, só que na física em vez da química.

**O que destravou.** O campo de força guarda as coordenadas num vetor interno; escrevendo nele, a
energia sai em três microssegundos. Com isso o gradiente por diferença central de uma molécula do
tamanho da aspirina custa menos de meio milissegundo, e uma trajetória de noventa quadros sai em
menos de cem.

**O risco, que é real.** Esse vetor não faz parte da API pública do OpenChemLib: é detalhe interno,
alcançado por um nome minificado que pode mudar na próxima versão. Três defesas:

1. O vetor é **descoberto pelo formato e confirmado pelo comportamento** — precisa ter 3N posições
   e precisa mudar a energia quando mexido. Nada é assumido pelo nome.
2. Antes de simular, a energia da montagem é comparada com a do fim do dobramento. Se não bate, a
   ordem dos átomos não é a mesma e a simulação é abandonada — vibrar a molécula errada é pior do
   que não vibrar.
3. Falhou qualquer uma das duas, a cena mostra a forma parada e o produto segue. E o teste
   `dynamics.test.ts` quebra alto, que é como se descobre no dia da atualização em vez de na aula.

**Revisar se.** O OpenChemLib passar a expor gradiente analítico — aí some o acesso interno e a
simulação fica mais precisa de graça.

---

**Atualização — a reprodução precisa de dois relógios.** A física estava certa e a tela estava
errada. Um relógio só, começando na montagem da cena, fazia duas coisas ruins: da segunda
molécula em diante o tempo já tinha passado dos dois segundos do dobramento, e toda estrutura
nova nascia pronta — a animação simplesmente não rodava; e a vibração, amostrada a partir do
mesmo relógio deslocado, entrava num quadro qualquer do ciclo quando a trajetória chegava do
worker, dando um salto visível. Agora são dois: o do dobramento zera quando a geometria troca, e
o da vibração zera quando a trajetória chega ou quando o movimento é religado — a vibração
sempre começa no quadro zero, que é a própria geometria mínima, e a emenda tem deslocamento zero.

Três hipóteses foram levantadas e **derrubadas por medição**, e ficam registradas para não serem
reinventadas: a vibração não é rápida demais (acima de 2500 cm⁻¹ está só 0,4%–6,9% do movimento
de qualquer hidrogênio; o que se vê são os modos abaixo de 800 cm⁻¹); o dobramento não precisa
ser parametrizado por deslocamento em vez de índice de quadro; e trocar a interpolação linear
entre quadros por Catmull-Rom mudaria menos de um pixel na tela.

---

## D-15 · O produto não nomeia; quem descobre, batiza

**Decisão.** Não existe motor de nomenclatura no Rotamer. O que existe é **autoria**: uma
estrutura que o RDKit aceitou e que ninguém registrou antes pode receber um apelido de quem a
desenhou, e esse apelido aparece sempre junto com o nome de quem deu.

**A pergunta que provocou.** "O produto vai nomear molécula?" — levantada na revisão de escopo
depois da v0.1. Calcular nome IUPAC é um projeto próprio, com armadilhas de numeração,
ramificação e prioridade de grupo que o RDKit.js não resolve. Fingir que resolve seria repetir o
erro do kernel próprio, agora na nomenclatura.

**Por que autoria em vez de nomenclatura.** A InChIKey já é a identidade da molécula no produto, e
o modelo de dados já falava em "crédito de redescoberta". Batizar transforma a mesma chave em algo
que o aluno entende: se você chegou primeiro naquela estrutura, o nome é seu. É a mecânica do
produto trabalhando a favor do que ele já sabe fazer.

**As regras, e por que existem.**

- **Apelido não pode parecer nomenclatura.** Fórmula (`C9H8O4`) e palavra sistemática solta
  (`butanol`) são recusadas, com explicação. Apelido que se passa por nome de verdade é pior do
  que apelido nenhum: cria no aluno a impressão de que o produto nomeou.
- **Nunca aparece sozinho.** Em toda tela onde o apelido aparece, "batizada por Fulano" aparece
  junto. É autoria, e autoria tem dono visível.
- **Requer conta**, porque um apelido sem responsável não é autoria.
- **Vale para a estrutura, não para o desenho.** Duas pessoas que cheguem à mesma molécula por
  caminhos diferentes encontram o mesmo apelido. Quem chegou primeiro fica com ele.

**O limite que precisa ficar dito.** O Rotamer não sabe se o composto existe fora dele. "Ninguém
batizou" quer dizer "ninguém batizou aqui dentro", e a tela diz isso com essas palavras. A
verificação de existência real entra junto com a busca por nome no PubChem, na v0.2 — e aí a
mensagem muda de "ninguém batizou" para "este composto já é conhecido como tal".

**Revisar se.** Aparecer motor de nomenclatura confiável em WebAssembly, ou a busca do PubChem
mostrar que quase toda estrutura desenhada em sala já é conhecida — o que tornaria o batismo raro
o bastante para virar conquista em vez de funcionalidade.

**Atualização — a verificação existe.** A consulta ao PubChem por InChIKey entrou junto com a
busca por nome: composto já conhecido não recebe apelido, e a tela mostra o nome registrado lá
com o CID. Quando o PubChem não responde, o produto **diz que não sabe** e o batismo continua
valendo aqui dentro, com a ressalva na tela — três estados, não dois, porque "não consegui
verificar" não é "é inédito".

**Atualização — quem batiza, guarda.** Batizar e guardar continuam sendo coisas diferentes: o
apelido é da **estrutura** e vale para todo mundo; a estante é **de quem entrou**. Mas ninguém dá
nome a uma molécula que não quer manter, e a pergunta "batizar é o jeito de salvar?" apareceu
assim que as duas ações ficaram lado a lado na mesma tela. A resposta do produto passou a ser
"não, mas batizar guarda junto": o batismo grava o `MoleculeName` e em seguida põe a estrutura na
estante de quem batizou. Os três caminhos que guardam — guardar de propósito, cumprir uma missão
e batizar — passam pelo mesmo lugar (`apps/web/lib/molecule-store.ts`), para não haver três
versões da mesma gravação com regras diferentes. Se guardar falhar, o batismo continua valendo:
perder a cópia na estante é menos grave que desfazer autoria.

**Atualização — 27/08/2026: a justificativa caiu, a decisão fica de pé por outro motivo.**

O `researcher` levantou o estado do mundo (`docs/pesquisa/nomenclatura.md`) e derrubou a premissa
implícita desta decisão. "Não existe motor de nomenclatura aberto e com licença que sirva" **é
falso desde hoje**: o `openclatura` 0.3.1 é MIT, determinístico, sem modelo e sem tabela de
consulta, roda sobre o próprio RDKit, e foi medido aqui nomeando 30 de 30 moléculas de orgânica de
ensino médio, com round-trip 30/30 pelo OPSIN e **zero divergência silenciosa**. Existe também o
STOUT, MIT — e esse cai pelo D-01: é rede neural com 83,52% a 89,86% de acerto medidos pelos
próprios autores, exatamente o perfil que este repositório usa para vetar o LLM. Fica registrado
que a premissa era falsa, porque alguém ia descobrir.

**O produto continua não nomeando — não porque não dá, porque escolhemos não.** Quatro razões,
nesta ordem:

1. **Nenhum motor fala português.** O `openclatura` devolve `ethyl acetate`; o OPSIN entende
   3 de 42 nomes em pt-BR contra 42 de 42 em inglês. Toda a interface deste produto é pt-BR, e um
   aluno de 3ª série lendo `N-(4-hydroxyphenyl)acetamide` não recebeu um nome, recebeu uma string
   estrangeira. E traduzir nome de composto **é decidir estrutura**: cai no D-01, não pode ser o
   LLM, e vira dicionário nosso, revisado por químico, para sempre. É o kernel próprio outra vez
   (D-02), agora na nomenclatura.
2. **Nomear é chamada de rede, não código no worker.** Medido: não existe motor estrutura→nome em
   JS ou WASM com licença permissiva — nem `indigo-ketcher`, nem `ketcher-core`, nem o RDKit.js
   (`iupac` → 0 no `.wasm`, com o controle positivo `inchi` → 62 no mesmo arquivo). Seria um
   serviço a mais em produção, para sempre, que não funciona offline e cai junto com o VPS. Em
   27/08/2026 o PubChem respondeu 503 o dia inteiro, em cinco conjuntos de tentativas — não é
   hipótese remota, foi o estado do mundo hoje, e o produto já depende dele. Escola pública em 3G é
   o caso de uso, não o caso extremo.
3. **É beta 0.3.1, de um laboratório só, criado em 8 de maio de 2026.** A licença MIT permite fork,
   o que limita o dano e não o elimina: fork de motor de nomenclatura é passar a ser dono de
   nomenclatura.
4. **Ninguém pediu, e o ensino brasileiro cobra a direção oposta.** A BNCC do Ensino Médio não
   cobra nomenclatura (IUPAC: 0 ocorrências no PDF do MEC). Em seis anos de ENEM, nenhuma questão
   pediu o nome de uma estrutura desenhada. SEDUC-SP e Unicamp cobram nas duas direções, e onde o
   aluno erra é **desenhando a partir do nome** — 41,59% de zeros na questão 9 da Unicamp 2005. E
   Shute (2008) mede que dar a resposta antes da tentativa anula o feedback.

**O gatilho estava mal escrito, e isto é o que ele queria dizer.** O texto acima manda revisar "se
aparecer motor de nomenclatura confiável **em WebAssembly**". Ao pé da letra nada disparou — o
`openclatura` é Python. Mas "WebAssembly" ali não era requisito de tecnologia: era o jeito curto de
dizer *roda onde o produto roda, sem serviço novo, sem rede, no celular fraco da escola pública*.
Escrever a tecnologia no lugar da restrição foi erro de redação, e ele quase escondeu uma premissa
falsa atrás de um gatilho que jamais dispararia. **O gatilho passa a ser este — três condições que
valem juntas:**

1. **O nome sai em português**, vindo do motor ou de um mapeamento determinístico nosso que um
   químico revisou. Nunca do LLM.
2. **Um professor de química marcou nome a nome** a lista de moléculas que as trilhas usam e disse
   quantos aceitaria numa prova. Round-trip válido não é nome de livro: 2 dos 30 medidos saíram em
   forma correta e menos comum (`2-(acetoxy)benzoic acid` no lugar de "ácido acetilsalicílico").
   Sem esse número ninguém sabe se é "quase lá" ou "não serve".
3. **Existe verificação, e o produto cala quando ela não confirma.** Nome que o round-trip não
   confirmou não chega à tela. Motor beta falando sozinho para uma sala inteira é o D-01 ao
   contrário.

Antes das três, a pergunta que custa zero: **qual das duas direções o professor quer** — "nomeie o
que eu desenhei" ou "corrija o nome que meu aluno escreveu". São produtos diferentes, com custos
muito diferentes, e a sessão de observação da Fase 3 responde de graça. As perguntas exatas estão
no `docs/ROADMAP.md`. Os caminhos que ficaram em pé, com o preço de cada um, estão no `DEPOIS.md`.

**Atualização — 27/08/2026: a regra do apelido errava nos dois sentidos, e o remédio muda de
lugar.**

Medido em `apps/web/lib/molecule-name.ts:35`: `parece-sistematico` é um sufixo solto sobre palavra
única e **recusa** `Camila`, `Sol`, `Cristal`, `Girassol`, `Farol`, `Carnaval` e `Ludmila`; a regra
de fórmula recusa `Ba` e `Na`. Enquanto isso, **aceita** `cafeina`, `aspirina` e `anilina`. Barra o
primeiro nome da aluna e deixa passar o nome trivial de composto real: o inverso do que ela existe
para fazer. Recusar "Camila" na frente da turma encerra uma sessão de observação antes de ela
começar.

**O que muda.** Esta decisão diz que "apelido que se passa por nome de verdade é pior do que
apelido nenhum". Continua verdade — e continua não sendo motivo para pôr o custo no aluno. Nenhuma
expressão regular sobre morfologia do português separa `Girassol` de `butanol` sem errar de um lado
ou do outro; a escolha é qual dos dois erros se prefere, e **prefere-se deixar passar**. O peso que
estava todo na cadeia de caracteres volta para onde esta decisão já o tinha posto: **o apelido
nunca aparece sozinho**. "batizada por Camila" ao lado transforma o apelido em autoria, e é por
isso que essa parte — que já existe em `NamePanel`, em `/m/<smiles>` e na estante — passa a ter
teste que a trava, em vez de ser hábito.

A regra escrita continua recusando o caso inequívoco (fórmula, SMILES, e nomenclatura sistemática
que um químico reconheceria como tal), mas nenhum apelido é recusado sem que exista um caso
verdadeiro que justifique a recusa. **A lista de nomes triviais de composto é dado de química e
não se inventa aqui**: ou vem de fonte revisada por químico, ou não vem. Fica no `DEPOIS.md`, e só
entra se a revisão da Fase 3 mostrar que a colisão incomoda de verdade.


---

## D-16 · A bancada é a tela inteira; o resto entra quando chamado

**Decisão.** A tela de desenho ocupa toda a janela. Em cima, uma faixa fina com a fórmula, a
massa e o estado da estrutura; à esquerda, a barra de ferramentas em pé; no pé, os números que
mudam a cada traço; no canto, a cena 3D flutuando. Análise, missões, tutor, batismo e SMILES
moram num painel lateral que começa fechado.

**Por quê.** A versão anterior dividia a janela em duas colunas fixas e uma faixa de cabeçalho
alta: a molécula ficava com menos de metade da tela e, num notebook, o hexágono do benzeno saía
do tamanho de uma moeda. O que precisa de espaço é o desenho — é nele que se trabalha. Fórmula,
massa e o veredito "válida" são as três coisas que precisam estar visíveis **sempre**, e cabem
numa faixa de 46 px.

**O que isso obriga.** Enquadrar passou a descontar o que está por cima da tela: a barra em pé, a
faixa de números e a cena 3D viram margens, e a molécula é centrada no espaço que sobra, não no
centro geométrico da janela. Sem isso, "enquadrar" jogaria metade da estrutura atrás da cena.

**No celular** o painel entra embaixo da tela de desenho, não por cima: escolher a missão não
pode significar não poder desenhar.

---

## D-17 · A cor de elemento tem duas formas: a esfera e a letra

**Decisão.** Os 118 elementos têm cor CPK em `packages/ui/src/cpk.css`, em dois conjuntos:
`--cpk-*` é a cor do átomo desenhado — a esfera na cena 3D — e `--cpk-ink-*` é a mesma cor levada
até 4,5:1 contra a superfície do tema, para quando o elemento aparece **escrito**.

**Por quê.** A esfera do hidrogênio é branca, e tem que continuar branca: é assim em toda a
literatura. Mas a letra H escrita em branco sobre papel branco não existe. Ou se aceita um
hidrogênio cinza na cena — errado para quem conhece a convenção — ou se aceita um rótulo
ilegível no desenho. Com dois tokens, nenhum dos dois.

**De onde vêm os valores.** Os dez elementos da orgânica mantêm os tons já ajustados do produto.
Os outros cento e oito são a paleta CPK/Jmol, a mesma que PyMOL e Avogadro usam — inventar
paleta própria faria o aluno ver aqui um enxofre de cor que não existe em nenhum outro lugar. O
que muda por tema é só a claridade; o matiz nunca.

**A regra continua valendo.** Cor CPK só aparece em átomo — inclusive quando o átomo é uma letra
na barra de ferramentas ou na tabela periódica. Seleção, foco e estado seguem sendo turquesa.

---

## D-18 · O átomo aceso é um só, nas duas telas

**Decisão.** Passar o cursor sobre um vértice do desenho acende a esfera correspondente na cena
3D, e vice-versa. A cena diz de que elemento se trata e qual átomo do desenho ele é.

**Como.** Cada átomo da geometria carrega `source`: o índice do átomo do grafo que o originou. Os
hidrogênios que o campo de força acrescentou não existem no desenho, então apontam para o vizinho
em que estão pendurados — apontar um H na cena acende o carbono dele, que é o que a pessoa está
procurando.

**Por que importa.** As duas telas mostram a mesma molécula, e até aqui não havia como saber que
esfera era que traço. Numa cadeia com quatro carbonos parecidos, essa correspondência é a
diferença entre a cena 3D ser informação e ser enfeite.

**O halo é turquesa** — a cor da marca — justamente porque nenhum elemento é turquesa no CPK: o
destaque nunca vai ser lido como um átomo de outro elemento.

---

## D-19 · Recuperar senha sem e-mail: quem emite o código é o professor

**Decisão.** Quem esqueceu a senha não recebe link por e-mail. Pede um código ao professor da
turma, digita em `/senha` e troca ali mesmo.

**Por quê.** O comprador é a escola e o usuário é o aluno. Em escola pública, muito aluno não tem
e-mail próprio; o que tem, não abre na aula — e a aula é justamente o momento em que a senha
falta. Um fluxo por e-mail transforma "esqueci a senha" em "perdi a aula". Some-se a isso o que o
e-mail arrasta: conta SMTP, domínio com SPF e DKIM, entrega em caixa de spam e mais um serviço
externo no caminho crítico de quem já está travado.

**Quem pode emitir.** Três regras, e as três valem no servidor:

1. só conta com papel `professor` emite — e **professor não se autodeclara**: quem promove é
   `apps/web/scripts/promote-teacher.mjs`, rodado por quem tem acesso ao servidor;
2. só para conta da **mesma escola**, que precisa estar preenchida nos dois lados;
3. **nunca para outro professor** — senão o caminho vira escada para tomar a conta de quem emite.

**O código.** Oito caracteres de um alfabeto sem `0`, `O`, `1`, `I` e `L`, porque ele vai ser lido
de um papel e ditado em voz alta numa sala com trinta pessoas. Vale por 24 horas, serve uma vez
só, e emitir outro para a mesma conta mata o anterior. No banco fica só o resumo SHA-256 — se o
banco vazar, os códigos em circulação continuam inúteis, que é o mesmo cuidado tomado com senha e
com sessão. Trocar a senha encerra as sessões abertas daquela conta.

**O que a tela não conta.** "E-mail não existe", "código errado", "código vencido" e "código já
usado" recebem a mesma mensagem. Separar os casos transformaria a tela num jeito de descobrir
quem tem conta no produto.

**Revisar se.** A escola pedir autoatendimento fora da aula, ou o produto ganhar uso individual
fora de turma — aí o e-mail passa a valer a infraestrutura que custa. O caminho do professor
continua, porque ele resolve o caso da sala melhor que qualquer link.

---

## D-20 · Modo normal é conta, não animação

**Decisão.** O produto calcula os **modos normais de vibração** de verdade: Hessiana do MMFF94 por
diferenças finitas, ponderação por massa, projeção dos movimentos de corpo rígido e
diagonalização. Cada modo aparece na lista com seu número de onda e pode ser mostrado sozinho na
cena.

**Por que isto e não uma animação bonita.** Vibração molecular tem estrutura: uma molécula com N
átomos tem exatamente **3N − 6** modos — **3N − 5** se for linear, porque girar em torno do
próprio eixo não move átomo nenhum. Cada modo tem uma frequência e um desenho de movimento em que
todos os átomos participam ao mesmo tempo. Isso é conteúdo de aula, e é conferível: o aluno conta
os átomos, faz a conta e o número tem que bater.

**A dinâmica a 300 K continua existindo** (D-14) — ela é a molécula real, com todos os modos
sobrepostos, que é o que acontece na natureza. O modo isolado é a decomposição dela. As duas
coisas na mesma cena, uma de cada vez.

**Onde a projeção entra.** Os seis (ou cinco) movimentos de corpo rígido são removidos do espaço
**antes** de diagonalizar, e não descartados depois por um limiar escolhido a dedo. É a diferença
entre a contagem sair certa por construção e sair certa por sorte.

**O que é exagerado, e a tela diz.** Amplitude e velocidade. Um estiramento C–H completa um ciclo
a cada 11 femtossegundos e a amplitude térmica é uma fração de ångström: em tempo real e em escala
real, não se vê nada. O que está certo é a forma do movimento — quem anda, para onde, em que
proporção.

**O que não é nosso.** As frequências são do MMFF94. Campo de força clássico com potencial
harmônico superestima estiramento em torno de 5% a 10%, e a interface diz isso: o número serve
para comparar modos entre si, não para conferir tabela de infravermelho.

**O CO₂ é o caso que ensina.** Nele o MMFF94 dá dois modos de dobramento **imaginários** — a
geometria linear, que é a certa, não é mínimo nesse campo de força; medimos, e a energia cai de
70,0 para 49,5 kcal/mol ao dobrar. O produto **mostra o número negativo e explica**, em vez de
esconder ou, pior, dobrar a molécula para agradar o campo de força. Entortar o CO₂ para satisfazer
uma parametrização ruim seria ensinar química errada com a geometria mais famosa do ensino médio.

**Teto de tamanho.** Cinquenta átomos com hidrogênio. A Hessiana custa 36N² avaliações de energia
e a diagonalização é O(N³) — acima disso o celular fraco, que é o caso de uso, congela. Passou do
teto, a tela diz que não calculou.

---

## D-21 · Estereoquímica: o desenho decide, o RDKit atribui

**Decisão.** O editor desenha cunha cheia e cunha tracejada, e a informação vive **no grafo** —
`wedge` é propriedade da ligação, não do traço na tela. O molblock escreve isso na coluna de
estereoquímica do V2000 (1 para cunha, 6 para traço), e quem lê e atribui `R`, `S`, `E` e `Z` é o
RDKit, pela regra de Cahn–Ingold–Prelog.

**Por que o RDKit e não nós.** A regra CIP tem casos que ninguém acerta de cabeça — prioridade por
número atômico, depois por esfera, com duplicação de átomos em ligações múltiplas e desempate por
configuração. Escrever isso à mão seria exatamente a perícia química que o D-01 proíbe, com o
agravante de que o erro seria silencioso: um `R` onde devia estar `S` não parece errado em tela
nenhuma.

**A ponta fina fica no átomo estereogênico.** É por isso que a direção da ligação é parte do dado:
`from` é a ponta fina, `to` é a larga. Virar a cunha de lado — Shift na ferramenta — troca a
configuração do centro, e é assim que se desenha o enantiômero sem apagar nada.

**O `?` é resposta, não ausência dela.** Centro que existe e que o desenho não definiu recebe `?`
ao lado do átomo, em tom mais claro. Sem isso, "estereocentros: 1 — 1 sem configuração" na faixa
de números não diz **qual** átomo está em aberto, e numa molécula com três centros isso é a
diferença entre corrigir e adivinhar.

**A cunha entra na chave de topologia.** Trocar a configuração de um centro é trocar de molécula:
a geometria 3D é recalculada, o cache por InChIKey separa os enantiômeros, e a cena mostra a forma
espelhada — verificado por teste, pelo sinal do produto misto dos vizinhos do centro.

**Cunha e traço não atravessam para o 3D — e não deveriam.** Eles são notação de **projeção**: um
jeito de escrever profundidade num papel que não tem profundidade. Na cena tridimensional a
profundidade é real, e desenhar um traço pontilhado ali significaria outra coisa — ligação de
hidrogênio, ligação parcial, interação fraca. O que atravessa é a **letra**: `R` e `S` aparecem ao
lado do mesmo átomo nas duas telas, e a diferença entre os enantiômeros aparece onde ela existe de
verdade, que é na forma.

**O que ainda não existe.** Cunha ondulada (`either`, o "não se sabe de que lado") é lida do
molblock como plano, porque desenhar uma coisa que significa "indefinido" e tratá-la como definida
seria pior que ignorá-la. Estereoquímica de anel e atropoisomeria não têm tratamento próprio: o
RDKit percebe o que dá para perceber do desenho plano, e nada além disso é afirmado.

---

## D-22 · O professor vê onde a turma parou, não o que cada aluno desenhou

**Decisão.** A turma é uma lista de alunos e um código de seis caracteres que o professor escreve
no quadro. Quem entra digita o código — sem convite por e-mail, pela mesma razão do D-19. O painel
da turma mostra, por aluno: missões cumpridas, missões em que travou e quando foi a última vez que
apareceu. E, no topo, **a lista de missões em que mais gente travou**.

**Por que essa é a tela.** A pergunta do professor não é "quem foi melhor" — é "onde a aula
parou". A primeira coisa da tela é a lista das missões que mais travaram porque é dela que sai o
assunto da aula seguinte. Ranking de aluno seria fácil de fazer e serviria para outra coisa:
comparar pessoas.

**Travar = abrir e não cumprir.** Escolher a missão na lista é ato deliberado, e é isso que o
produto grava — uma linha por pessoa e missão, que reabrir não multiplica. A alternativa que
parecia melhor, gravar o abandono quando a pessoa troca de missão, não funciona no caso mais
comum de todos: fechar a aba. Limpeza de efeito não roda quando a aula acaba.

**O que o professor não vê.** As moléculas que o aluno desenhou fora das missões. Elas ficam na
estante dele, e vigiar trabalho criativo é outra coisa, com outro nome. O que a tela mostra é
progresso de missão, avaliado no servidor a cada tentativa — nunca a nota que o navegador mandou.

**Turma é do professor que abriu.** Outro professor, mesmo da mesma escola, não abre o quadro de
uma turma que não é dele: a consulta filtra por dono, e não por papel.

---

## D-23 · Selecionar é gesto de desenho, e a seleção morre quando o grafo muda

**Decisão.** O editor 2D ganha uma ferramenta **Selecionar** (tecla `V`), com retângulo de
seleção, duplo clique para pegar o fragmento conectado inteiro, e três ações em bloco: mover,
apagar e trocar — elemento de todos os átomos, ordem de todas as ligações. **Não** entra
estereoquímica em bloco.

**A pergunta que provocou.** "Falta selecionar uma ligação inteira específica ou uma grande parte
facilmente, pois no momento eu só consigo ir um a uma." É atrito de desenho, não funcionalidade
de química: não toca no RDKit e não cria promessa nenhuma.

**A tecla é `V`, não `S`.** `s` é o enxofre no mapa de elementos, e tioéter aparece em aula. É o
mesmo erro do `f`/enquadrar que já custou o atalho do flúor — repeti-lo com o enxofre seria pior.

**Cunha e traço não entram em bloco, e isso é D-01.** `BondWedge` prende a ponta fina no átomo
`from` (D-21): aplicar "cunha cheia" a oito ligações define oito configurações que ninguém
escolheu, e o RDKit devolveria `R`/`S` que a pessoa não desenhou. Erro silencioso de química, que
é o único tipo que este produto não pode cometer.

**A seleção morre quando o grafo muda, e não é excesso de zelo.** `fromMolblock` **renumera** os
átomos a partir de 1 — e é por ele que passam organizar o desenho, carregar exemplo e colar SMILES.
Seleção guardada atravessando um desses aponta para átomos **diferentes com o mesmo número**:
errado e silencioso, que é pior que vazio. Por isso `commit` limpa a seleção por padrão e quem
precisa preservá-la pede (`keepSelection`); `amend` poda o que sumiu; `undo`, `redo` e `clear`
zeram. Esquecer cai no seguro, nunca no errado — é a mesma regra que o `store` já usava para
hidrogênios, estereoquímica e átomo culpado: número velho num desenho novo é pior que número
nenhum.

**A travessia do fragmento mora no núcleo**, não no editor: é grafo, e grafo se testa sem
navegador. Anel e grupo funcional continuam sendo pergunta para o RDKit — "selecionar o anel" não
entra por isso, e está no `DEPOIS.md`.

**Um gesto mudou de sentido.** Shift+clique parado no vazio deixou de criar átomo e passou a
soltar a seleção. Está coberto por teste de regressão nomeado, porque gesto que muda em silêncio
volta como bug.

**O que a revisão pegou, e que vale registrar.** Dois dedos movem a vista em modo Selecionar — e
o primeiro dedo, ao encostar, já trocava a seleção: mover a vista destruía o bloco. A seleção
anterior passa a ser devolvida quando a pinça começa. E o arrasto da seleção passou a usar a
mesma folga de clique do resto do editor (12 px no dedo): sem ela, dedo firme virava "arrastou", e
o duplo toque nunca aconteceria.

**Revisar se.** As sessões de observação mostrarem que ninguém acha a ferramenta — aí o caminho é
o gesto sem modo (Shift+arrasto), não mais um botão no trilho.

---

## D-24 · Organizar mexe na cunha, e o produto diz o que fez

**Decisão.** Organizar o desenho continua sendo do RDKit, e ele continua livre para reescrever as
cunhas. O que muda é que o produto **relata**: quantas saíram, quantas mudaram de ligação, quantas
trocaram de tipo — e se a configuração dos centros continua a mesma. A tela conta isso em uma
frase que ensina a química do caso.

**A pergunta que provocou.** "Quando eu organizo o desenho, a cunha some. Isso não estaria
correto, estaria?" Estava correto e estava calado, que é o problema. Medido: cunha em átomo sem
centro estereogênico **some**, porque não definia nada; cunha em centro de verdade **vira traço**
ou **muda de ligação**, com o rótulo CIP idêntico antes e depois.

**Três coisas diferentes, três frases diferentes.** A primeira versão contava cunha por ligação, e
com isso "mudou de ligação" virava "saiu". A alanina com a cunha no C–N saía com a mesma contagem
do etanol — e a tela diria, a um centro estereogênico legítimo, que "cunha só vale em centro
estereogênico". Mentira dita para uma sala inteira, que é o erro que este produto não pode
cometer. A conta passou a ser por **átomo de origem**: se aquela ponta continua tendo cunha, o
desenho mudou; se não, a cunha saiu de verdade.

**A conferência de configuração lê o desenho que sai.** A primeira versão perguntava duas vezes ao
mesmo objeto do RDKit, antes e depois de `set_new_coords` — que troca o confôrmero e não encosta na
marca de quiralidade do átomo. A resposta era sempre "igual": uma tautologia com cara de
conferência. Agora o molblock devolvido é relido do zero, porque é ele que chega ao aluno.

**Quando a configuração mudaria, organizar não acontece.** O resultado é descartado e a tela diz
que não conseguiu organizar sem mexer na molécula. Nunca foi observado em mais de sessenta
moléculas quirais medidas — e é justamente por isso que precisa existir: no dia em que acontecer,
o produto não pode entregar em silêncio uma molécula que a pessoa não desenhou.

**Revisar se.** O RDKit passar a expor a razão pela qual removeu uma cunha — hoje a razão é
inferida da ausência de centro, e inferência se troca por fato assim que o fato existe.

---

## D-25 · Só o professor orquestra e cria exercícios

**Decisão do dono do produto, 28 de agosto de 2026.** Quem monta a sequência de exercícios para a
turma e quem inventa exercício novo é **o professor**. O aluno resolve; não organiza nem cria.

**Esclarecimento, no mesmo dia.** Criar missão própria é **opcional para o professor** — ele pode
montar o roteiro só com o catálogo, só com missões dele, ou misturando. O que a decisão fecha é
**quem** pode: só o professor cria, e só o professor orquestra. O catálogo continua existindo
como material pronto; o que ele não é mais é o único caminho.

**Como criar sem quebrar a regra que não se quebra.** Missão é verificada pelo RDKit sobre a
molécula (D-01). Enunciado escrito à mão não é verificável, e objetivo escrito à mão pode ser
impossível de cumprir — "um álcool com fórmula C2H4O" não existe, e o aluno passaria a aula
tentando. O caminho que respeita o D-01 é **o professor desenhar a resposta, e o produto extrair
os objetivos dela**: fórmula, grupos funcionais, contagem de átomos, centros estereogênicos — tudo
calculado da molécula que o RDKit aceitou. O professor escolhe quais desses objetivos cobrar e
escreve o enunciado e as dicas; a parte que decide química nunca é digitada.

**O que continua verdade.** O aluno vê progresso, não ranking (D-22). A trilha Otimização continua
sem missão (D-09). E o papel de professor continua sendo dado por quem administra, nunca
autodeclarado (D-19) — o que agora importa mais, porque professor passa a publicar conteúdo para
menores de idade.

**Em aberto.** O catálogo atual — as 16 missões que qualquer pessoa abre sem conta — continua
existindo como exploração livre, ou passa a ser só matéria-prima para o roteiro do professor? As
duas leituras cabem na decisão; a diferença é o que o aluno sem professor encontra ao entrar.

---

## D-26 · O catálogo é para quem tem conta, e é buscável

**Decisão do dono do produto, 28 de agosto de 2026**, respondendo às perguntas da especificação
das listas (`docs/ROTEIROS.md`, §9).

1. **Nota de lista não sai do produto.** Nenhuma escola pediu nota que entre no diário; sem
   exportar, sem CSV, sem prazo. Continua sendo progresso, no vocabulário do D-22.
2. **O catálogo de missões é buscável, e aparece para o aluno quando ele cria conta.** Não é só a
   lista da turma: é tudo o que existe para fazer, com busca — por nome, por trilha, por grupo
   funcional. O aluno com professor vê a lista da turma primeiro e o catálogo abaixo; o aluno sem
   professor vê o catálogo. O que muda em relação à escolha provisória da especificação é a
   **conta**: o catálogo buscável é de quem entrou. O que o visitante sem conta encontra continua
   sendo o editor e o painel de missões como está hoje — isso não foi tocado pela decisão, e fica
   registrado aqui como leitura, não como ordem.
3. **Professor publica conteúdo lido por menor de idade, e a mitigação é o D-19.** Aceito como
   está: o papel é dado por quem administra, e não existe moderação nem canal de denúncia nesta
   fatia. Dito em voz alta para a escola, quando houver escola.
4. **A palavra da tela é "lista"**, sem consultar o professor: a medição do `researcher` (Google
   Classroom, "lista de exercícios", "roteiro" ocupado pela bancada) basta. Se a sessão de
   observação mostrar outra palavra na boca dele, troca-se `apps/web/app/turmas/messages.ts`.

**Em aberto, e é pergunta de escopo.** "Tudo o que já foi criado" pode querer dizer só as missões
do produto, ou também as missões que professores criaram. A segunda leitura é um **repositório
compartilhado** de conteúdo de professor para alunos de qualquer turma — e a especificação a
deixou de fora por três razões que continuam de pé: exige moderação (não existe), exige autoria
visível (existe só o `createdById`), e o leitor é menor de idade. Esta decisão implementa a
primeira leitura. A segunda, se for o que o dono quer, vira decisão própria, com essas três
condições antes.

---

## D-27 · Missão de professor pode entrar no catálogo — com autoria, denúncia e opt-in

**Decisão do dono do produto, 28 de agosto de 2026**, fechando o que o D-26 deixou em aberto: o
catálogo buscável inclui **também as missões que professores criaram**, para aluno de qualquer
turma. É um repositório compartilhado de conteúdo de professor.

**As três condições que a especificação tinha posto como impedimento viram requisito.** Nenhuma
delas é opcional, e a entrega não existe sem as três:

1. **Opt-in por missão, nunca por padrão.** Missão nasce **só nas listas do professor**. Entrar no
   catálogo é ação separada — "publicar no catálogo" — que ele faz missão a missão, e desfaz
   quando quiser. **Retirar do catálogo encerra o acesso pelo catálogo**: quem só chegava por ali
   deixa de alcançar a missão; quem chega por lista publicada continua, porque o item está na
   lista. O que já foi tentado fica gravado como histórico (`Attempt` não se apaga), mas histórico
   não é chave — a primeira implementação usou o "já abriu" (`QuestOpen`) como acesso vitalício,
   e isso anulava a regra R-7: bastava abrir uma vez para nunca mais perder o acesso, mesmo com o
   professor arquivando ou retirando. Corrigido em 28/08/2026, no mesmo dia.
2. **Autoria visível, sempre.** No catálogo, missão de professor aparece com **quem escreveu e de
   onde** — nome de exibição e instituição —, e nunca sem isso. É a regra do D-15 aplicada a
   conteúdo: o que um humano assinou não circula sem a assinatura. Missão de professor sem
   instituição preenchida não pode ser publicada no catálogo; a promoção (D-19) já exige o campo.
3. **Denúncia existe, e retirar é imediato.** Toda missão pública tem "denunciar", com motivo em
   uma linha. A denúncia grava quem, quando e o quê; a missão continua no ar até alguém retirar —
   o próprio professor, ou quem administra o servidor por script (`scripts/`), como toda ação de
   administração hoje. Não existe tela de moderação nesta fatia; existe o rastro e o botão de
   retirar. Isso precisa ser dito para a escola junto com o D-19.

**O que continua verdade, e é o que torna isto aceitável.** A parte que decide química numa
missão de professor **não foi digitada**: os objetivos saíram de `extractGoals` sobre a resposta
reanalisada (D-25). O que um humano escreveu é título, enunciado e dicas — texto puro, sem link,
com os tetos de R-13 e R-14. Então o pior caso de uma missão pública é texto inadequado, nunca
química errada ensinada para uma sala.

**O que muda no que já está sendo construído.**

- `TeacherQuest` ganha `catalogedAt DateTime?` — nulo é "só nas minhas listas". Migração aditiva.
- A regra R-7 (acesso do aluno a slug `professor:`) ganha um **segundo caminho**: matrícula em
  turma com lista publicada que contenha o slug, **ou** `catalogedAt IS NOT NULL` e
  `archivedAt IS NULL`. As quatro portas continuam as mesmas.
- R-3 continua absoluta: missão pública não expõe a resposta a ninguém que não seja o dono.
- A busca do catálogo (D-26) indexa título e os rótulos gerados dos objetivos — que é como se
  procura "algo com éster" sem que ninguém tenha digitado "éster" num campo de etiqueta.
- Modelo novo `QuestReport`: `id`, `questSlug`, `reporterId`, `reason` (≤ 200), `createdAt`,
  `resolvedAt?`. Índice por `questSlug`.

**Fica de fora, e por quê.** Avaliação por outros professores, curadoria, "missão verificada",
ranking de missões mais feitas: tudo isso é produto de comunidade, e comunidade é a Fase 4 do
roadmap com ressalva própria (D-08). Aqui é o mínimo que torna o compartilhamento defensável para
uma escola.

**Revisar se.** A primeira denúncia real chegar sem ninguém para ler — aí o rastro não bastou, e
a tela de moderação deixa de ser "depois".

---

## D-28 · Aberto, MIT, sem comercialização

**Decisão do dono do produto, 11 de setembro de 2026.** O Rotamer passa a ser **código aberto sob
licença MIT**, e **não será comercializado**: o objetivo é compartilhar a ferramenta com quem
ensina e aprende química. Duas formas de usar, as duas gratuitas: a **instância no ar**, mantida
pelo autor, e o **self-host** — qualquer pessoa sobe o produto inteiro com Docker e cuida do
próprio banco.

**O que isso revoga.** O D-08 inteiro: não há produto fechado, não há camadas de assinatura, não há
"o que se cobra". A Fase 4 do roadmap deixa de ser "Comercial". O veto a GPL e AGPL muda de
natureza: ele existia para proteger um produto fechado; agora a regra é **compatibilidade com o
MIT em redistribuição** — MIT, BSD, Apache-2.0 e ISC entram; GPL, LGPL e AGPL continuam fora,
porque imporiam obrigações a quem redistribui o Rotamer, e não é isso que uma licença MIT promete.

**O que isso afrouxa.** O D-09 dizia que o pesquisador é usuário avançado, não cliente. Sem
cliente, todos são usuários — o aluno continua sendo o primeiro, o professor continua decidindo o
que entra na aula, e a trilha de pesquisa registrada no `DEPOIS.md` volta a ser pergunta
legítima, sem a tensão comercial que a segurava.

**O que muda de significado.** "Vale para todo mundo" no batismo (D-15) e no catálogo
compartilhado (D-27) passa a valer **por instância**: cada self-host é um mundo próprio, com os
seus apelidos e o seu catálogo. A instância no ar é um desses mundos, não o centro.

**Por que MIT, e não AGPL.** AGPL protege um negócio hospedado de quem pega o código e vende
serviço em cima. Não há negócio a proteger. MIT é a licença de menor atrito para a TI de uma
secretaria de educação, para uma universidade e para quem quer estudar o código — e é a família
do RDKit e do OpenChemLib, que são BSD.

**O que a decisão obriga a construir**, nesta ordem:

1. **Instalação em três comandos** — `Dockerfile`, `docker-compose.yml` com app e Postgres,
   migração na subida, imagem publicada a cada versão, e `docs/INSTALACAO.md` dizendo o que cada
   variável faz e o que acontece sem ela.
2. **Documentação para três públicos**, e as três moram em `docs/` para versionar com o código:
   quem usa (aluno e professor), quem instala (a TI), quem contribui (arquitetura, a regra que
   não se quebra, testes). O que hoje existe serve ao terceiro público; os dois primeiros não têm
   uma página.
3. **Uma landing page em repositório separado**, estática, que mostra o produto, leva à instância
   no ar, ensina a instalar e **puxa a documentação de `docs/` na hora de construir** — para o
   site nunca descrever uma versão que não é a do código.
4. **Telemetria opt-in e dita com clareza.** Em código aberto, isso é reputação.

**A regra sobre documento, reafirmada com mais força.** Documento desatualizado se atualiza;
regra morta se remove; comentário que só repete o que a linha faz se apaga. Este arquivo é a
exceção deliberada: é o registro do que foi decidido e desfeito, e decisão revogada fica aqui
marcada como revogada — nunca apagada. Todo o resto descreve o que existe, e onde não descrever,
o documento está errado, não o código.

**Revisar se.** Aparecer custo que o autor não consiga sustentar sozinho na instância no ar — aí
a resposta é reduzir a instância, nunca fechar o código.
