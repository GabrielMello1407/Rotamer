<!--
Este texto não aparece na página do PR. É o mesmo caminho descrito em CONTRIBUTING.md,
resumido: se algum item não se aplica, apague a linha e diga por quê no corpo.
-->

## O que muda, e por quê

<!-- Duas ou três frases. Comece pelo problema, não pela solução. -->

## Como conferir

<!-- O caminho na tela, ou o comando. Quem revisa precisa reproduzir sem adivinhar. -->

## O teste que falharia sem esta mudança

<!-- O nome do teste e o arquivo. Se a mudança não tem teste, diga aqui por quê. -->

---

- [ ] `pnpm lint` e `pnpm typecheck` passam
- [ ] `pnpm test` passa — com o Postgres de pé, para os testes de ação rodarem
- [ ] `pnpm test:e2e` passa, ou eu digo abaixo por que não rodei
- [ ] Existe teste que falharia sem esta mudança
- [ ] Nenhuma pergunta de química é respondida por código próprio ou por modelo de linguagem —
      validade, fórmula, massa, descritor, aromaticidade, estereoquímica, frequência e nota de missão
      saem do RDKit, do campo de força ou do motor de missões
- [ ] Texto de tela e mensagem de erro em pt-BR; nome de arquivo, variável, função e chave de dado em
      inglês
- [ ] Cor, espaço, raio e duração vêm dos tokens; nenhuma cor CPK em botão, borda ou estado
- [ ] Mudança de schema tem migração aditiva, sem apagar nem reescrever coluna
- [ ] Dependência nova tem licença compatível com o MIT e entrou em `docs/TERCEIROS.md`
- [ ] O documento que esta mudança tornou desatualizado foi corrigido no mesmo PR

<!--
Se este PR mexe em conta, sessão, senha, código de recuperação, permissão de professor ou dado de
aluno, diga no corpo qual fronteira ele toca. E se você chegou aqui por causa de uma falha de
segurança que ainda não é pública, não abra PR: use o relato privado, em SECURITY.md.
-->
