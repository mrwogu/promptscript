// Render the prompt that the prod label points at and print the Anthropic request body.
// It makes no API call and needs no key.
import { fileURLToPath } from 'node:url';
import { createPromptClient, toAnthropicMessages } from '@promptscript/runtime';
import { directorySource } from '@promptscript/runtime/node';

const releases = fileURLToPath(new URL('./.promptscript/releases/', import.meta.url));

const client = createPromptClient({
  source: directorySource(releases),
  label: 'prod',
});

const prompt = await client.get('acme-support/refund-reply');
const rendered = prompt.render({
  order_total: 42.5,
  days_since_delivery: 12,
  message: 'The kettle arrived broken. Can I get my money back?',
});

console.log(JSON.stringify(toAnthropicMessages(rendered), null, 2));
