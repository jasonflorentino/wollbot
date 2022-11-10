import { Router } from 'itty-router';
import {
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from 'discord-interactions';
import { pick } from 'lodash';

import { JsonResponse } from './lib/JsonResponse';
import { format, log, logError, messageKeys } from './lib/utils';
import { AWW, INVITE, ROLL, JAIL } from './commands';

const router = Router();

/**
 * A simple :wave: hello page to verify the worker is working.
 */
router.get('/', (request, env) => {
  return new Response(`👋 ${env.DISCORD_APPLICATION_ID}`);
});

/**
 * Main route for all requests sent from Discord.  All incoming messages will
 * include a JSON payload described here:
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object
 */
router.post('/', async (request, env) => {
  const message = request.json ? await request.json() : '';
  log('Request info (reduced):', format(pick(message, messageKeys)));

  // The `PING` message is used during the initial webhook handshake, and is
  // required to configure the webhook in the developer portal.
  if (message.type === InteractionType.PING) {
    log('Handling Ping request');
    return new JsonResponse({
      type: InteractionResponseType.PONG,
    });
  }

  // Handle command
  try {
    // Most user commands will come as `APPLICATION_COMMAND`.
    if (message.type === InteractionType.APPLICATION_COMMAND) {
      const inputCommand = message.data.name.toLowerCase();
      switch (inputCommand) {
        case AWW.name: {
          log('Handling Command:', inputCommand);
          return AWW.handler({ request, env, message });
        }
        case ROLL.name: {
          log('Handling Command:', inputCommand);
          return ROLL.handler({ request, env, message });
        }
        case INVITE.name: {
          log('Handling Command:', inputCommand);
          return INVITE.handler({ request, env, message });
        }
        case JAIL.name: {
          log('Handling Command:', inputCommand);
          return JAIL.handler({ request, env, message });
        }
        default:
          logError('Unknown Command:', inputCommand);
          return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
      }
    }
  } catch (e) {
    // Error was created by the command handler
    if (e instanceof JsonResponse) {
      return e;
    }
    // Uh oh, runtime error, send a nice error back to client
    else {
      logError(e);
      return new JsonResponse({
        type: 4,
        data: {
          content:
            'Sorry, my wires might be crossed! I ran into an error when trying to process your command. Please let my creator know.',
        },
      });
    }
  }

  logError('Unknown Type:', message.type);
  return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
});

router.all('*', () => new Response('Not Found.', { status: 404 }));

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'POST') {
      // Using the incoming headers, verify this request actually came from discord.
      const signature = request.headers.get('x-signature-ed25519') || '';
      const timestamp = request.headers.get('x-signature-timestamp') || '';
      log(
        'New request:',
        format({
          signature,
          timestamp,
          DISCORD_PUBLIC_KEY: env.DISCORD_PUBLIC_KEY,
        })
      );
      const body = await request.clone().arrayBuffer();
      const isValidRequest = verifyKey(
        body,
        signature,
        timestamp,
        env.DISCORD_PUBLIC_KEY
      );
      if (!isValidRequest) {
        logError('Invalid Request');
        return new Response('Bad request signature.', { status: 401 });
      }
    }
    // Dispatch the request to the appropriate route
    return router.handle(request, env);
  },
};
