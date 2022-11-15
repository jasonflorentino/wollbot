import { get } from 'lodash';

import { JsonResponse } from '../lib/JsonResponse';

export default {
  name: 'jail',
  description: 'Lock up the dice you were using',
  handler: handleJail,
};

function handleJail({ message }) {
  const userNickname = get(message, 'member.nick');
  return new JsonResponse({
    type: 4,
    data: {
      content: `**${userNickname} used \\jail**\nI've put those dice in jail. Switching to a new set of dice.`,
    },
  });
}
