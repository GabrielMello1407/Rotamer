# Roadmap

> As fases são uma **ordem**, não uma promessa de data. O que está marcado como feito existe no
> código, com teste; o que está aberto é o que falta para o produto servir a alguém fora deste
> repositório.

Referência de ritmo: 20h por semana. Cada fase termina com algo que vale sozinho.

---

## Fase 0 · Fundação — concluída, exceto o ar

- [x] Monorepo Turborepo, TypeScript estrito, ESLint, Vitest, Playwright
- [x] `tokens.css` em `packages/ui` e primitivos de UI
- [x] RDKit.js carregando em worker via Comlink, com teste que sanitiza aspirina
- [x] Integração contínua no GitHub Actions — lint, tipos, testes de núcleo, testes de ação com
      Postgres, e navegador em desktop e celular
- [ ] **Instância no ar com domínio próprio** — ver `docs/DEPLOY.md`; depende de VPS e registrador

---

## Fase 1 · Núcleo — concluída

O produto inteiro sem conta, sem servidor, sem IA. Tudo no cliente.

- [x] Editor 2D: desenhar, arrastar-para-criar, ordem de ligação, elemento, mover, apagar,
      desfazer, enquadrar — mais seleção por retângulo e por fragmento, menu do botão direito,
      toque longo, atalhos na página inteira, tabela periódica e atalhos em popover
- [x] Organizar o desenho pelo RDKit, com o relato do que aconteceu com cada cunha (D-24)
- [x] Ponte com RDKit: sanitização, SMILES, InChIKey, descritores, carga na fórmula
- [x] Grupos funcionais reconhecidos por SMARTS no RDKit, com nome em português
- [x] Geometria e dobramento animado — conformação do OpenChemLib e MMFF94 (D-10); elemento fora
      do MMFF94 mostra a forma sem vibração, e diz por quê
- [x] Vibração por dinâmica molecular — velocity-Verlet sobre o gradiente numérico do MMFF94, a
      300 K, trajetória pré-calculada no worker e cache por InChIKey (D-14)
- [x] Modos normais — Hessiana, ponderação por massa, projeção do corpo rígido e diagonalização:
      3N − 6 (3N − 5 se linear), cada um com número de onda e movimento próprio (D-20)
- [x] Ligação dupla e tripla como varetas paralelas na cena; letras CIP no desenho e na cena
- [x] Sincronia 2D↔3D — o átomo aceso é um só (D-18); temas claro e escuro; responsivo até 390px
- [x] Mensagens de erro em português que explicam a química, não o código

---

## Fase 2 · Enredo — concluída

- [x] Motor de missões com `spec` declarativa — a mesma função avalia no cliente e no servidor
- [x] 16 missões cobrindo Estrutura, Geometria e Propriedade, com dicas escritas à mão
- [x] Colar SMILES e busca por nome via PubChem, com o terceiro estado quando o PubChem não
      responde
- [x] Modo ferramenta livre, **sem missão, pontuação ou conquista** (D-09)
- [x] Tutor com schema fechado sem campo numérico, indicador de origem, cache por
      molécula/missão/tipo e teto diário — opcional: sem `GEMINI_API_KEY` ele se desliga; o modelo
      padrão fica num apelido com reserva fixa, porque modelo sai de circulação (`GEMINI_MODEL`
      troca sem tocar no código)
- [x] Contas, progresso salvo, reavaliação da `spec` no servidor — Postgres (D-11)
- [x] Recuperação de senha por código emitido pelo professor, sem e-mail no caminho (D-19)
- [x] Minhas moléculas: guardar, começar outra, exportar SVG e PNG; batizar guarda junto (D-15)
- [x] Página pública de molécula com SSR e Open Graph — `/m/<smiles>`, sem banco
- [x] Estereoquímica: cunha e traço no editor, `wedge` no grafo, molblock V2000, `R`/`S`/`E`/`Z`
      pelo RDKit, enantiômeros em formas espelhadas na cena, e a missão que só fecha com a cunha
      certa (D-21)

---

## Fase 3 · Professor — concluída no código, aberta no campo

- [x] Painel do professor: turmas com código, quadro de onde cada aluno parou — progresso, nunca
      molécula (D-22)
- [x] **Listas da turma**: o professor monta a sequência com missões do catálogo ou cria a dele
      **desenhando a resposta** — o produto extrai os objetivos da molécula, nunca de texto
      digitado; missão que a própria resposta não cumpre é recusada; o gabarito nunca sai para o
      aluno (D-25, `docs/ROTEIROS.md`)
