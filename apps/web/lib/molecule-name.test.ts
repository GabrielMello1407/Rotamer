import { describe, expect, it } from 'vitest';
import { checkName, normalizeName } from './molecule-name';

/**
 * O apelido não pode se passar por nomenclatura.
 *
 * O produto não calcula nome de composto, e deixar alguém escrever "butanol"
 * como apelido seria construir exatamente a confusão que o D-01 evita — só que
 * com o usuário no lugar do modelo de linguagem.
 */

/**
 * Fixture escrita à mão para o D-15 (atualização de 27/08/2026) — NÃO vem do
 * IBGE nem de nenhuma base oficial de nomes.
 *
 * O `researcher` verificou a API de Nomes do IBGE antes desta lista existir:
 * ela não declara licença de reúso em nenhuma fonte primária (nem na
 * documentação da API, nem no termo de uso do portal, nem no Plano de Dados
 * Abertos) e, medida, devolve só 144 nomes distintos somando 108 chamadas —
 * abaixo dos 150 pedidos aqui. As duas razões bastam sozinhas para não entrar
 * num projeto MIT sem licença declarada na fonte (`CLAUDE.md`), então esta lista é criação
 * nossa, montada para expor exatamente o defeito da D-15: primeiro nome de
 * aluna (`Camila`, `Ludmila`...), nome curto que colide com símbolo de
 * elemento (`Na`, `Ba`) e palavra comum do dia a dia que termina como
 * nomenclatura sem ser (`Girassol`, `farol`, `humano`) não podem ser
 * recusados como se fossem fórmula ou nome sistemático.
 */
const BRAZILIAN_FIRST_NAMES = [
  // Femininos
  'Maria', 'Ana', 'Camila', 'Júlia', 'Juliana', 'Fernanda', 'Patrícia', 'Aline', 'Bruna', 'Carla',
  'Carolina', 'Cristina', 'Daniela', 'Débora', 'Eduarda', 'Elaine', 'Fabiana', 'Gabriela', 'Helena',
  'Isabela', 'Ivone', 'Jaqueline', 'Joana', 'Karina', 'Larissa', 'Letícia', 'Lívia', 'Lorena',
  'Lucia', 'Ludmila', 'Luiza', 'Márcia', 'Marina', 'Mariana', 'Michele', 'Natália', 'Paula',
  'Priscila', 'Rafaela', 'Renata', 'Roberta', 'Sabrina', 'Sandra', 'Silvia', 'Simone', 'Sofia',
  'Tatiane', 'Valentina', 'Vanessa', 'Vera', 'Viviane', 'Yasmin', 'Beatriz', 'Bianca', 'Amanda',
  'Adriana', 'Alice', 'Alessandra', 'Andrea', 'Barbara', 'Caroline', 'Catarina', 'Cecília', 'Celia',
  'Cláudia', 'Cristiane', 'Denise', 'Diana', 'Edna', 'Elisa', 'Elisabete', 'Emanuela', 'Estela',
  'Eva', 'Flavia', 'Francisca', 'Gabriele', 'Geovana', 'Gisele', 'Inês', 'Iris', 'Isadora', 'Ivana',
  'Janaína', 'Jéssica', 'Joaquina', 'Josefa', 'Karen', 'Kelly', 'Laura', 'Leila', 'Lilian',
  'Lorraine', 'Luana', 'Luciana', 'Magda', 'Manuela', 'Marcela', 'Margarida', 'Marisa', 'Marta',
  'Melissa', 'Milena', 'Mônica', 'Nádia', 'Nara', 'Nathalia', 'Nicole', 'Noemi', 'Olivia', 'Pamela',
  'Paloma', 'Raquel', 'Regina', 'Rita', 'Rosa', 'Rosana', 'Rute', 'Sara', 'Selma', 'Sheila',
  'Solange', 'Stella', 'Susana', 'Talita', 'Tainá', 'Tamires', 'Teresa', 'Thais', 'Vitória', 'Zilda',
  'Nonato', 'Mariano', 'Fabiano', 'Luciano', 'Cristiano', 'Emiliano', 'Silvana', 'Zulmira',
  'Antônia', 'Aparecida', 'Terezinha', 'Neusa', 'Ivete', 'Marlene', 'Vania', 'Kamila',
  'Bia', 'Sonia', 'Ângela', 'Isabel', 'Yara', 'Taís', 'Ester',
  // Masculinos
  'Jose', 'Joao', 'Antonio', 'Francisco', 'Carlos', 'Paulo', 'Pedro', 'Lucas', 'Luiz', 'Marcos',
  'Luis', 'Gabriel', 'Rafael', 'Daniel', 'Marcelo', 'Bruno', 'Eduardo', 'Felipe', 'Raimundo',
  'Rodrigo', 'Manoel', 'Fernando', 'Wellington', 'Diego', 'Vinicius', 'Alexandre', 'Sergio',
  'Roberto', 'Fabio', 'Wagner', 'Anderson', 'Cesar', 'Ricardo', 'Adriano', 'Andre', 'Gustavo',
  'Leonardo', 'Mauricio', 'Renato', 'Rogerio', 'Thiago', 'Vitor', 'William', 'Alan', 'Alex', 'Ivo',
  'Caio', 'Caua', 'Davi', 'Enzo', 'Hugo', 'Igor', 'Isaac', 'Ivan', 'Jonas', 'Julio', 'Leandro',
  'Levi', 'Matheus', 'Miguel', 'Nelson', 'Nicolas', 'Otavio', 'Samuel', 'Tiago', 'Valter', 'Yago',
  'Osvaldo', 'Geraldo', 'Wanderley', 'Elias', 'Moacir', 'Nilton', 'Osmar', 'Reinaldo', 'Waldemar',
  'Zeca', 'Heitor', 'Bento', 'Arthur', 'Benicio', 'Theo', 'Noah', 'Bernardo', 'Emanuel', 'Vicente',
  'Antônio', 'Cauã', 'Tainá', 'José', 'João', 'Luís',
];

