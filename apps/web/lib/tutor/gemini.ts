import 'server-only';
import { SYSTEM_RULES } from './prompt';
import { tutorHintSchema, type TutorHint } from './schema';

/**
 * A chamada ao Gemini.
 *
 * Só o servidor fala com o modelo, e a resposta passa pelo schema fechado antes
 * de chegar perto da tela. Resposta que não valida é descartada — melhor não
 * explicar do que explicar errado.
 */

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
/*
 * O modelo padrão: o apelido que sempre aponta para o Flash mais novo.
 *
 * Modelo com versão no nome sai de circulação — o `gemini-2.5-flash` que estava
 * aqui passou a responder 404 para chave nova, e o efeito na tela era o tutor
 * calar como se não houvesse chave nenhuma. O apelido não tem essa validade.
 *
 * O preço do apelido é ele ficar indisponível sob demanda alta: medido aqui,
 * três pedidos seguidos voltaram 503. Por isso existe o reserva abaixo.
 */
const DEFAULT_MODEL = 'gemini-flash-latest';

/*
 * O reserva, para quando o apelido está fora do ar.
 *
 * Versão fixa de propósito: é o que não desaparece no meio de uma aula.
 *
 * Trocar este número faz parte de manter o produto: um dia ele também sai de
 * circulação, e o sinal é o tutor calar com a chave certa.
 */
const FALLBACK_MODEL = 'gemini-3.6-flash';

/*
 * O tempo total, contando as duas tentativas.
 *
 * Quem clicou está olhando para a tela. Duas esperas de vinte segundos em
 * sequência seriam quarenta segundos de nada — pior que a dica escrita à mão que
 * o produto tem de reserva.
 */
const TOTAL_BUDGET_MS = 26_000;
const TIMEOUT_MS = 20_000;

/** O mesmo schema, na forma que a API entende — força o JSON já na geração. */
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    diagnosis: { type: 'string' },
    suggestions: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 },
    watchOut: { type: 'string' },
  },
  required: ['diagnosis', 'suggestions'],
} as const;

export interface GeminiResult {
  readonly hint: TutorHint;
  readonly model: string;
}

export function tutorModel(): string {
  const configured = process.env['GEMINI_MODEL'];
  return configured === undefined || configured === '' ? DEFAULT_MODEL : configured;
}

export function tutorAvailable(): boolean {
  const key = process.env['GEMINI_API_KEY'];
  return key !== undefined && key !== '';
}

interface GeminiResponse {
  readonly candidates?: readonly {
    readonly content?: { readonly parts?: readonly { readonly text?: string }[] };
  }[];
}

/**
 * Pede a explicação. Devolve `null` em qualquer tropeço — chave ausente, rede
 * caída, resposta fora do schema, número solto no texto.
 *
 * Duas tentativas quando o modelo é o padrão: o apelido primeiro, o reserva
 * depois. É o que separa "o Google está ocupado agora" de "o tutor não
 * funciona".
 */
export async function askGemini(prompt: string): Promise<GeminiResult | null> {
  const key = process.env['GEMINI_API_KEY'];
  if (key === undefined || key === '') return null;

  // O reserva só entra quando o modelo veio do padrão: quem escreveu
  // `GEMINI_MODEL` no `.env` escolheu um modelo, e responder com outro por baixo
  // seria trocar o comportamento sem avisar.
  const chosen = tutorModel();
  const models = chosen === DEFAULT_MODEL ? [chosen, FALLBACK_MODEL] : [chosen];

  const deadline = Date.now() + TOTAL_BUDGET_MS;

  for (const model of models) {
    // O que sobrou do orçamento, nunca mais que o teto de uma tentativa: a
    // segunda chamada não pode herdar a espera inteira da primeira.
    const left = deadline - Date.now();
    if (left <= 0) return null;

    const hint = await tryModel(key, model, prompt, Math.min(left, TIMEOUT_MS));
    if (hint !== null) return { hint, model };
  }

  return null;
}

/** Uma tentativa contra um modelo. `null` em qualquer tropeço. */
async function tryModel(
  key: string,
  model: string,
  prompt: string,
  timeoutMs: number,
): Promise<TutorHint | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(`${ENDPOINT}/${model}:generateContent`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': key,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_RULES }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    });

    if (!response.ok) return null;

    const body = (await response.json()) as GeminiResponse;
    const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text === undefined) return null;

    const parsed = tutorHintSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
