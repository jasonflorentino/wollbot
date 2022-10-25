import {
  flow,
  identity,
  toLower,
  sample,
  trim,
  isEmpty,
} from 'lodash';

// Constants

const version = 'v1.0.1';
const date = '2022-10-24'
const CURSED = [0, 1, 1, 1, 2, 3];
const cleanString = flow([trim, toLower]);
const rollFormatRe = /^\d+d\d+$/;
const singleShortRollFormatRe = /^d\d+$/;
const modifierRe = /^[-\+].+$/;

// Main handler

export function handleRollInput(input) {
  // Globals
  let TEXT = '';
  let ERROR = '';
  let MOD = 0;
  let TOTAL = 0;

  // Handle input
  const args = input.trim().split(/\s/).filter(identity).map(cleanString);
  console.log('args:', args);

  // Parse args
  const hasCursed = args.find((str) => str === 'cursed');
  const rolls = args.filter(
    (str) => rollFormatRe.test(str) || singleShortRollFormatRe.test(str)
  );
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
    ERROR = `\`\`\`Will's Rollbot
==============
    
    USAGE   Performs rolls as defined by the input text.
    PARAMS  A string of space-separated arguments.
    ------- ------------------------------------------------------------------
    ARGS    cursed - A cursed roll. Will ignore 'd-rolls' if present.
            #d#    - A roll where the first # is the number of times and
                     the second # is the number of sides. Eg: 2d20
                     Will not work with in 'cursed-rolls'.
            adv    - Plays the given rolls a second time and takes the maximum.
            dis    - Plays the given rolls a second time and takes the minimum.
            -#     - A negative modifier. Eg: -3
            +#     - A positive modifier. Eg: +3
            help   - Shows this manual.
    ------- ------------------------------------------------------------------
    NOTES   The order of the arguments doesn't matter.
            If multiple modifiers are present, only the first will be used.
            Will return an error if both 'adv' and 'dis' are provided.
    EXAMPLE /roll d20 -3
            /roll 2d10 adv +4
            /roll +10 cursed
            /roll dis 2d27 -2 3d101

    RELEASE ${version} (${date})
    \`\`\``;
  }

  if (ERROR) {
    return ERROR;
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
      TEXT += `\`${randN2}!\`\n`;
      if (isAdv) {
        TOTAL += Math.max(randN, randN2);
        TEXT += `\nAdvantage: \`${Math.max(randN, randN2)}\` `;
      } else {
        TOTAL += Math.min(randN, randN2);
        TEXT += `\nDisadvantage: \`${Math.min(randN, randN2)}\` `;
      }
      // No Adv or Dis -- include first roll in total;
    } else {
      TOTAL += randN;
    }
  } else if (rolls.length) {
    const { total, text } = playRolls(rolls);
    TEXT += text;
    if (isAdv || isDis) {
      TEXT += '\nRolling again...'
      const { total: total2, text: text2 } = playRolls(rolls);
      TEXT += text2;
      if (isAdv) {
        TOTAL += Math.max(total, total2);
        TEXT += `\nAdvantage: \`${Math.max(total, total2)}\` `;
      } else {
        TOTAL += Math.min(total, total2);
        TEXT += `\nDisadvantage: \`${Math.min(total, total2)}\` `;
      }
    } else {
      TOTAL += total;
    }
  }

  // Handle modifer

  if (modifier) {
    TOTAL += MOD;
    TEXT += `\nWith modifier: \`${TOTAL}\``;
  }

  // Handle overflow text

  if (TEXT.length >= 2000) {
    TEXT = `There's too much text to fit into one message, but ${
      isAdv ? 'with advantage ' : isDis ? 'with disadvantage ' : ''
    }the total ${modifier ? 'with modifier ' : ''}is \`${TOTAL}\``;
  }

  return TEXT;
}

function playRolls(rolls) {
  let total = 0;
  let text = '';
  for (const roll of rolls) {
    let rollTotal = 0;
    let [times, sides] = roll.split('d');
    // There was no number preceding 'd'
    // Assume this is a shorthand single roll
    // eg. d20 vs. 1d20
    if (!times) {
      times = 1;
    }
    times = Number(times);
    sides = Number(sides);
    for (let i = 0; i < times; i++) {
      text += `\nRolling a \`d${sides}\`...`;
      const result = randNum(sides);
      text += `\`${result}\`! `;
      rollTotal += result;
      total += result;
    }
    if (times > 1) {
      text += `\nThat's \`${rollTotal}\`! `;
    }
  }
  if (rolls.length > 1) {
    text += `\nAll together that's \`${total}\`!`;
  }
  text += '\n';
  return {
    total,
    text,
  };
}

function randNum(n) {
  return Math.floor(Math.random() * n) + 1;
}
