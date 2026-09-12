# O time

Nove papéis, um arquivo cada. O Claude Code lê o `description` de cada um para saber quando
chamar; o corpo do arquivo é a instrução que aquele agente recebe.

| Agente | O que ele decide | Quando chamar |
|---|---|---|
| `pm` | escopo, ordem, o que é "pronto" | antes de qualquer trabalho que atravesse mais de um pacote |
| `ui-ux` | layout, token, cor, texto em pt-BR | antes de o `frontend` escrever a tela |
| `frontend` | `apps/web`, `editor2d`, `viewer3d` | componente, estado, canvas, cena 3D |
| `backend` | server action, Prisma, `core`, worker, tutor | persistência, validação, cálculo químico |
| `security` | conta, sessão, dado de aluno, licença | antes de mexer em qualquer um dos quatro |
| `deploy` | build, imagem Docker, migração, backup, variável | quando a mudança precisa de passo de operação |
| `researcher` | o que se sabe, de onde veio, o que falta | quando a decisão depende de algo que ninguém sabe de cabeça |
| `marketing` | o que o produto diz de si em público | postagem, convite para testar, e-mail para escola |
| `reviewer` | se a entrega passa | ao final, sempre |

## Como eles conversam

Cada um tem `SendMessage` e `ListAgents` — e uma limitação que vale conhecer antes de contar com
ela: **`SendMessage` só alcança agente que já está rodando.** Chamar um colega que ninguém acordou
devolve "No agent named ... is reachable". Foi o que aconteceu na primeira entrega do `pm`.

Então o endereçamento de verdade é este: **entregue o achado a quem te chamou, dizendo para quem
ele interessa.** Quem chamou roteia — e é ele quem tem como acordar o especialista. Terminar a
resposta com uma linha "para o `security`: …" faz o trabalho chegar; um `SendMessage` para um
agente que não existe naquele momento, não.

Quando o colega **está** de pé, o nome do arquivo é o endereço: `SendMessage({to: "backend",
message: "..."})`.

O caminho normal de uma entrega:

```
                 ┌──►  ui-ux  ──►  frontend ──┐
pm  ──────────── ┼──►  backend ───────────────┼──►  reviewer  ──►  commit
                 ├──►  security (quando toca conta, dado ou dependência)
                 └──►  deploy   (quando precisa de variável, migração ou passo no servidor)

researcher  ──►  qualquer um deles, a qualquer momento
marketing   ──►  fala para fora, depois que o pm disse o que já pode ser prometido
```

O `researcher` não tem lugar fixo na fila: ele é chamado por quem estiver travado. O caso mais
comum é o `pm` antes de decidir — o pedido do usuário vira ideia bem posta depois de saber como
outros resolveram e o que o produto já tem.

Três regras de convivência:

1. **Mande contexto, não ordem.** O arquivo, a restrição, o critério de aceite. Cada especialista
   sabe o próprio ofício melhor que quem pediu.
2. **Quem descobre um problema fora da própria área não conserta: avisa.** O `frontend` que
   encontra falha de permissão manda para `security`, não corrige de passagem.
3. **O `reviewer` tem veto** sobre a regra que não se quebra e sobre a precisão química. É a
   única hierarquia que existe aqui.

E uma regra que vale só para pesquisa: **achado tem endereço e data**. Número sem fonte é boato, e
"recentemente" apodrece — pesquisa é lida meses depois de escrita.

## O que todos sabem antes de começar

O `CLAUDE.md` vale para os nove, e nenhum arquivo daqui o substitui:

- **O núcleo determinístico decide; a IA explica.** Química é do RDKit, do campo de força e do
  motor de missões.
- **Texto em pt-BR, código em inglês.** O erro explica a química, não o código.
- **Dependência precisa ser compatível com MIT em redistribuição.** GPL, LGPL e AGPL ficam
  fora — imporiam a quem redistribui o Rotamer obrigações que a nossa licença não impõe.
- **Escopo estourando é o risco número um.** Ideia fora do MVP vai para `docs/FORA-DE-ESCOPO.md`.
- **Nunca afirme** previsão de reação, atividade biológica, ou que o produto substitui ChemDraw,
  PyMOL ou Maestro. Vale no código, no documento e — principalmente — no que se publica.
