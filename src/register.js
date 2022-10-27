import fetch from 'node-fetch';
import { map, pick } from 'lodash';

import { AWW, INVITE, ROLL } from './commands/index.js';
import { log, logError } from './lib/utils';

/**
 * This file is meant to be run from the command line, and is not used by the
 * application server.  It's allowed to use node.js primitives, and only needs
 * to be run once.
 */

/* eslint-disable no-undef */

const token = process.env.DISCORD_TOKEN;
const applicationId = process.env.DISCORD_APPLICATION_ID;
const testGuildId = process.env.DISCORD_TEST_GUILD_ID;

if (!token) {
  throw new Error('The DISCORD_TOKEN environment variable is required.');
}
if (!applicationId) {
  throw new Error(
    'The DISCORD_APPLICATION_ID environment variable is required.'
  );
}

/**
 * Register all commands with a specific guild/server. Useful during initial
 * development and testing.
 */
// eslint-disable-next-line no-unused-vars
async function registerGuildCommands() {
  if (!testGuildId) {
    throw new Error(
      'The DISCORD_TEST_GUILD_ID environment variable is required.'
    );
  }
  if (!applicationId) {
    throw new Error(
      'The DISCORD_APPLICATION_ID environment variable is required.'
    );
  }
  log('Registering guild commands');
  const url = `https://discord.com/api/v10/applications/${applicationId}/guilds/${testGuildId}/commands`;
  const res = await registerCommands(url);
  const json = await res.json();
  log('response:', json);
  json.forEach(async (cmd) => {
    const response = await fetch(
      `https://discord.com/api/v10/applications/${applicationId}/guilds/${testGuildId}/commands/${cmd.id}`
    );
    if (!response.ok) {
      logError(`Problem removing command ${cmd.id}`);
      logError(`Response: ${JSON.stringify(response, null, 2)}`);
    }
  });
}

/**
 * Register all commands globally.  This can take o(minutes), so wait until
 * you're sure these are the commands you want.
 */
// eslint-disable-next-line no-unused-vars
async function registerGlobalCommands() {
  log('Registering global commands');
  const url = `https://discord.com/api/v10/applications/${applicationId}/commands`;
  await registerCommands(url);
}

async function registerCommands(url) {
  const commandData = map([AWW, ROLL, INVITE], (cmd) =>
    pick(cmd, ['name', 'description', 'options'])
  );
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${token}`,
    },
    method: 'PUT',
    body: JSON.stringify(commandData),
  });

  if (response.ok) {
    log('Registered all commands');
  } else {
    logError('Error registering commands');
    const text = await response.text();
    logError(text);
  }
  return response;
}

// await registerGlobalCommands();
await registerGuildCommands();
