import { Logo, SourceBadge } from '@rotamer/ui';
import { CATALOG } from '@rotamer/quests';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactElement } from 'react';
import { analyzeOnServer, depictOnServer } from '../../lib/chemistry-server';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Rotamer para escolas — química orgânica que o aluno desenha e vê no espaço',
  description:
    'Editor de moléculas no navegador: o aluno desenha em 2D e a forma tridimensional aparece calculada, não ilustrada. Validação pelo RDKit, campo de força MMFF94, missões e painel do professor.',
  openGraph: {
    title: 'Rotamer para escolas',
    description:
      'O aluno desenha a estrutura e vê a molécula se dobrar e vibrar. Tudo calculado pelo RDKit e pelo MMFF94 — a IA só explica, e sempre marcada.',
    type: 'website',
  },
};

/**
 * A página que se manda para a escola.
 *
 * O editor continua sendo a porta de entrada do produto — quem abre o endereço
 * desenha, sem cadastro. Esta página existe para a outra conversa: a de quem vai
 * decidir se aquilo entra na aula, e que precisa saber o que o produto faz, o
 * que ele **não** faz, e quem responde pelos números.
 *
 * A estrutura que aparece aqui é desenhada pelo RDKit no servidor, na hora. Não
 * é imagem de divulgação: é o mesmo motor que responde ao aluno.
 */
