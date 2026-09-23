# Idiomas

O Rotamer fala **português do Brasil e inglês**. O português é o idioma em que o
produto foi escrito e continua sendo o padrão — a sala de aula que motivou o
Rotamer é brasileira. O inglês existe para que a mesma instância sirva quem não
lê português, e para que qualquer escola possa subir a sua sem traduzir nada à
mão.

A regra de entrega é curta: **funcionalidade nova chega nos dois idiomas, ou não
chega.** Não é etiqueta de revisão — é o compilador que cobra, e a seção
"Como a regra é cobrada" explica como.

## Onde o texto mora

Junto de quem o usa, num arquivo `messages.ts` ao lado do componente, da rota ou
da server action. Não existe um arquivo central de tradução: tela e palavras da
tela mudam juntas, e quem mexe numa esbarra na outra.

```
apps/web/app/messages.ts                   título e descrição do site
apps/web/app/components/messages.ts        as peças da bancada
apps/web/app/turmas/messages.ts            turmas, listas e papéis da escola
packages/editor2d/src/messages.ts          barra, tabela periódica, atalhos
packages/quests/src/messages.ts            o catálogo de missões
packages/i18n/src/messages/chemistry.ts    a exceção explicada abaixo
```

A exceção é a química. `packages/core` **não depende de ninguém** — nem de
`@rotamer/i18n` — porque precisa rodar em teste de linha de comando. Então o
núcleo decide e devolve **código** (`valence_exceeded`) com os números que
justificam a recusa, e quem transforma código em frase é `chemistryErrorText`,
em `@rotamer/i18n`. O mesmo vale para o nome de grupo funcional:
`functionalGroupName('pt-BR', 'carboxylicAcid')`.

## Como se escreve um dicionário

```ts
import { dictionary } from '@rotamer/i18n';

export const saveMoleculeMessages = dictionary({
  'pt-BR': {
    save: 'Guardar na estante',
    saved: (name: string) => `${name} está na estante.`,
    attempts: (n: number) => `${String(n)} ${plural(n, 'tentativa', 'tentativas')}`,
  },

  en: {
    save: 'Save to the shelf',
    saved: (name: string) => `${name} is on the shelf.`,
    attempts: (n: number) => `${String(n)} ${plural(n, 'attempt', 'attempts')}`,
  },
});
```

Três coisas valem a pena notar:

- **Chave em inglês, texto no idioma.** É a mesma convenção do resto do código:
  nome de coisa em inglês, texto de tela em português.
- **Texto com número ou nome dentro é função, não modelo com `{chave}`.** Um
  modelo com marcador obriga a inventar gramática — plural, gênero, ordem de
  palavra — e o que se inventa nunca cobre os dois idiomas. Uma função por
  idioma cobre, porque cada uma é escrita por quem conhece aquele idioma.
- **Número é argumento, nunca texto pronto.** `plural()` e `formatNumber()`
  existem para isso. 46,07 e 46.07 são o mesmo número escrito em dois idiomas.

## Como se lê um dicionário

| Onde | Como |
|---|---|
| Componente de cliente | `const m = useMessages(saveMoleculeMessages);` |
| Componente de servidor, `page.tsx` | `const m = await serverMessages(saveMoleculeMessages);` |
| Server action | `const m = pick(saveMoleculeMessages, await currentLocale());` |
| Fora do React, com o idioma em mãos | `pick(dicionario, locale)` |

Número e data no cliente vêm de `useFormatters()`; no servidor, de
`formatNumber` e `formatDate`, que recebem o idioma. Nenhum `Intl` com `'pt-BR'`
escrito à mão sobra no código — é assim que a data deixa de aparecer como
21/09/2026 para quem lê inglês.

## Como a escolha chega à tela

Cookie `rotamer-locale`, lido no servidor. Sem cookie, vale o `Accept-Language`
do navegador; sem nada, pt-BR. É cookie e não `localStorage` como o tema porque
o servidor precisa do idioma: metade do texto é renderizada lá, e a nota de
missão é reavaliada lá. Com o idioma só no navegador, a página chegaria em
português e trocaria depois da hidratação.

