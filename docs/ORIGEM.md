# Como o Rotamer surgiu

Documento de história, não de especificação. Existe porque as decisões deste projeto não vieram
de planejamento — vieram de erros descobertos cedo. Quem entra agora precisa saber quais foram,
senão vai refazer os mesmos.

---

## O ponto de partida

O começo não foi um problema de mercado. Foi um interesse pessoal — química — e uma vontade
vaga: **fazer alguma coisa que gerasse valor para a comunidade.** Nessa ordem.

A primeira formulação foi:

> "algo que estimule crianças a aprenderem mais sobre química com animações 3D, a respeito de
> química orgânica"

Nada mais que isso. Nem produto, nem público definido, nem tecnologia.

## Primeiro pivô: de criança para cientista

A ideia inicial durou pouco. A reformulação foi:

> "um sistema onde cientistas possam tentar formar moléculas, mas tem que ter todo enredo"

Duas coisas mudaram aqui, e as duas ficaram. A primeira foi o público — de criança para quem faz
ciência. A segunda foi mais importante e quase passou despercebida: **"tem que ter enredo"**.
Sandbox aberto é produto morto. Tela em branco não engaja ninguém, nem criança nem doutor. Essa
intuição virou a espinha do produto e sobreviveu a todo o resto.

## A tensão que quase matou o projeto

Servir criança e cientista com a mesma tela puxa para lados opostos: infantil demais para o
pesquisador, denso demais para o aluno. É assim que projetos educacionais de química morrem.

A saída não foi escolher um dos dois. Foi perceber que **química medicinal é química orgânica
aplicada** — não são dois produtos, são duas profundidades do mesmo motor. O que muda entre um
aluno de ensino médio e um mestrando não é a engine: é a régua de vitória.

Isso virou a estrutura de trilhas: Estrutura → Geometria → Propriedade → Otimização. O aluno
entra pela primeira e não percebe quando passou para a segunda. O pesquisador entra direto na
quarta. Mesmo editor, mesmo ranking, mesmos dados.

> Registrado como decisão em `DECISOES.md` D-04.

## A restrição de construção

Uma exigência veio junto e moldou a arquitetura inteira:

> "algo em 3D porém sem lib externa pronta para montar isso, no máximo lib que auxilia esse
> desenvolvimento nosso como three.js"

A regra estava certa, mas precisava de uma linha clara. Onde ela cai:

- **Construir do zero:** o canvas 2D, o render 3D, a mecânica de missões, a camada de IA. É aqui
  que mora o valor e o diferencial.
- **Não construir:** parser de SMILES, valência, aromaticidade, conformação, campo de força.
  Isso é RDKit — décadas de trabalho científico validado.

O RDKit passa no próprio critério: não é um visualizador pronto que enjaula a interface, é um
kernel sem UI nenhuma, compilado para WebAssembly. Mesma categoria do Three.js — lib que auxilia
o desenvolvimento, não lib que faz o produto.

> A analogia que fechou a discussão: você escreve sua própria engine de jogo, mas não
> reimplementa ponto flutuante.

## O 2D entrou por último e virou o centro

O 2D foi acrescentado quase como observação de rodapé — "formato 2D também acho interessante
ter". Acabou sendo a peça que fez a arquitetura fechar.

Ninguém projeta molécula arrastando átomo no espaço tridimensional. Químico desenha em bastão,
plano, desde sempre. O 2D é a superfície de entrada; o 3D é a **consequência**.

E daí sai o momento pedagógico mais valioso do produto, de graça: *"desenhei plano, e agora vejo
que no espaço isso não fecha"*. É a intuição mais difícil de ensinar em orgânica, e ela aparece
como efeito colateral da arquitetura.

> `DECISOES.md` D-03.

## O protótipo, e a cafeína

Antes de qualquer plano, foi construído um protótipo de núcleo para derrubar a dúvida técnica:
dá para fazer isso sem lib de química pronta?

Ele tinha editor 2D próprio, geometria 3D por campo de força escrito à mão, e validação química
determinística. E funcionava — os valores batiam com a literatura: aspirina em C₉H₈O₄ com
180,16 g/mol e TPSA 63,6; benzeno convergindo para hexágono regular de 120°; ciclohexano caindo
em cadeira a 110,6°.

**E errava na cafeína.**

O anel de cinco membros com nitrogênio da cafeína é aromático de verdade — é um imidazol. O
detector caseiro só reconhecia aromaticidade em anéis de seis, então marcava aquilo como alceno
e imina. E o erro vazava para a física: sem detectar aromaticidade, o anel não recebia restrição
de planaridade e se mexia errado na vibração.

O erro foi **deixado no protótipo de propósito**, com o próprio app denunciando a limitação em
texto. Porque ele é a prova prática do argumento: um núcleo químico razoável foi escrito em
algumas centenas de linhas e quebrou na terceira molécula que qualquer químico vai testar.
Tautomeria, estereoquímica e ressonância são a mesma armadilha, maiores.

Foi a cafeína que fechou a decisão de usar RDKit em produção.

> `DECISOES.md` D-02.

## A interface estava poluída

A primeira versão do protótipo mostrava tudo o tempo todo — um painel de instrumentos com
métricas, missões, ferramentas e análise simultâneas. A avaliação foi direta:

> "achei meio poluída, teria que ser uma estrutura clean porém intuitiva para o usuário poder
> fazer o que ele bem entender e ter o feedback fácil"

