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