/**
 * Palavras comuns do português — inclui de propósito as que a regra antiga
 * derrubava por engano: terminação de nomenclatura em palavra do dia a dia
 * (`farol`, `humano`, `sapato`) e símbolo curto de elemento que também é
 * palavra (`Na`, `Ba`). Nenhuma delas é apelido de composto — são só palavras.
 */
const COMMON_WORDS = [
  'Sol', 'Cristal', 'Girassol', 'Farol', 'Carnaval', 'Na', 'Ba', '3-Marias',
  'casa', 'mesa', 'porta', 'janela', 'livro', 'papel', 'lápis', 'caneta', 'cadeira', 'parede',
  'jardim', 'árvore', 'flor', 'água', 'fogo', 'terra', 'vento', 'céu', 'estrela', 'lua', 'chuva',
  'praia', 'montanha', 'rio', 'lago', 'cidade', 'rua', 'escola', 'professor', 'aluno', 'caderno',
  'quadro', 'giz', 'mochila', 'lanche', 'recreio', 'amigo', 'família', 'irmão', 'irmã', 'avô',
  'sobrinho', 'vizinho', 'trabalho', 'viagem', 'música', 'filme', 'jogo', 'bola', 'futebol',
  'natal', 'sinal', 'jornal', 'hospital', 'animal', 'capital', 'sisal', 'quintal', 'portal',
  'canal', 'humano', 'urbano', 'piano', 'oceano', 'plano', 'terreno', 'sereno', 'veneno', 'moreno',
  'destino', 'menino', 'sino', 'anzol', 'lençol', 'caracol', 'espanhol', 'azul', 'zona', 'sapato',
  'prato', 'gato', 'rato', 'pato', 'fila', 'vila', 'estilo', 'asilo',
];

describe('apelido aceito', () => {
  it('aceita nome de gente, de piada e de turma', () => {
    for (const nome of [
      'Molécula do Pedro',
      'Bicho de sete cabeças',
      'Turma 3B',
      "Coisa d'água",
      'Zé',
    ]) {
      expect(checkName(nome).ok).toBe(true);
    }
  });

  it('colapsa espaço sobrando', () => {
    expect(normalizeName('  Molécula   do   Pedro ')).toBe('Molécula do Pedro');
  });
});