- [x] **Catálogo buscável**, para quem tem conta, com as missões que professores publicaram —
      opt-in por missão, autoria visível, denúncia com rastro (D-26, D-27)
- [x] Telemetria escrita e desligada — Umami auto-hospedado, sem cookie, lista fechada de
      momentos em `apps/web/lib/track.ts`; sem as duas variáveis o script nem carrega
- [x] Backup e ensaio de restauração como scripts (`scripts/backup-db.sh`, `restore-db.sh`)
- [x] Desempenho em celular fraco medido com throttling: cena 3D sob demanda derrubou a primeira
      pintura de 11,7 s para 6,9 s; `immutable` no motor; `.wasm` pré-comprimido

O que falta aqui **não é código**:

- [ ] Sessões de observação com 3 professores e 8–10 alunos — assistindo, sem explicar nada. As
      perguntas sobre nomenclatura, e a regra de **não puxar o assunto**, estão abaixo
- [ ] Revisão de nomenclatura e linguagem por um químico
- [ ] Telemetria no ar e backup no cron com o primeiro ensaio de restauração feito (D-11)
- [ ] As correções de usabilidade que só as sessões vão apontar

### O que perguntar ao professor sobre nomenclatura — e em que ordem

O produto não nomeia, por escolha (D-15). A sessão é assistir sem explicar nada. Nomenclatura não
se introduz: **espera-se**.

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

A terceira pergunta é a que decide o preço de qualquer caminho: separa um mapeamento de termos
de um dicionário de nomenclatura mantido para sempre. Os caminhos, com o custo de cada um, estão
no `DEPOIS.md`; a pesquisa que os fundamenta, em `docs/pesquisa/nomenclatura.md`.

---

## Fase 4 · Aberto — em curso

O Rotamer é código aberto, MIT, sem comercialização (D-28). O que essa decisão obriga:

- [x] Licença MIT, `CLAUDE.md` e os agentes descrevendo um projeto aberto
- [ ] **Self-host em três comandos** — `Dockerfile`, `docker-compose.yml` com app e Postgres,
      migração na subida, imagem publicada a cada versão, `docs/INSTALACAO.md`
- [ ] **Documentação para três públicos**, em `docs/`: quem usa (`GUIA.md`), quem instala
      (`INSTALACAO.md`), quem contribui (`ARQUITETURA.md`, `CONTRIBUTING.md`)
- [ ] **Landing page em repositório separado**, estática, que puxa `docs/` na hora de construir
- [ ] Telemetria opt-in, dita em voz alta

**Pergunta em aberto, anotada no `DEPOIS.md`:** o roadmap inteiro serve ao ensino. Sem a tensão
comercial que a segurava, a trilha de pesquisa volta a ser pergunta legítima — e continua
esperando as sessões da Fase 3 para ser respondida por escrito.

---

## Riscos

| Risco | Sinal de que aconteceu | O que fazer |
|---|---|---|
| **Escopo estourar** — o mais provável | Uma ideia nova entrando no código sem passar pelo `DEPOIS.md` | Ideia nova vai para `DEPOIS.md`. O `pm` decide se entra. |
| **Um químico achar um erro** | Alguém aponta tautomeria ou estereoquímica errada | Nunca contornar o RDKit. Admitir rápido constrói mais confiança do que erro nenhum. |
| **Custo do tutor fugir** | Conta subindo sem uso proporcional | Cache por InChIKey, teto diário, degradação para dica escrita; e o tutor é opcional. |
| **Ninguém usar** | Fase 3 sem professor interessado | Conversar com professores **agora**, com o produto como está. |
| **WASM pesado no celular** | Mais de 5 s até o primeiro desenho em 3G | O RDKit carrega depois da primeira pintura; a cena 3D, sob demanda. |
| **A instância no ar custar mais do que o autor sustenta** | Servidor ou chave pesando no bolso | Encolher a instância. O código não fecha (D-28). |

## Como saber se está funcionando

**Sinal verdadeiro**

- Um professor manda o link no grupo da turma sem ninguém pedir
- Alguém volta em outro dia, sem lembrete
- Uma molécula construída no Rotamer aparece num slide de aula
- Uma escola sobe a própria instância
- Um químico abre uma issue apontando um erro sutil — significa que levou a sério

**Sinal enganoso**

- Curtidas
- Visitas de pico no dia do lançamento
- Elogio ao visual sem ninguém montar molécula