**Onde se troca.** Um botão com o globo fica na barra de cima do editor e no cabeçalho de toda
página, e mostra o nome do **outro** idioma — `English` numa tela em português, `Português` numa
em inglês (`LanguageSwitch`). O seletor com as duas opções lado a lado (`LanguageToggle`) fica no
rodapé do painel de análise, ao lado do de tema, e na página `/marca`. Os dois gravam a escolha por
server action, seguida de `router.refresh()` — o servidor renderiza de novo, no idioma novo.

A primeira versão bilíngue só tinha o seletor do rodapé do painel, que começa fechado — e quem
testou não achou onde trocar o idioma. Por isso o botão fica onde a pessoa já está olhando.

**As rotas não mudam de idioma.** `/turmas` continua `/turmas` para quem lê
inglês. Endereço é identidade: link que o professor mandou para a turma no ano
passado precisa abrir, e um `/classes` paralelo dobraria a superfície de rota
para não ganhar nada que o `lang` do HTML já não diga.

## O que não se traduz

- **Conteúdo de quem usa o produto.** Nome de turma, enunciado de missão escrita
  por professor, apelido de molécula, nome de lista. Traduzir o que uma pessoa
  escreveu é reescrevê-la.
- **Notação química.** Fórmula, SMILES, InChIKey, símbolo de elemento, `R`/`S`,
  `E`/`Z`, unidade (`g/mol`, `Å²`). São iguais em toda língua, e mexer nisso
  seria erro de química, não de tradução.
- **Nome de idioma.** "Português" e "English" aparecem sempre no próprio idioma:
  quem procura o seletor é justamente quem não está entendendo a tela.
- **O nome do produto.** Rotamer é Rotamer.

## O glossário

Uma palavra por coisa, nos dois idiomas — na tela, na mensagem de erro e na documentação. O
inglês é o americano: é o que a documentação traduzida usa, e trocar de grafia no meio do produto
seria a mesma coisa que trocar de palavra.

| pt-BR | English |
|---|---|
| turma | class |
| lista | assignment |
| missão | mission |
| tentativa | attempt |
| estante | shelf |
| catálogo | catalog |
| apelido · batizar | nickname · give a nickname |
| professor · aluno | teacher · student |
| código de senha | password reset code |
| cumpriu · travou · não abriu | completed · stuck · not opened |
| Estrutura · Geometria · Propriedade | Structure · Geometry · Property |

O detalhe das telas de turma — `lista`, `item`, `publicar no catálogo`, `rascunho` e o que nunca
se diz no lugar de cada um — está na tabela do §2 do `ROTEIROS.md`. Nome de elemento segue a
IUPAC (`Aluminium`, `Caesium`, `Sulfur`); a busca da tabela periódica aceita também `aluminum` e
`cesium`, porque é assim que quem lê inglês americano vai digitar.

## A documentação

Os documentos também existem nos dois idiomas. O original é o em português; o gêmeo em inglês tem
**nome em inglês**, porque o nome do arquivo é a primeira coisa que o leitor lê — e `ROTEIROS.md` não
diz nada a quem só lê inglês:

| Original | Em inglês |
|---|---|
| `README.md` | `README.en.md` |
| `CONTRIBUTING.md` | `CONTRIBUTING.en.md` |
| `CODE_OF_CONDUCT.md` | `CODE_OF_CONDUCT.en.md` |
| `SECURITY.md` | `SECURITY.en.md` |
| `docs/GUIA.md` | `docs/en/USER-GUIDE.md` |
| `docs/INSTALACAO.md` | `docs/en/INSTALLATION.md` |
| `docs/ARQUITETURA.md` | `docs/en/ARCHITECTURE.md` |
| `docs/DESIGN-SYSTEM.md` | `docs/en/DESIGN-SYSTEM.md` |
| `docs/ROTEIROS.md` | `docs/en/CLASS-ASSIGNMENTS.md` |
| `docs/DECISOES.md` | `docs/en/DECISIONS.md` |
| `docs/PITCH.md` | `docs/en/PITCH.md` |
| `docs/ORIGEM.md` | `docs/en/ORIGINS.md` |
| `docs/ROADMAP.md` | `docs/en/ROADMAP.md` |
| `docs/DEPLOY.md` | `docs/en/DEPLOY.md` |
| `docs/FORA-DE-ESCOPO.md` | `docs/en/OUT-OF-SCOPE.md` |
| `docs/IDIOMAS.md` | `docs/en/LANGUAGES.md` |
| `docs/TERCEIROS.md` | `docs/en/THIRD-PARTY.md` |
| `docs/pesquisa/README.md` | `docs/en/research/README.md` |
| `docs/pesquisa/nomenclatura.md` | `docs/en/research/nomenclature.md` |

A primeira linha de cada documento em inglês registra **de qual original ele é tradução, e de qual
versão** — o caminho e o hash SHA-256 do texto:

```
<!-- source: docs/GUIA.md · sha256:41dbeef3… -->
```

É essa linha, e não o nome do arquivo, que liga os dois. Mudou o original, o hash deixa de bater, e
`packages/i18n/test/docs.test.ts` falha dizendo qual documento em inglês ficou para trás e qual é o
hash novo. Quem mudou o português atualiza o inglês e troca o hash na mesma entrega. O mesmo teste
confere que todo original tem exatamente um gêmeo, e que os dois têm os mesmos títulos, na mesma
ordem e nos mesmos níveis — o que pega a seção nova que entrou só de um lado. Documento novo em
português nasce com o gêmeo: nome em inglês e a linha de origem.

O que **não** tem gêmeo: `CLAUDE.md`, `AGENTS.md` e `.claude/` são instrução para assistente de
código, não documento para leitor — e continuam só em português. O mesmo vale para
`docs/divulgacao/`: é rascunho de peça que o `marketing` escreve em pt-BR para um público
brasileiro, e peça que muda de público muda de texto, não de idioma.

## Como a regra é cobrada

1. **`dictionary()` não compila sem o par.** O tipo do inglês é inferido do
   português, sem inferência própria: chave nova sem tradução falha em
   `pnpm typecheck`. É por isso que os dicionários se declaram com essa função e
   não como dois objetos soltos.
2. **`dictionaryDivergences()` pega o que o tipo não vê** — lista de dicas com
   três itens de um lado e duas do outro, função de um lado e frase do outro,
   texto vazio. Cada pacote com dicionário tem um teste de uma linha chamando-a.
3. **O núcleo não pode voltar a falar português.** `packages/core/test/errors.test.ts`
   exige que a recusa traga só código e números.
4. **`packages/i18n/test/chemistry.test.ts` lê o arquivo de tipos do núcleo** e
   falha se aparecer um código de erro sem frase nos dois idiomas.
5. **`apps/web/app/messages.test.ts` acha sozinho todo `messages.ts` do app** e falha se
   aparecer um dicionário novo que ninguém incluiu na conferência.
6. **`packages/i18n/test/docs.test.ts` confere cada documento contra o gêmeo em inglês** — o
   hash do original e a estrutura de títulos.

## Acrescentar um idioma

1. `LOCALES` em `packages/i18n/src/locale.ts`, e o nome dele em `LOCALE_NAMES`.
2. `negotiateLocale` passa a reconhecê-lo.
3. `Dictionary` e `dictionary()`, em `packages/i18n/src/dictionary.ts`, ganham a
   chave do idioma novo, com o mesmo `NoInfer` do inglês — até lá, `pick` nem
   compila.
4. `pnpm typecheck` lista, um por um, todos os dicionários que faltam — é a
   lista de tarefas, e ela é completa por construção.

Antes disso, vale a pergunta: idioma a mais é manutenção a mais para sempre. O
inglês entrou porque abre o produto para fora do Brasil sem pedir nada de quem
já usa. O terceiro precisa de um motivo desse tamanho.