describe('apelido recusado', () => {
  it('recusa fórmula', () => {
    expect(checkName('C9H8O4').problem).toBe('parece-formula');
    expect(checkName('CH4').problem).toBe('parece-formula');
    expect(checkName('C 9 H 8 O 4').problem).toBe('parece-formula');
  });

  it('recusa nome sistemático de uma palavra', () => {
    for (const nome of ['butanol', 'etanal', 'propanona', 'metilamina', 'benzoato']) {
      expect(checkName(nome).problem).toBe('parece-sistematico');
    }
  });

  it('continua recusando fórmula e nomenclatura de verdade, mesmo com a regra revista', () => {
    // Estes oito são o "caso inequívoco" que a D-15 (27/08/2026) manda continuar
    // recusando: raiz de cadeia carbônica junto do sufixo de função química, ou
    // notação de fórmula com dígito — nunca um nome ou palavra comum de verdade.
    for (const nome of ['butanol', 'etanal', 'propanona', 'metilamina', 'benzoato']) {
      expect(checkName(nome).problem).toBe('parece-sistematico');
    }
    // "Nonato" e "Decano" saíram da primeira tentativa de conserto: raiz junto
    // do sufixo, sem o infixo de saturação, casava non·ato e dec·ano e a regra
    // voltava a recusar nome de gente. "Decano" continua recusado de propósito
    // — decano é o alcano de dez carbonos.
    for (const nome of ['metano', 'decano', '2-metilbutano', 'metila']) {
      expect(checkName(nome).problem, nome).toBe('parece-sistematico');
    }

    // SMILES é notação e cai junto com a fórmula: "CCO" é o etanol escrito, e
    // aceitar isso como apelido é aceitar notação passando por nome.
    for (const formula of ['CCO', 'CN', 'OCCO', 'NaCl', 'C9H8O4', 'CH4', 'C 9 H 8 O 4']) {
      expect(checkName(formula).problem).toBe('parece-formula');
    }
  });

  it('mas deixa passar frase que só termina parecida', () => {
    // "do Pedro" não é nomenclatura; a regra vale para palavra solta.
    expect(checkName('A cetona do Pedro').ok).toBe(true);
  });

  it('recusa curto demais, longo demais e caractere estranho', () => {
    expect(checkName('a').problem).toBe('curto');
    expect(checkName('x'.repeat(41)).problem).toBe('longo');
    expect(checkName('CC(=O)O <script>').problem).toBe('caracteres');
  });

  it('explica em português o que houve', () => {
    const recusa = checkName('C6H6');
    expect(recusa.message).toContain('fórmula');
    expect(recusa.message).not.toMatch(/regex|invalid|error/i);
  });
});

describe('D-15 (27/08/2026): o apelido não pode barrar aluna nem deixar passar composto', () => {
  // Medido duas vezes antes desta correção: a regra antiga recusava o primeiro
  // nome da aluna ("Camila", "Girassol", "Sol"...) e o símbolo de elemento que
  // também é palavra ("Na", "Ba"), e o inverso — aceitava "cafeina", "aspirina",
  // "anilina" como se não fossem nome trivial de composto. Nenhum nome de gente
  // e nenhuma palavra comum pode continuar caindo no primeiro balde.
  it('nunca recusa primeiro nome brasileiro por parecer fórmula ou nomenclatura', () => {
    for (const nome of BRAZILIAN_FIRST_NAMES) {
      const resultado = checkName(nome);
      expect(resultado.problem, `"${nome}" não devia ser recusado`).not.toBe('parece-sistematico');
      expect(resultado.problem, `"${nome}" não devia ser recusado`).not.toBe('parece-formula');
    }
  });

  it('nunca recusa palavra comum do português por parecer fórmula ou nomenclatura', () => {
    for (const palavra of COMMON_WORDS) {
      const resultado = checkName(palavra);
      expect(resultado.problem, `"${palavra}" não devia ser recusada`).not.toBe('parece-sistematico');
      expect(resultado.problem, `"${palavra}" não devia ser recusada`).not.toBe('parece-formula');
    }
  });
});