A crítica estava certa. A reconstrução mudou o modelo mental: de painel de instrumentos para
**superfície de trabalho**. A tela de desenho ocupa tudo, as ferramentas flutuam numa barra
discreta, cinco métricas essenciais numa faixa compacta, e todo o resto numa gaveta sob demanda.

A referência passou a ser Figma e Excalidraw, não Bloomberg Terminal.

> `DECISOES.md` D-05.

## A animação já estava pronta e ninguém tinha percebido

O pedido foi: "no modelo 3D acho que ficaria interessante uma animação nas moléculas se
comportando como deveriam".

O motor já tinha tudo para isso, de graça:

**Dobramento** — a minimização de energia produz uma trajetória. Bastou gravar os quadros e
tocar. A molécula nasce emaranhada e se dobra até encontrar a forma. Não é interpolação
decorativa: são os passos reais do otimizador.

**Vibração** — o mesmo campo de força, agora integrado no tempo. Dinâmica molecular com
termostato.

E o resultado foi quimicamente correto, medido:

| | diedro variou | comportamento |
|---|---|---|
| Etano (ligação simples) | 23° → 77° | gira livremente ✓ |
| Eteno (ligação dupla) | 0° → 3° | rígido ✓ |
| Benzeno | ligações ±4% | treme sem sair do plano ✓ |

Ou seja: a animação **demonstra a regra** em vez de ilustrá-la. O aluno vê a ligação simples
girando ao lado de uma dupla que se recusa. Nenhum livro didático faz isso.

Esse virou o momento assinatura do produto — e, meses depois, o nome.

## O nome levou seis tentativas

Cinco nomes foram escolhidos, celebrados e descartados por colisão: **Kekulé**, **Bunsen**,
**Ylide**, **Anomer**, **Moiety** e **Kovalent**.

O caso do Kovalent doeu mais porque a verificação inicial deu "livre" — e estava errada. A busca
usada devolveu blogs de naming em vez de empresas, e o DNS nunca foi consultado. Refazendo
direito, apareceu o **Grupo Kovalent**: empresa brasileira, de Niterói, que vende reagentes para
análises clínicas. Mesmo país, mesma língua, campo adjacente.

**A lição virou processo:** DNS primeiro (é barato e decisivo), depois busca de empresa, depois
INPI. Nessa ordem.

**Rotamer** veio da própria física que o produto demonstra. Um rotâmero é o isômero que existe
por causa da rotação em torno de uma ligação simples — exatamente o que a vibração mostra. Em
português é *rotâmero*, reconhecível sem tradução. E "ligações rotacionáveis" já era uma das
cinco métricas permanentes na tela desde o protótipo.

O símbolo veio junto: uma **projeção de Newman** escalonada, que é o desenho que todo estudante
de orgânica aprende justamente para enxergar conformação.

> Histórico completo em `DECISOES.md` D-07.

## A virada comercial

A recomendação original era AGPL-3.0 com marca reservada — abrir o código servia à comunidade,
ao portfólio e a uma eventual formalização como extensão universitária.

A decisão foi outra: **produto fechado, para vender.**

Isso é legítimo e tecnicamente viável — RDKit é BSD-3 e Three.js é MIT, ambas permitem uso
comercial em produto proprietário. Mas muda três coisas que ficaram registradas como pontos
abertos em `DECISOES.md` D-08: nenhuma dependência GPL pode entrar, o modelo de campanhas
comunitárias precisa ser repensado, e a relação com a UENP precisa ser verificada antes de
qualquer vínculo institucional.

## O público só ficou claro no fim

Durante quase toda a construção o produto foi descrito como "para cientistas" — herança do
primeiro pivô. Os documentos foram escritos com essa premissa até alguém fazer a pergunta óbvia:

> "qual a necessidade de ter missões, sendo que é para cientistas? isso não faz sentido"

A crítica estava certa e revelou uma contradição que estava escrita no próprio repositório: o
histórico dizia "cientistas", enquanto o pitch descrevia aluno reprovando em orgânica e listava
escola e cursinho como compradores.

A resolução inverteu a hierarquia: **o produto é de ensino, e o pesquisador é usuário avançado.**
Missão continua sendo o coração — não porque gamificação é boa, mas porque tela em branco é
produto morto e o aluno não chega com molécula na cabeça. O pesquisador chega, e por isso para
ele a resposta é colar um SMILES, não cumprir uma tarefa.

E ficou uma regra que vale mais que a decisão: **educação não autoriza imprecisão.** Professor de
química é químico. Num app de ensino, um erro não confunde um usuário — confunde uma sala.

> `DECISOES.md` D-09.

---

## O fio que atravessa tudo

Olhando para trás, nenhuma das decisões boas veio de planejamento. Todas vieram de descobrir um
erro cedo o bastante:

- A tensão aluno/cientista apareceu antes de virar duas bases de código.
- A cafeína quebrou antes de existir um usuário para ver quebrar.
- A interface poluída foi criticada quando ainda era protótipo.
- O nome colidiu antes do domínio comprado e da marca depositada.
- O público errado foi apontado antes de a Fase 2 ser construída em cima dele.

O produto final vai ser diferente do que está escrito nestes documentos. O que precisa
sobreviver não são as conclusões — é o hábito de descobrir o erro enquanto ele ainda é barato.
