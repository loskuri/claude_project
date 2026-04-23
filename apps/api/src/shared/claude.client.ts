import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env.js';

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return _client;
}

export const NUTRIPLAN_SYSTEM_PROMPT = `Eres NutriPlan, un nutricionista experto especializado en cocina y hábitos alimentarios argentinos.
Creás planes de comidas prácticos y culturalmente apropiados usando ingredientes disponibles en supermercados argentinos (Carrefour, Día, Coto, Jumbo).

FORMATO DE RESPUESTA: Siempre responder con JSON válido solamente. Sin markdown, sin explicación fuera del JSON.

CONTEXTO CULTURAL:
- La comida principal es el almuerzo (12:00-14:00)
- La cena es más liviana, alrededor de las 21:00
- Incluir platos clásicos argentinos: asado, milanesa, empanadas, locro, guiso cuando corresponda
- Respetar estrictamente las restricciones alimentarias indicadas

PRECISIÓN NUTRICIONAL:
- Los valores de macros deben calcularse a partir de los pesos reales de los ingredientes
- Todas las cantidades en gramos salvo que se especifique lo contrario
- Los totales diarios deben estar dentro del 5% de los macros objetivo`;

const SYSTEM_WITH_CACHE = [
  {
    type: 'text' as const,
    text: NUTRIPLAN_SYSTEM_PROMPT,
    cache_control: { type: 'ephemeral' },
  },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
] as any;

export async function completeMessage(params: {
  userMessage: string;
  maxTokens?: number;
}): Promise<string> {
  const client = getClient();
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: params.maxTokens ?? 8192,
    system: SYSTEM_WITH_CACHE,
    messages: [{ role: 'user', content: params.userMessage }],
  });

  const block = response.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude');
  return block.text;
}

export async function* streamMessage(params: {
  userMessage: string;
  maxTokens?: number;
}): AsyncGenerator<string> {
  const client = getClient();
  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: params.maxTokens ?? 4096,
    system: SYSTEM_WITH_CACHE,
    messages: [{ role: 'user', content: params.userMessage }],
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text;
    }
  }
}
