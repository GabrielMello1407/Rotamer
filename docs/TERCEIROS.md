# Bibliotecas de terceiros

Este produto é **proprietário e fechado**. Toda dependência precisa de licença que permita uso
comercial em software fechado. **GPL e AGPL estão vetadas** — contaminam o produto inteiro.

Licenças aceitas: MIT, BSD (2 e 3 cláusulas), Apache-2.0, ISC.

## Dependências principais

| Biblioteca | Licença | Uso | Atribuição exigida |
|---|---|---|---|
| RDKit / RDKit.js | BSD-3-Clause | química, descritores, geometria | sim — aviso de copyright |
| Three.js | MIT | render 3D | sim — aviso de copyright |
| React, Next.js | MIT | aplicação | sim |
| OpenChemLib | BSD-3-Clause | conformação 3D e campo de força MMFF94 | sim — aviso de copyright |
| Comlink | Apache-2.0 | conversa com o Web Worker | sim — aviso e NOTICE |
| PubChem (NCBI/NLM) | dados de domínio público | busca de molécula por nome e verificação de composto conhecido | sim — crédito ao PubChem na tela onde o dado aparece |
| Archivo, IBM Plex | SIL Open Font License 1.1 | tipografia | sim — permite uso comercial e embutir |

## Ferramentas de desenvolvimento

Não vão para o pacote entregue ao usuário, mas entram na conta de licenças do repositório.

| Ferramenta | Licença |
|---|---|
| Turborepo | MIT |
| TypeScript | Apache-2.0 |
| ESLint, typescript-eslint | MIT |
| Vitest | MIT |
| Playwright | Apache-2.0 |
| pnpm | MIT |

> Confirme cada licença no repositório de origem antes de qualquer lançamento comercial.
> Este arquivo é um registro de trabalho, não aconselhamento jurídico.

> O PubChem é serviço de terceiro, com limite de ritmo e indisponibilidade ocasional. O produto
> não depende dele para funcionar: sem resposta, a busca por nome avisa e o resto segue igual.

## Onde as atribuições aparecem

- Neste arquivo, versionado no repositório.
- Numa página "Créditos" acessível a partir do rodapé do produto.

## Ao adicionar uma dependência

1. Verifique a licença **antes** de instalar.
2. Se for GPL ou AGPL, pare e procure alternativa.
3. Se for aceita, acrescente uma linha na tabela acima no mesmo commit.

## Umami

**Licença MIT.** Telemetria auto-hospedada, sem cookie, rodando no nosso VPS. Não é dependência
do pacote: é um script servido pelo nosso próprio domínio, carregado só quando
`UMAMI_SCRIPT_URL` está configurada.

Nenhum dado de aluno sai do servidor, e a lista de momentos medidos é fechada em
`apps/web/lib/track.ts`.
