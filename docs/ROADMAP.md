# Roadmap

> Primeira versão do plano. As fases são uma **ordem**, não uma promessa de data. Elas vão
> mudar assim que o código real encostar na realidade — e a Fase 3 existe justamente para
> desmentir parte do que está escrito aqui.

Referência de ritmo: 20h por semana. Cada fase termina com algo que vale sozinho — se parar em
qualquer ponto, o que existe já é demonstrável.

---

## Fase 0 · Fundação — ~40h

Nada de química ainda. Só o chão para não ter retrabalho depois.

- [x] Monorepo Turborepo, TypeScript estrito, ESLint, Vitest, Playwright
- [x] `tokens.css` movido para `packages/ui` e primitivos de UI
- [x] RDKit.js carregando em worker via Comlink, com teste que sanitiza aspirina
- [x] Integração contínua no GitHub Actions — lint, tipos, testes e navegador
- [ ] Deploy contínuo e domínio no ar — ver `docs/DEPLOY.md`, depende de conta e registrador

**Publica:** página de marca com o símbolo e os tokens.

---

## Fase 1 · Núcleo — ~100h

O produto inteiro sem conta, sem servidor, sem IA. Tudo no cliente.

- [x] Editor 2D: desenhar, arrastar-para-criar, ordem de ligação, elemento, mover, apagar,
      desfazer, enquadrar
- [x] Ponte com RDKit: sanitização, SMILES, InChIKey, descritores
- [x] Grupos funcionais reconhecidos por SMARTS no RDKit, com nome em português
- [x] Geometria e dobramento animado — conformação do OpenChemLib e MMFF94 real (D-10)
- [x] Vibração por dinâmica molecular — velocity-Verlet sobre o gradiente numérico do MMFF94, a
      300 K, com a trajetória pré-calculada no worker e cache por InChIKey (D-14)
- [x] Modos normais de vibração — Hessiana, ponderação por massa, projeção do corpo rígido e
      diagonalização: 3N − 6 modos (3N − 5 se linear), cada um com número de onda e movimento
      próprio, mostrados um de cada vez na cena (D-20)
- [x] Sincronia 2D↔3D, temas claro e escuro, responsivo até 390px
- [x] Mensagens de erro em português que explicam a química, não o código

**Publica:** o editor aberto, sem cadastro. Já é demonstrável para qualquer interlocutor.

---

## Fase 2 · Enredo — ~100h

Onde a sandbox vira produto. Sem isto, tela em branco é produto morto.

- [x] Motor de missões com `spec` declarativa — a mesma função avalia no cliente e vai avaliar
      no servidor, sem duas implementações que podem discordar
- [x] 14 missões cobrindo Estrutura, Geometria e Propriedade
- [x] Colar SMILES para carregar molécula — é o que preenche a tela em branco para quem já
      chega com um composto em mãos
- [x] Modo ferramenta livre, **sem missão, pontuação ou conquista** (D-09)
- [x] Tutor LLM com schema fechado, indicador de origem, cache por molécula/missão/tipo e teto
      diário — pronto e desligado: sem `GEMINI_API_KEY` ele avisa e devolve o aluno para as
      dicas escritas à mão
- [x] Contas, progresso salvo, reavaliação da `spec` no servidor — Postgres local (D-11)
- [x] Página pública de molécula com SSR e Open Graph — `/m/<smiles>`, sem banco: a molécula é
      função pura da cadeia que está no endereço, com imagem de compartilhamento gerada dos
      mesmos números calculados

**Publica:** v0.1 — o primeiro produto vendável.

Tudo escrito, tudo testado. **O tutor está ligado**: com a `GEMINI_API_KEY` no `.env`, ele
responde de verdade — verificado ponta a ponta, resposta em cerca de 7 s, dentro do schema
fechado e marcada em âmbar na tela. Nenhuma outra configuração foi necessária.

Uma armadilha que apareceu na hora de ligar: **modelo do Gemini sai de circulação**. O
`gemini-2.5-flash` que estava no código passou a responder 404 para chave nova, e o efeito na
tela era o tutor calar como se não houvesse chave. O padrão agora é `gemini-3.6-flash`, e existe
`GEMINI_MODEL` no `.env` para trocar sem tocar no código.

---

## Fase 3 · Contato com a realidade — ~80h

A fase que a maioria pula e que decide se o produto serve para alguém.

**Duas coisas precisam existir antes de a primeira sessão acontecer.** Não são funcionalidade;
são a diferença entre medir e achar:

