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

## D-08 · Produto fechado e comercial

**Decisão.** Código proprietário, todos os direitos reservados. Monetização em camadas, com
uma base gratuita fazendo a distribuição.

**Por quê.** Decisão do titular. Substitui a recomendação anterior de AGPL-3.0.

**O que isso permite.** RDKit é BSD-3 e Three.js é MIT — ambas permitem uso comercial em produto
fechado, mantidas as atribuições. Tecnicamente não há impedimento. Ver `TERCEIROS.md`.

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
