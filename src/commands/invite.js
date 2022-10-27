import { JsonResponse } from '../lib/JsonResponse';

export default {
  name: 'invite',
  description: 'Get an invite link to add the bot to your server',
  handler: handleInvite,
};

function handleInvite({ env }) {
  const applicationId = env.DISCORD_APPLICATION_ID;
  const INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${applicationId}&permissions=2147485696&scope=bot%20applications.commands`;
  return new JsonResponse({
    type: 4,
    data: {
      content: INVITE_URL,
      flags: 64,
    },
  });
}
