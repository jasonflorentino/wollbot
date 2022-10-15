/*
Application Command Option Type
NAME	VALUE	NOTE
SUB_COMMAND	1	
SUB_COMMAND_GROUP	2	
STRING	3	
INTEGER	4	Any integer between -2^53 and 2^53
BOOLEAN	5	
USER	6	
CHANNEL	7	Includes all channel types + categories
ROLE	8	
MENTIONABLE	9	Includes users and roles
NUMBER	10	Any double between -2^53 and 2^53
ATTACHMENT	11

*/

const CommandOptionTypeEnum = {
  SUB_COMMAND: 1,
  SUB_COMMAND_GROUP: 2,
  STRING: 3,
  INTEGER: 4,
  BOOLEAN: 5,
  USER: 6,
  CHANNEL: 7,
  ROLE: 8,
  MENTIONABLE: 9,
  NUMBER: 10,
  ATTACHMENT: 11,
};

/**
 * Share command metadata from a common spot to be used for both runtime
 * and registration.
 */

export const AWW_COMMAND = {
  name: 'awwww',
  description: 'Drop some cuteness on this channel.',
};

export const INVITE_COMMAND = {
  name: 'invite',
  description: 'Get an invite link to add the bot to your server',
};

export const ROLL = {
  name: 'roll',
  description: 'rolllll',
  options: [
    {
      name: 'num_of_dice',
      description: 'How many dice to roll',
      type: CommandOptionTypeEnum.INTEGER,
      required: true,
    },
    {
        name: 'num_of_sides',
        description: 'How many sides the dice have',
        type: CommandOptionTypeEnum.INTEGER,
        required: true,
      },
  ],
};