- [x] **Telemetria** — Umami auto-hospedado no mesmo VPS, sem cookie. Escrita e desligada: sem
      `UMAMI_SCRIPT_URL` o script nem é carregado. A lista de momentos medidos é fechada em
      `apps/web/lib/track.ts` — primeira molécula, missão cumprida, molécula guardada, pedido ao
      tutor, exemplo carregado. Falta subir o Umami no VPS.
- [x] **Backup do banco** — `scripts/backup-db.sh` (despejo diário, conferência de que o arquivo
      abre, cópia fora da máquina, retenção) e `scripts/restore-db.sh` (ensaio num banco separado,
      com as contagens que dizem se o backup vale). Falta pendurar no cron do VPS e fazer o
      primeiro ensaio (D-11).

Tirar pedra do caminho, antes ou junto das sessões — a lista completa e o critério do corte
estão no `DEPOIS.md`:

- [x] Templates de anel, rascunho salvo no navegador, exportar SVG e PNG
- [x] Pinça e polimento de celular
- [x] Busca por nome via PubChem
- [x] Centros estereogênicos nas métricas e "minhas moléculas"
- [x] Recuperação de senha por código do professor, sem e-mail no caminho (D-19)
- [ ] **A regra do apelido recusa "Camila" e aceita "aspirina"** — o inverso do que ela existe
      para fazer, medido em `apps/web/lib/molecule-name.ts:35`. É a única pedra desta lista que
      aparece **na frente da turma**, e por isso vai antes da primeira sessão (D-15)
- [ ] **Conferir o PubChem a partir do IP do VPS** — em 27/08/2026 ele respondeu 503 o dia inteiro
      daqui, e a verificação de novidade do batismo depende dele. Saber se foi o serviço ou este IP

O contato propriamente dito:

- [ ] Sessões de observação com 3 professores e 8–10 alunos — assistindo, sem explicar nada
- [ ] Revisão de nomenclatura e linguagem por um químico
- [x] Desempenho em celular fraco, medido com throttling (Pixel 5, CPU 4×, 400 kbps): cena 3D
      carregada sob demanda derrubou a primeira pintura de 11,7 s para 6,9 s; `immutable` no motor
      levou a revisita a 0,6 s; e o `.wasm` passou a ser entregue pré-comprimido em brotli (6753 →
      1437 KB). Falta o resto: correções de usabilidade que só as sessões vão apontar.

**Publica:** v0.2 corrigida.

**Estereoquímica saiu daqui.** Ela virou v0.3, com fase própria: mexe no grafo, no molblock, na
percepção CIP e na coerência com a cena 3D, e o `CLAUDE.md` diz que merece ser feita direito.
Se a validação apontar para ela com força, o que muda é a ordem — não o tamanho do trabalho.

**A pergunta "o produto vai nomear molécula?" está respondida: não** — e agora com justificativa
que se sustenta. O `researcher` mostrou que existe motor aberto, MIT e determinístico
(`docs/pesquisa/nomenclatura.md`); o D-15 foi reescrito por cima em 27/08/2026 dizendo por que o
produto continua não nomeando mesmo assim, e com que gatilho isso se revisa. O que **falta** é a
única coisa que a sessão responde de graça, e que decide o custo de tudo o que vier depois dela.

### O que perguntar ao professor sobre nomenclatura — e em que ordem

A sessão é assistir sem explicar nada. Nomenclatura não se introduz: **espera-se**.

1. **Não puxe o assunto.** Anote se o professor ou o aluno pede o nome sem ninguém provocar: em
   que minuto, e com que estrutura na tela. Quem **não** pergunta é dado tão bom quanto quem
   pergunta.
2. **Se ele pedir**, a única pergunta é *"o que você faria com esse nome na sua aula?"* — e
   depois cale. Anote a resposta com as palavras dele.
3. **Se ninguém pedir até o fim**, ao encerrar, nesta ordem literal:
   - *"Na sua turma, quando entra nomenclatura, o que o aluno faz mais: ele recebe uma estrutura e
     escreve o nome, ou recebe o nome e desenha a estrutura?"*
   - *"Se o Rotamer soubesse fazer só uma das duas, qual delas te serviria mais?"*
   - *"E se o nome saísse em inglês — 'ethyl acetate' no lugar de 'acetato de etila' — isso te
     serve, atrapalha, ou é pior do que não ter nome nenhum?"*

A terceira pergunta é a que decide o preço: **é ela que separa um mapeamento de termos de um
dicionário de nomenclatura mantido para sempre.** Nenhuma das três menciona motor, biblioteca ou
o que o produto poderia fazer — a resposta interessa como aula, não como pedido de
funcionalidade.

