'use server';

import { isLocale, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from '@rotamer/i18n';
import { cookies } from 'next/headers';

/**
 * Guarda o idioma escolhido.
 *
 * Não é dado de conta: quem não entrou também escolhe, e a escolha vale para o
 * navegador, não para a pessoa. Por isso cookie comum, sem `httpOnly` — o
 * cliente precisa poder ler o que está valendo — e sem nada no banco.
 *
 * O servidor não confia no que chega: idioma que não conhecemos é ignorado, em
 * vez de virar um `lang` inventado no HTML.
 */
export async function chooseLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) return;

  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale, {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: LOCALE_COOKIE_MAX_AGE,
  });
}
