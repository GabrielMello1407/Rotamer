import { dictionaryDivergences } from '@rotamer/i18n';
import { describe, expect, it } from 'vitest';
import { sourceBadgeMessages } from '../src/messages';

describe('o selo de origem fala os dois idiomas', () => {
  it('não tem chave sem par nem texto vazio', () => {
    expect(dictionaryDivergences(sourceBadgeMessages)).toEqual([]);
  });

  /**
   * O selo é a regra do produto virando pixel. Se um dia o texto de "gerado"
   * deixar de dizer que aquilo é hipótese, o indicador para de proteger o que
   * existe para proteger — e isso vale nos dois idiomas.
   */
  it('o selo de gerado continua dizendo que é hipótese, não medida', () => {
    expect(sourceBadgeMessages['pt-BR'].generated).toContain('hipótese');
    expect(sourceBadgeMessages.en.generated).toContain('hypothesis');
    expect(sourceBadgeMessages['pt-BR'].generatedTitle).toContain('não medida');
    expect(sourceBadgeMessages.en.generatedTitle).toContain('not a measurement');
  });
});
