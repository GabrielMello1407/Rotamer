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

Tudo escrito, tudo testado. Para o tutor sair do modo desligado, falta só a chave do Gemini no
`.env` — nenhuma outra mudança.

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

O contato propriamente dito:

- [ ] Sessões de observação com 3 professores e 8–10 alunos — assistindo, sem explicar nada
- [ ] Revisão de nomenclatura e linguagem por um químico
- [ ] Correções de usabilidade e desempenho em celular fraco

**Publica:** v0.2 corrigida.

**Estereoquímica saiu daqui.** Ela virou v0.3, com fase própria: mexe no grafo, no molblock, na
percepção CIP e na coerência com a cena 3D, e o `CLAUDE.md` diz que merece ser feita direito.
Se a validação apontar para ela com força, o que muda é a ordem — não o tamanho do trabalho.

**Pergunta que precisa de resposta antes da primeira sessão:** o produto vai nomear molécula? Hoje
não nomeia, e não existe motor de nomenclatura IUPAC no escopo. O primeiro professor vai
perguntar. Não-objetivo declarado ou item de v0.3 — as duas respostas servem; o silêncio, não.

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

- [ ] Painel do professor: turmas, acompanhamento de quem travou onde
- [ ] Camadas de assinatura e cobrança
- [ ] Landing page e material de venda
- [ ] Campanhas privadas para laboratório (ver ressalva em `DECISOES.md` D-08)

**Publica:** v1.0.

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
