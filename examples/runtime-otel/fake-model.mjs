import { USAGE } from './scenario.mjs';

let next = 0;

// Stands in for the Anthropic Messages API: same response shape, fixed usage, no network.
export async function fakeAnthropic(body) {
  next += 1;
  return {
    id: `msg_example_${String(next).padStart(3, '0')}`,
    type: 'message',
    role: 'assistant',
    model: body.model,
    stop_reason: 'end_turn',
    usage: { ...USAGE },
    content: [
      {
        type: 'text',
        text: '{"decision":"approve","reply":"Sorry about the kettle. Your refund is on its way."}',
      },
    ],
  };
}
