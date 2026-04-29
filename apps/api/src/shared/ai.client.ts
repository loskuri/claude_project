import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { env } from '../config/env.js';

export type AIProvider = 'claude' | 'openai';

// ─── System prompt ────────────────────────────────────────────────────────────

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

// ─── Default models per provider ──────────────────────────────────────────────

const DEFAULT_MODELS: Record<AIProvider, string> = {
  claude: 'claude-sonnet-4-6',
  openai: 'gpt-4o',
};

// ─── Lazy singletons ──────────────────────────────────────────────────────────

let _anthropic: Anthropic | null = null;
let _openai: OpenAI | null = null;

function getAnthropicClient(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY no configurada en apps/api/.env');
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return _anthropic;
}

function getOpenAIClient(): OpenAI {
  if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY no configurada en apps/api/.env');
  if (!_openai) _openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return _openai;
}

function activeProvider(): AIProvider {
  return env.AI_PROVIDER as AIProvider;
}

function activeModel(): string {
  return env.AI_MODEL || DEFAULT_MODELS[activeProvider()];
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function completeMessage(params: {
  userMessage: string;
  maxTokens?: number;
}): Promise<string> {
  const provider = activeProvider();
  const model = activeModel();

  if (provider === 'claude') {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model,
      max_tokens: params.maxTokens ?? 8192,
      system: [
        {
          type: 'text',
          text: NUTRIPLAN_SYSTEM_PROMPT,
          // @ts-expect-error – cache_control is valid for Anthropic but not in the type defs
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: params.userMessage }],
    });
    const block = response.content[0];
    if (block.type !== 'text') throw new Error('Unexpected response type from Claude');
    return block.text;
  }

  // openai
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model,
    max_tokens: params.maxTokens ?? 8192,
    messages: [
      { role: 'system', content: NUTRIPLAN_SYSTEM_PROMPT },
      { role: 'user', content: params.userMessage },
    ],
  });
  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Unexpected empty response from OpenAI');
  return content;
}

export async function* streamMessage(params: {
  userMessage: string;
  maxTokens?: number;
}): AsyncGenerator<string> {
  const provider = activeProvider();
  const model = activeModel();

  if (provider === 'claude') {
    const client = getAnthropicClient();
    const stream = client.messages.stream({
      model,
      max_tokens: params.maxTokens ?? 4096,
      system: [
        {
          type: 'text',
          text: NUTRIPLAN_SYSTEM_PROMPT,
          // @ts-expect-error – cache_control is valid for Anthropic but not in the type defs
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: params.userMessage }],
    });
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
    return;
  }

  // openai
  const client = getOpenAIClient();
  const stream = await client.chat.completions.create({
    model,
    max_tokens: params.maxTokens ?? 4096,
    stream: true,
    messages: [
      { role: 'system', content: NUTRIPLAN_SYSTEM_PROMPT },
      { role: 'user', content: params.userMessage },
    ],
  });
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}
