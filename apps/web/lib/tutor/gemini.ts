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
 * O modelo padrão, trocável por `GEMINI_MODEL`.
 *
 * Versão fixa, e não um apelido como `gemini-flash-latest`: o tutor tem schema
 * fechado e prompt afinado, e trocar de modelo sem querer é trocar o
 * comportamento sem querer. O apelido também some sob demanda alta — medido
 * aqui: 503 em 41 s, enquanto a versão fixa respondeu em 7 s.
 *
 * Modelo antigo não fica só ruim: some. O `gemini-2.5-flash` que estava aqui
 * passou a devolver 404 para chave nova, e o tutor caía nas dicas escritas sem
 * ninguém entender por quê.
 */
const DEFAULT_MODEL = 'gemini-3.6-flash';
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
 */
export async function askGemini(prompt: string): Promise<GeminiResult | null> {
  const key = process.env['GEMINI_API_KEY'];
  if (key === undefined || key === '') return null;

  const model = tutorModel();
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, TIMEOUT_MS);

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
    if (!parsed.success) return null;

    return { hint: parsed.data, model };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