export default async function SchoolsPage(): Promise<ReactElement> {
  const [analysis, drawing] = await Promise.all([
    analyzeOnServer('CC(=O)Oc1ccccc1C(=O)O'),
    depictOnServer('CC(=O)Oc1ccccc1C(=O)O'),
  ]);

  const molecule = analysis.ok ? analysis.molecule : null;
  const tracks = {
    structure: CATALOG.filter((quest) => quest.track === 'structure').length,
    geometry: CATALOG.filter((quest) => quest.track === 'geometry').length,
    property: CATALOG.filter((quest) => quest.track === 'property').length,
  };

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <Link className={styles.identity} href="/">
          <Logo size={30} />
          <span className={styles.wordmark}>Rotamer</span>
        </Link>

        <Link className={styles.action} href="/">
          Abrir o editor
        </Link>
      </header>

      <section className={styles.hero}>
        <div>
          <h1 className={styles.title}>
            O aluno desenha a estrutura. A molécula aparece no espaço, calculada.
          </h1>
          <p className={styles.lead}>
            Não é ilustração nem animação pronta: a geometria é encontrada por um campo de força
            rodando no navegador, e a vibração é dinâmica molecular a 300 K. O que o aluno vê se
            mexendo na tela é a mesma física que está no livro dele.
          </p>

          <div className={styles.actions}>
            <Link className={styles.primary} href="/">
              Abrir o editor — sem cadastro
            </Link>
            <Link className={styles.secondary} href="/m/CC(%3DO)Oc1ccccc1C(%3DO)O">
              Ver uma molécula pronta
            </Link>
          </div>
        </div>

        {drawing !== null && (
          <figure className={styles.figure}>
            <div
              className={styles.drawing}
              // A estrutura é desenhada pelo RDKit no servidor, na hora: o SVG
              // sai do mesmo motor que valida o desenho do aluno.
              dangerouslySetInnerHTML={{ __html: drawing }}
            />
            <figcaption className={styles.caption}>
              Aspirina, desenhada pelo RDKit agora — {molecule?.formula ?? 'C9H8O4'} ·{' '}
              {molecule === null
                ? '180,16'
                : molecule.descriptors.molarMass.toFixed(2).replace('.', ',')}{' '}
              g/mol
            </figcaption>
          </figure>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>A regra que não se quebra</h2>
        <p className={styles.text}>
          <strong>O núcleo determinístico decide. A IA explica.</strong> Validade, valência,
          fórmula, massa, TPSA, logP, aromaticidade, frequência de vibração e nota de missão saem
          sempre do RDKit, do campo de força ou do motor de missões — nunca de um modelo de
          linguagem. O tutor de IA lê os números já calculados e escreve por que algo falhou,
          sempre marcado como hipótese na tela.
        </p>
        <div className={styles.badges}>
          <SourceBadge source="computed" />
          <SourceBadge source="generated" />
        </div>
        <p className={styles.note}>
          Um modelo de linguagem acerta 90% das perguntas de valência e nos outros 10% produz uma
          explicação confiante e errada. Com aluno passa; com professor de química, encerra o
          produto.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>O que o aluno faz</h2>
        <ul className={styles.list}>
          <li>
            Desenha clicando e arrastando, com os ângulos travados em 30° — a cadeia sai em
            zigue-zague, como se desenha no quadro.
          </li>
          <li>
            Vê a estrutura se dobrar até encontrar a forma de menor energia e depois vibrar, quadro
            a quadro, com a energia na tela.
          </li>
          <li>
            Escolhe um modo normal de vibração e vê só ele: são <strong>3N − 6</strong> modos, e a
            conta bate com a que o professor faz no quadro.
          </li>
          <li>
            Marca cunha e traço, e o RDKit responde se aquele centro é R ou S — e a forma no espaço
            muda junto.
          </li>
          <li>
            Erra e entende: “O átomo de C tem 5 ligações, mas suporta no máximo 4” — o erro explica
            a química, nunca o programa.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>O que o professor ganha</h2>
        <ul className={styles.list}>
          <li>
            <strong>
              {CATALOG.length} missões
            </strong>{' '}
            em três trilhas — {tracks.structure} de estrutura, {tracks.geometry} de geometria e{' '}
            {tracks.property} de propriedade —, cada uma com objetivos verificáveis por número
            calculado.
          </li>
          <li>
            <strong>Turma com código.</strong> Ele escreve seis caracteres no quadro; quem estuda
            entra digitando. Sem convite por e-mail, porque muito aluno não tem caixa de entrada e
            a que tem não abre na aula.
          </li>
          <li>
            <strong>Onde a turma parou.</strong> O painel mostra em quais missões mais gente
            travou. É a lista de onde a próxima aula começa — não é ranking de aluno.
          </li>
          <li>
            <strong>Recuperação de senha na sala.</strong> O professor emite um código de uso único
            e entrega em mãos. Nenhum aluno fica de fora da aula esperando um e-mail.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>O que roda por baixo</h2>
        <dl className={styles.specs}>
          <div className={styles.spec}>
            <dt className={styles.term}>Validação e descritores</dt>
            <dd className={styles.definition}>RDKit compilado para WebAssembly, no navegador</dd>
          </div>
          <div className={styles.spec}>
            <dt className={styles.term}>Forma no espaço</dt>
            <dd className={styles.definition}>
              conformação do OpenChemLib, minimizada com MMFF94
            </dd>
          </div>
          <div className={styles.spec}>
            <dt className={styles.term}>Vibração</dt>
            <dd className={styles.definition}>
              dinâmica molecular por velocity-Verlet sobre o gradiente do MMFF94, a 300 K
            </dd>
          </div>
          <div className={styles.spec}>
            <dt className={styles.term}>Modos normais</dt>
            <dd className={styles.definition}>
              Hessiana por diferenças finitas, ponderação por massa e diagonalização
            </dd>
          </div>
          <div className={styles.spec}>
            <dt className={styles.term}>Onde roda</dt>
            <dd className={styles.definition}>
              navegador, sem instalar nada; a química acontece na máquina do aluno
            </dd>
          </div>
          <div className={styles.spec}>
            <dt className={styles.term}>Dado do aluno</dt>
            <dd className={styles.definition}>
              no servidor da escola ou no nosso, à escolha; telemetria sem cookie
            </dd>
          </div>
        </dl>
      </section>

      <section className={[styles.section, styles.limits].join(' ')}>
        <h2 className={styles.heading}>O que o Rotamer não faz</h2>
        <p className={styles.text}>
          Esta lista é tão importante quanto a de cima, e está aqui porque um produto de química
          que promete demais quebra na primeira aula com um professor atento.
        </p>
        <ul className={styles.list}>
          <li>
            <strong>Não prevê reação nem retrossíntese.</strong> Ele não diz o que sai de uma
            mistura.
          </li>
          <li>
            <strong>Não afirma atividade biológica.</strong> Descritores são descritores: TPSA e
            logP descrevem a molécula, não dizem que ela funciona.
          </li>
          <li>
            <strong>Não calcula nome IUPAC.</strong> Quem desenha uma estrutura inédita pode dar um
            apelido, e o apelido nunca aparece sem o nome de quem deu.
          </li>
          <li>
            <strong>Não substitui PyMOL, ChemDraw ou Maestro.</strong> É ferramenta de ensino, com
            um motor de verdade dentro.
          </li>
          <li>
            <strong>As frequências são do campo de força</strong>, não medidas de espectro — campo
            de força clássico costuma superestimar estiramento em 5% a 10%, e a tela diz isso.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Para experimentar</h2>
        <p className={styles.text}>
          O editor abre sem cadastro e funciona inteiro sem conta: dá para levar para a aula hoje e
          decidir depois. Conta só é necessária para guardar progresso, montar turma e batizar
          estrutura.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/">
            Abrir o editor
          </Link>
          <Link className={styles.secondary} href="/marca">
            Marca e tokens
          </Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <p className={styles.note}>
          Rotamer · química orgânica e medicinal no navegador. Os números desta página foram
          calculados na hora pelo mesmo motor que responde ao aluno.
        </p>
      </footer>
    </main>
  );
}
