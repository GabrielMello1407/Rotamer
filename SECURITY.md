# Relatar uma falha de segurança

O Rotamer guarda conta de aluno, progresso de turma e o código que troca senha em sala. Quem acha
uma falha aqui pode estar segurando a chave da conta de um menor de idade. Obrigado por relatar com
cuidado.

## Como relatar

**Use o relato privado do GitHub**, nunca uma issue pública:

**[Security → Report a vulnerability](https://github.com/GabrielMello1407/Rotamer/security/advisories/new)**

A aba fica em `Security` no repositório. O relato só é visto por quem mantém o projeto até existir
correção, e é assim que uma instância no ar não fica exposta enquanto a correção é escrita.

**Não abra issue pública** para falha de segurança. Uma issue conta ao mundo como explorar a falha
antes de existir conserto, e cada escola que subiu a própria instância fica aberta nesse meio-tempo.

## O que escrever

Quanto mais concreto, mais rápido vira correção:

- **o caminho**, passo a passo, com os papéis envolvidos (aluno, professor, administrador) e a
  escola de cada conta — o papel e a escola são a fronteira de quase tudo aqui;
- **o que você conseguiu** que não deveria: ler, escrever, entrar numa conta, passar de um teto;
- **onde**: a tela, a ação de servidor ou o script, se você souber;
- **a versão**: a etiqueta que você subiu, ou o commit de `main`;
- se foi na **instância no ar** ou numa instalação própria.

Não precisa de exploit pronto nem de prova de conceito elaborada. Um parágrafo dizendo "de conta X
eu alcanço Y" já é o suficiente para investigarmos.

## O que conta como falha aqui

Estas são as fronteiras que o produto promete, e furar qualquer uma é falha:

- **papel.** Ninguém se autodeclara professor ou administrador; administrador só nasce no terminal, e
  pela tela ele promove no máximo a professor, da própria escola (decisões D-19 e D-29 em
  [docs/DECISOES.md](docs/DECISOES.md));
- **código de troca de senha.** Só sai para conta que não dá aula, da mesma escola de quem emite, e
  nunca para quem já deu aula. Qualquer caminho que contorne isso é escada para tomar conta alheia;
- **gabarito de missão.** `answerMolblock` e `answerInchiKey` nunca chegam ao navegador de um aluno,
  em nenhuma resposta — HTML, payload ou retorno de ação;
- **dado de aluno.** O professor vê progresso de missão da própria turma, nunca a molécula que o
  aluno desenhou fora dela, e nunca a turma de outra pessoa;
- **texto do professor.** Enunciado e dicas de missão não saem do servidor para o modelo de
  linguagem, nem para log, nem para mensagem de erro;
- **segredo.** Chave de API, senha de banco ou `.env` que apareça em imagem publicada, em arquivo
  versionado ou em resposta HTTP;
- **tetos.** Qualquer contorno dos limites por conta — pedidos ao tutor, conferências de missão,
  códigos de turma errados, consultas de papel.

## O que não é falha de segurança

Estas chegam com frequência e têm resposta escrita:

- **o número do RDKit não bate com o do PubChem.** Não é bug, é diferença de definição — TPSA com
  aromaticidade percebida, rotacionáveis na definição estrita. A tela diz de quem é a definição, e o
  cálculo nunca é ajustado para bater com tabela de terceiro. Se ainda acha que está errado, abra
  **issue de erro de química** — é o tipo de relato que mais importa aqui, só não é segurança;
- **a escola é um texto que a pessoa digita.** `Profile.institution` não é verificada, e numa
  instância com mais de uma escola um administrador alcança quem digitou o mesmo texto. É limitação
  conhecida e escrita (D-29, e [docs/FORA-DE-ESCOPO.md](docs/FORA-DE-ESCOPO.md)) — o que segura é
  uma pessoa conferindo nome e e-mail antes de confirmar, e o rastro de quem confirmou. Relate se
  achar um caminho que **dispense** essa coincidência;
- **o administrador vê o e-mail dos professores da escola dele.** É deliberado: sem isso, duas
  pessoas de mesmo nome ficam indistinguíveis na hora de rebaixar;
- **falha em dependência, já pública e já corrigida upstream.** Abra issue normal apontando a
  versão; atualizar dependência não precisa de sigilo.

## Resposta

O Rotamer é mantido por uma pessoa, sem empresa e sem programa de recompensa. Não prometo prazo que
não posso cumprir: o que prometo é **ler todo relato privado**, responder dizendo se entendi e o que
pretendo fazer, e tratar falha de tomada de conta ou de dado de aluno antes de qualquer outra coisa
na fila.

Não há pagamento. Há crédito, se você quiser: quem relatar é citado na correção e no registro de
decisões, pelo nome que pedir.

## Versões

O projeto ainda não tem versão etiquetada. Enquanto não tiver, **o que é mantido é o `main`** — a
instância no ar roda ele, e quem sobe a própria instância constrói dele ou puxa a imagem mais
recente. A partir da primeira etiqueta, a correção sai numa etiqueta nova, e é ela que quem hospeda
deve subir.

Se você mantém a própria instância, [docs/INSTALACAO.md](docs/INSTALACAO.md) tem o passo de
atualizar e o de backup. Atualize antes de relatar, se puder: a falha pode já ter conserto.