**A revisão por um químico ganhou uma segunda pauta, e ela é condicional.** Se — e só se — as
sessões apontarem para "nomeie o que eu desenhei", a revisão passa a incluir: rodar o
`openclatura` sobre a lista de moléculas que as trilhas realmente usam (`packages/quests`) e ter o
químico marcando **aceita / não aceita**, nome a nome. É esse número, e não o round-trip, que diz
se o caminho é "quase lá" ou "não serve" — gatilho 2 do D-15. Enquanto a sessão não acontecer,
esse trabalho não começa: escolher motor antes de saber a direção é construir no escuro a parte
mais cara. Os cinco caminhos, com o preço de cada um, estão no `DEPOIS.md`.

---

## v0.3 · Estereoquímica — ~40h

Não é fase de calendário: é uma entrega grande o suficiente para não caber em nenhuma das outras,
e pequena o suficiente para não virar projeto.

- [x] Cunhas e traços no editor 2D, com o grafo carregando a informação (D-21)
- [x] Molblock escrevendo a estereoquímica, e o RDKit devolvendo os descritores CIP — `R`, `S`,
      `E`, `Z` e o `?` do centro que ficou em aberto, escritos ao lado do átomo no desenho
- [x] Coerência entre o que está desenhado e o que a cena 3D mostra — enantiômeros caem em formas
      espelhadas, verificado pelo sinal do produto misto no teste do núcleo
- [x] Missões que dependem de configuração — "Um carbono com lado", que só fecha quando nenhum
      centro fica sem configuração — é onde a funcionalidade prova que serve

Depende do que a Fase 3 mostrar. Se professor nenhum pedir, o que muda é a prioridade, não a
existência: o produto assume hoje que estereoquímica não está representada, e isso precisa
continuar dito em voz alta enquanto for verdade.

---

## Fase 4 · Comercial — ~120h

- [x] Painel do professor: turmas, acompanhamento de quem travou onde (D-22)
- [ ] Camadas de assinatura e cobrança — **adiado de propósito** até as sessões da Fase 3 (D-08).
      Escola pública compra por empenho, não com cartão; escolher a forma de cobrar antes de saber
      o que se cobra é construir a parte mais cara no escuro.
- [x] Landing page e material de venda — `/escolas`, com a estrutura desenhada pelo RDKit no
      servidor na hora e a lista do que o produto **não** faz com o mesmo destaque do resto
- [ ] Campanhas privadas para laboratório (ver ressalva em `DECISOES.md` D-08)

**Publica:** v1.0.

**Pergunta em aberto, anotada no `DEPOIS.md`:** o roadmap inteiro serve ao ensino, e não existe
trilha de pesquisa. Isso é coerente com o D-09 — pesquisador é usuário avançado, não cliente —
mas a decisão precisa ser reafirmada ou revista por escrito depois das sessões da Fase 3.

---

## Como usar este cronograma

A única data que importa é ter a **Fase 2** de pé. As fases 3 e 4 são qualidade e receita —
valiosas, mas não são o que salva o prazo.

Se a Fase 2 estiver atrasada, **corte missões, não corte polimento**. Um produto com 6 missões
impecáveis é demonstrável; um com 15 missões quebradas não é.

---

## Riscos

| Risco | Sinal de que aconteceu | O que fazer antes |
|---|---|---|
| **Escopo estourar** — o mais provável | Fase 1 passando de 7 semanas | Congelar a lista de missões em 12. Ideia nova vai para `DEPOIS.md`. |
| **O editor 2D consumir tudo** | Semana 5 ainda ajustando o feel do arrasto | Definir o "bom o suficiente" agora: criar, ligar, alterar ordem, apagar, desfazer |
| **Um químico achar um erro** | Alguém aponta tautomeria ou estereoquímica errada | Nunca contornar o RDKit. Canal de reporte visível — erro admitido rápido constrói mais confiança do que erro nenhum. |
| **Custo de LLM fugir** | Conta subindo sem usuário proporcional | Cache por InChIKey desde o primeiro dia, teto diário, degradação determinística |
| **Ninguém usar** | Fase 3 sem professor interessado | Conversar com dois professores **agora**, com o protótipo atual |
| **WASM pesado no celular** | Mais de 5 s até o primeiro desenho em 3G | Carregar o RDKit depois da primeira pintura |

## Como saber se está funcionando

**Sinal verdadeiro**

- Um professor manda o link no grupo da turma sem você pedir
- Alguém volta em outro dia, sem lembrete
- Uma molécula construída no Rotamer aparece num slide de aula
- Um químico abre uma issue apontando um erro sutil — significa que levou a sério

**Sinal enganoso**

- Curtidas no LinkedIn
- Visitas de pico no dia do lançamento
- Elogio ao visual sem ninguém montar molécula
