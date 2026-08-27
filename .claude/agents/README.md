# O time

Sete papéis, um arquivo cada. O Claude Code lê o `description` de cada um para saber quando
chamar; o corpo do arquivo é a instrução que aquele agente recebe.

| Agente | O que ele decide | Quando chamar |
|---|---|---|
| `pm` | escopo, ordem, o que é "pronto" | antes de qualquer trabalho que atravesse mais de um pacote |
| `ui-ux` | layout, token, cor, texto em pt-BR | antes de o `frontend` escrever a tela |
| `frontend` | `apps/web`, `editor2d`, `viewer3d` | componente, estado, canvas, cena 3D |
| `backend` | server action, Prisma, `core`, worker, tutor | persistência, validação, cálculo químico |
| `security` | conta, sessão, dado de aluno, licença | antes de mexer em qualquer um dos quatro |
| `deploy` | build, VPS, migração, backup, variável | quando a mudança precisa de passo no servidor |
| `reviewer` | se a entrega passa | ao final, sempre |

## Como eles conversam

Cada um tem `SendMessage` e `ListAgents`. O nome do arquivo é o endereço: `SendMessage({to:
"backend", message: "..."})`.

O caminho normal de uma entrega:

```
pm  ──►  ui-ux  ──►  frontend ──┐
    └──►  backend ───────────────┼──►  reviewer  ──►  commit
    └──►  security (quando toca conta, dado ou dependência)
    └──►  deploy   (quando precisa de variável, migração ou passo no servidor)
```

Três regras de convivência:

1. **Mande contexto, não ordem.** O arquivo, a restrição, o critério de aceite. Cada especialista
   sabe o próprio ofício melhor que quem pediu.
2. **Quem descobre um problema fora da própria área não conserta: avisa.** O `frontend` que
   encontra falha de permissão manda para `security`, não corrige de passagem.
3. **O `reviewer` tem veto** sobre a regra que não se quebra e sobre a precisão química. É a
   única hierarquia que existe aqui.

## O que todos sabem antes de começar

O `CLAUDE.md` vale para os sete, e nenhum arquivo daqui o substitui:

- **O núcleo determinístico decide; a IA explica.** Química é do RDKit, do campo de força e do
  motor de missões.
- **Texto em pt-BR, código em inglês.** O erro explica a química, não o código.
- **GPL e AGPL estão vetadas.** O produto é proprietário e fechado.
- **Escopo estourando é o risco número um.** Ideia fora do MVP vai para `DEPOIS.md`.
