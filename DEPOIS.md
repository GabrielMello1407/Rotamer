# Depois

Toda ideia que não está no escopo do MVP mora aqui, não no código.
Escopo estourando é o risco número um deste projeto.

Regra: se surgiu no meio de outra tarefa, escreva aqui e volte ao que estava fazendo.

> Revisado depois de a v0.1 ficar de pé. A lista antiga foi escrita antes de existir código;
> esta foi escrita depois de construir, e por isso tem sete itens que ninguém tinha previsto.

## v0.2 · Atrito e confiança

O critério do corte: **o que faz um professor voltar na segunda semana.** Nada aqui é
funcionalidade nova impressionante — é tirar pedra do caminho de quem já quer usar.

- [x] **Templates de anel em um clique** — benzeno, cicloexano, ciclopentano e piridina.
- [x] **Rascunho salvo no navegador** — volta ao abrir; link com molécula ganha dele.
- [x] **Exportar SVG e PNG** — SVG é o desenho do RDKit; PNG é a tela como está.
- [x] **Pinça** — dois dedos ancorados no ponto do grafo que está embaixo deles. Falta o resto
      do polimento de celular, que só a Fase 3 vai dizer qual é.
- [ ] **Busca por nome, via PubChem** — tira o SMILES do caminho de quem sabe "cafeína" e não
      `Cn1cnc2c1c(=O)n(C)c(=O)n2C`. Dado de domínio público; exige atribuição e precisa degradar
      com elegância quando a API estiver fora. **Leva junto a verificação de novidade do
      batismo** (D-15): com ela, "ninguém batizou" passa a distinguir composto inédito de
      composto conhecido.
- [ ] **Centros estereogênicos nas métricas** — o número já é calculado pelo RDKit e não aparece
      em tela nenhuma. Meia hora de trabalho para avisar o químico que o assunto existe antes de
      a ferramenta resolvê-lo.
- [ ] **Recuperação de senha** — numa turma de trinta, alguém esquece na primeira semana.
- [ ] **"Minhas moléculas"** — a tabela existe e só é escrita por tentativa de missão. A conta
      guarda progresso e não guarda o trabalho.

## v0.3 · Estereoquímica

- [ ] **Cunhas e traços, feito direito** — mexe no grafo, no molblock, na percepção CIP e na
      coerência com a cena 3D.

Tirada da v0.2 de propósito. É a primeira coisa que um químico vai pedir e o `CLAUDE.md` diz que
merece ser feita direito; espremer junto com oito itens pequenos é exatamente como se faz errado.

## Perguntas em aberto

- ~~O produto vai nomear molécula?~~ **Respondido (D-15):** não calcula nomenclatura; registra
  autoria. Estrutura válida que ninguém batizou pode receber apelido de quem a desenhou, sempre
  exibido com o nome de quem deu. Falta a parte que depende do PubChem: hoje "ninguém batizou"
  quer dizer "ninguém batizou aqui dentro", e o produto não sabe se o composto já existe lá fora.
- **Acessibilidade do canvas.** Desenhar exige ponteiro; teclado só tem atalhos. Compra
  institucional costuma exigir acessibilidade, e isso pode virar bloqueio de venda antes de virar
  pedido de usuário.

## Considerado e adiado

- [ ] Comparar dois análogos lado a lado — é para o usuário avançado, que não é o comprador (D-09)
- [ ] Modo apresentação para o professor projetar sem a interface de edição
- [ ] Retrossíntese e previsão de reação — precisa de modelo em servidor com GPU
- [ ] Docking com proteína — servidor pesado, e cria expectativa de afirmação biológica
- [ ] DFT / química quântica — impossível no navegador
- [ ] Campanhas abertas da comunidade — depende de massa crítica e do modelo de negócio
- [ ] Edição colaborativa em tempo real
- [ ] App nativo
- [ ] Espectros simulados (RMN, IV) — tentador, mas é outro produto

## Ideias soltas

_(anote aqui e siga em frente)_
