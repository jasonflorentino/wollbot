import { flow, identity, toLower, sample, trim, isEmpty, get } from 'lodash';

import { JsonResponse } from '../lib/JsonResponse';
import { CommandOptionTypeEnum } from '../lib/constants';
import { randNum, logError } from '../lib/utils';

// Constants

const VERSION = 'v1.0.2';
const DATE = '2022-11-04';
const CURSED = [0, 1, 1, 1, 2, 3];
const HELP_TEXT = `\`\`\`Will's Rollbot
==============
    
    USAGE   Performs rolls as defined by the input text.
    PARAMS  A string of space-separated arguments.
    ------- ------------------------------------------------------------------
    ARGS    cursed  - A cursed roll. Will ignore 'd-rolls' if present.
            #d#     - A roll where the first # is the number of times and
                      the second # is the number of sides. Eg: 2d20
                      Will not work with in 'cursed-rolls'.
            adv     - Plays the given rolls a second time and takes the maximum.
            dis     - Plays the given rolls a second time and takes the minimum.
            -#      - A negative modifier. Eg: -3
            +#      - A positive modifier. Eg: +3
            for:"x" - Give a title to the roll. Title must be in double quotes.
            help    - Shows this manual.
    ------- ------------------------------------------------------------------
    NOTES   The order of the arguments doesn't matter.
            If multiple modifiers are present, only the first will be used.
            Will return an error if both 'adv' and 'dis' are provided.
            Modifiers can also be appended to d-rolls: 2d10+3
    EXAMPLE /roll d20 -3
            /roll 2d10 adv +4
            /roll +10 cursed
            /roll dis 2d27 -2 3d101
            /roll 4d4+2 for:"Perception check" adv

    RELEASE ${VERSION} (${DATE})
\`\`\``;

const cleanString = flow([trim, toLower]);
// With or without leading number for die count.
// With or without modifier appended to end.
const rollFormatRe = /^(\d+)?d\d+([-+]\d+)?$/;
const modifierRe = /^[-+]\d+$/;
const rollTitleRe = /for\w*:"[^:]+"/g;

const stringToArr = (str) =>
  str.trim().split(/\s/).filter(identity).map(cleanString);

// Main handler

export function handleRollInput(input) {
  // Globals
  let TEXT = '';
  let ERROR = '';
  let MOD = 0;
  let TOTAL = 0;
  let ADV_DIS = 0;

  // Handle input
  let args = input;
  if (typeof input === 'string') {
    args = stringToArr(input);
  }

  // Parse args
  const hasCursed = args.find((str) => str === 'cursed');
  const rolls = args.filter((str) => rollFormatRe.test(str));
  const isAdv = args.find((str) => str === 'adv' || str === 'advantage');
  const isDis = args.find((str) => str === 'dis' || str === 'disadvantage');
  const modifier = args.find((str) => modifierRe.test(str));
  const help = args.find((str) => str === 'help' || str === 'man');

  if (modifier) {
    MOD = Number(modifier);
  }

  // Validate inputs

  if (isAdv && isDis) {
    ERROR = `Input Error: Can't have both 'adv' and 'dis'`;
  }

  if (!hasCursed && isEmpty(rolls)) {
    ERROR = `Input Error: Couldn't find a roll. Include \`cursed\` or \`#d#\`.`;
  }

  if (Number.isNaN(MOD)) {
    ERROR = `Input Error: Expected modifier to be a number. Got '${modifier.substring(
      1
    )}'.`;
  }

  // Ignore errors and return early with
  // help text, if present.

  if (help) {
    ERROR = HELP_TEXT;
  }

  if (ERROR) {
    return [null, ERROR];
  }

  // Do either cursed or d-rolls

  if (hasCursed) {
    TEXT += '\nRolling a CURSED d6... ';
    const randN = sample(CURSED);
    TEXT += `\`${randN}\`! `;
    // Roll requires Advantage or Disadvantage
    if (isAdv || isDis) {
      TEXT += '\nRolling another CURSED d6...';
      const randN2 = sample(CURSED);
      TEXT += `\`${randN2}!\``;
      if (isAdv) {
        ADV_DIS += Math.max(randN, randN2);
      } else {
        ADV_DIS += Math.min(randN, randN2);
      }
      // No Adv or Dis -- include first roll in total;
    } else {
      TOTAL += randN;
    }
  } else if (rolls.length) {
    const { total, text } = playRolls(rolls);
    TEXT += text;
    if (isAdv || isDis) {
      TEXT += '\n**Rolling again...**';
      const { total: total2, text: text2 } = playRolls(rolls);
      TEXT += text2;
      if (isAdv) {
        ADV_DIS = Math.max(total, total2);
      } else {
        ADV_DIS = Math.min(total, total2);
      }
    } else {
      TOTAL += total;
    }
  }

  // Handle Adv or Dis

  if (ADV_DIS) {
    TOTAL += ADV_DIS;
    if (isAdv) {
      TEXT += `\nAdvantage: \`${ADV_DIS}\``;
    } else {
      TEXT += `\nDisadvantage: \`${ADV_DIS}\``;
    }
  }

  // Add modifer

  if (modifier) {
    TOTAL += MOD;
    TEXT += `\n**Final result with modifier: \`${TOTAL}\`**`;
  } else {
    TEXT += `\n**Final result: \`${TOTAL}\`**`;
  }

  // Handle overflow text

  if (TEXT.length >= 2000) {
    TEXT = `There's too much text to fit into one message, but ${
      isAdv ? 'with advantage ' : isDis ? 'with disadvantage ' : ''
    }the total ${modifier ? 'with modifier ' : ''}is \`${TOTAL}\``;
  }

  return [TEXT];
}

