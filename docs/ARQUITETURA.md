# Arquitetura

## O princípio

**O grafo é a única fonte de verdade.** Fórmula, descritores, coordenadas 3D, nota de missão e
texto do tutor são todos derivados dele e recalculáveis a qualquer momento. Nada além do grafo
é persistido como estado do usuário.

Isso mantém a persistência mínima, torna qualquer bug reproduzível a partir de um único objeto
e permite trocar a implementação de qualquer camada derivada sem migração de dados.

## Fluxo, do traço ao veredito

```
                            ┌──────────────────────────┐
                            │  RDKit · WASM (worker)   │──► Métricas e nota
              ┌── molblock ─►  valência, descritores   │         │
              │             └──────────────────────────┘         │ lê
  Editor 2D ──► GRAFO                                            ▼
   (canvas    (fonte da                                    ┌───────────┐
    próprio)   verdade)      ┌──────────────────────────┐  │ Tutor LLM │
              │             │ Geometria · WASM (worker)│  └───────────┘
              └── grafo ────►  ETKDG + MMFF94           │──► Cena 3D    ▲
                            └──────────────────────────┘         │ lê   │
                                                                 └──────┘

              ◄────────────── nunca escreve ──────────────────────┘
```

O caminho de volta está desenhado justamente porque **não existe**. O tutor lê as métricas e a
cena e não tem como alterar o grafo, os descritores ou a nota. É a garantia estrutural de que
nenhuma afirmação química chega ao usuário sem ter passado pelo motor determinístico.

## Pacotes

```
apps/web            Next.js 16 App Router — rotas, contas, API
packages/
  core              grafo · RDKit worker · geometria · descritores
  editor2d          canvas 2D próprio, ferramentas, histórico
  viewer3d          Three.js · dobramento e dinâmica molecular
  quests            missões declarativas e pontuação
  ui                tokens e componentes
```

**A regra de dependência:** `core` não depende de ninguém, e ninguém depende de `editor2d`.

- `core` não conhece React, Three.js nem o DOM. Roda em teste de linha de comando, o que torna a
  química testável sem navegador e rápida de verificar.
- Nada importa `editor2d`. A interface de desenho é substituível sem tocar em nada abaixo.

Quando uma dessas duas regras precisar ser quebrada, a resposta certa quase sempre é mover a
lógica para `core`, não criar a dependência.

## Stack e o porquê

| Camada | Escolha | Por quê |
|---|---|---|
| Aplicação | Next.js 16 (App Router) + TypeScript estrito | SSR nas páginas públicas de molécula, que é o que traz busca orgânica |
| Química | RDKit.js (WASM) em Web Worker via Comlink | Ver `DECISOES.md` D-02 |
| Geometria | OpenChemLib: conformação + MMFF94 | O RDKit.js publicado não traz gerador 3D nem campo de força. Ver `DECISOES.md` D-10 |
| 3D | Three.js + React Three Fiber | Motor de render apenas — nenhuma química dentro |
| Editor 2D | Canvas 2D próprio + Zustand | É o diferencial; nenhuma lib pronta dá o toque certo |
| Dados | Postgres + Prisma (Supabase no início) | Auth, storage e banco numa assinatura só; migrar para VPS depois é trivial |
| LLM | Gemini, rota de servidor, JSON de schema fechado | Schema fechado impede o modelo de inventar campo químico |
| Telemetria | Umami auto-hospedado | Sem cookies, LGPD simples |

## Modelo de dados

| Tabela | Campos que importam | Nota |
|---|---|---|
| `molecule` | `id, owner_id, graph jsonb, smiles, inchikey, descriptors jsonb, public` | `inchikey` com índice único por dono — é como se detecta duplicata e se dá crédito de redescoberta |
| `quest` | `id, slug, track, difficulty, spec jsonb, hints jsonb` | `spec` é predicado declarativo avaliado no cliente e **reavaliado no servidor** |
| `attempt` | `id, user_id, quest_id, molecule_id, score, passed, elapsed_ms` | É o dado de produto: onde as pessoas travam vira o mapa de dificuldade |
| `profile` | `id, display_name, track_progress jsonb, institution` | `institution` permite ranking por turma sem criar entidade de turma cedo demais |
| `campaign` | `id, owner_id, title, brief, constraints jsonb, opens_at, closes_at` | Fase posterior — já modelado para evitar migração dolorosa |

**Nunca confie na avaliação do cliente.** A `spec` da missão roda no navegador para dar resposta
instantânea, e roda de novo no servidor antes de gravar o `attempt`.

## Desempenho — restrições, não sugestões

- **Tudo pesado no worker.** Sanitização, descritores e conformação nunca tocam a thread
  principal. O desenho tem que continuar a 60 fps enquanto o RDKit trabalha.
- **Debounce por intenção, não por tempo fixo.** Métricas a cada 120 ms de silêncio; geometria 3D
  apenas quando a topologia muda, nunca quando um átomo é arrastado.
- **Cache por InChIKey.** Conformação e descritores são função pura do grafo. A mesma molécula
  nunca deve ser calculada duas vezes.
- **O WASM carrega depois da primeira pintura.** Meta: primeiro desenho interativo em menos de
  3 s num celular fraco em 3G. O editor 2D funciona antes de a química subir.

Escola pública em celular ruim é o caso de uso, não o caso extremo.

## A camada de IA

**Guardrails obrigatórios:**

1. O prompt recebe os descritores **já calculados** e é instruído a nunca recalcular nem
   contradizer.
2. Saída em JSON com schema fechado. Nenhum campo numérico: o modelo devolve texto e referências
   a chaves, não valores.
3. Cada bloco na tela carrega indicador de origem — verde para calculado, âmbar para gerado.
4. Cache por `(inchikey, quest_id, tipo_de_dica)`. O mesmo erro na mesma missão não paga duas
   vezes.
5. Teto de gasto por usuário por dia, com degradação graciosa para dicas determinísticas.

## O que o sistema nunca afirma

- Que previu o produto de uma reação ou uma rota de síntese.
- Que uma molécula tem atividade biológica. Descritores são descritores.
- Que substitui PyMOL, ChemDraw ou Maestro.
