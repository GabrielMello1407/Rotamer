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
- [ ] Vibração por dinâmica molecular — **sem caminho barato**: o OpenChemLib expõe energia mas
      não gradiente. Ou se faz MD com gradiente numérico (~40 ms por passo numa molécula do
      tamanho da aspirina, trajetória pré-calculada no worker), ou se muda a promessa. Decidir
      antes de prometer no site.
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
- [ ] Tutor LLM com schema fechado, indicador de origem, cache e teto de gasto — **falta chave
      do Gemini**
- [ ] Contas, progresso salvo, reavaliação da `spec` no servidor — **falta banco**
- [x] Página pública de molécula com SSR e Open Graph — `/m/<smiles>`, sem banco: a molécula é
      função pura da cadeia que está no endereço

**Publica:** v0.1 — o primeiro produto vendável.

---

## Fase 3 · Contato com a realidade — ~80h

A fase que a maioria pula e que decide se o produto serve para alguém.

- [ ] Sessões de observação com 3 professores e 8–10 alunos — assistindo, sem explicar nada
- [ ] Revisão de nomenclatura e linguagem por um químico
- [ ] Telemetria de onde as pessoas travam
- [ ] Correções de usabilidade e desempenho em celular fraco
- [ ] Estereoquímica com cunhas e traços, se a validação apontar para isso

**Publica:** v0.2 corrigida.

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