function playRolls(rolls) {
  const hasModRe = /[-+]\d+/;
  let total = 0;
  let text = '';
  // Handle multiple dice types as one roll
  for (let roll of rolls) {
    // Parse roll modifier
    let mod;
    if (hasModRe.test(roll)) {
      const minusIdx = roll.indexOf('-');
      const plusIdx = roll.indexOf('+');
      const modIdx =
        minusIdx !== -1 ? minusIdx : plusIdx !== -1 ? plusIdx : roll.length;
      // mod will be '' (coerced to 0) if for some reason both Idxs are -1
      mod = Number(roll.substring(modIdx));
      if (mod) {
        // Strip modifier from roll string
        roll = roll.slice(0, modIdx);
      }
    }

    let rollTotal = 0;
    let [times, sides] = roll.split('d');
    if (times === '') {
      // There was no number preceding 'd'
      // Assume this is a shorthand single roll
      // eg. d20 vs. 1d20
      times = 1;
    }
    times = Number(times);
    sides = Number(sides);

    // Handle a single dice type
    for (let i = 0; i < times; i++) {
      text += `\nRolling a \`d${sides}\`...`;
      const result = randNum(sides);
      text += `\`${result}\`! `;
      rollTotal += result;
      total += result;
    }
    // Total for this dice type
    if (times > 1) {
      text += `\nThat's \`${rollTotal}\`! `;
    }

    // Add mod for roll
    if (mod) {
      rollTotal += mod;
      total += mod;
      text += `\nWith modifier that's \`${rollTotal}\`! `;
    }
  }
  // Sum up total for multiple dice types
  if (rolls.length > 1) {
    text += `\nAll together that's \`${total}\`! `;
  }

  return {
    total,
    text,
  };
}

function handleRoll({ message }) {
  const userNickname = get(message, 'member.nick');
  let inputText = get(message, 'data.options[0].value', null);
  let cleanInput;

  const titleMatches = inputText.match(rollTitleRe);
  // eslint-disable-next-line no-unused-vars
  let [_rollTitlePrefix, rollTitle] = get(titleMatches, '0', '').split(':');
  if (rollTitle) {
    // Remove double quotes
    rollTitle = rollTitle.slice(1, rollTitle.length - 1);
    cleanInput = inputText.replace(rollTitleRe, '').trim();
  }

  let responseText = `**${userNickname} rolled${
    rollTitle ? ` *${rollTitle}* ` : ''
  }:** \`${cleanInput || inputText}\``;

  try {
    const [result, error] = handleRollInput(cleanInput || inputText);
    if (error) {
      responseText = `${userNickname} rolled: \`${inputText}\`\n` + error;
    } else {
      responseText += result;
    }
  } catch (e) {
    responseText += `Sorry, something went wrong when trying to process this roll.`;
    logError(e);
  }
  return new JsonResponse({
    type: 4,
    data: {
      content: responseText,
    },
  });
}

export default {
  name: 'roll',
  description: 'Dice rolls. Enter "/roll help" for usage.',
  options: [
    {
      name: 'params',
      description: 'Roll parameters',
      type: CommandOptionTypeEnum.STRING,
      required: true,
    },
  ],
  handler: handleRoll,
};
