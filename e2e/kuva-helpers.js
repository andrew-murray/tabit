// Shared helpers and constants for tests using the kuva song.

const EXAMPLE_PATTERNS = ["k-1", "k-2", "lightbulb", "break", "squash"];

// Returns { instrumentName: innerText } for every visible instrument-part on the current page.
// The innerText includes the instrument heading and the notation rows below it, e.g.:
//   "Bass\n|1---|2---|...|8---|\n|O-O-|XO--|...|"
async function getPatternNotation(page) {
  const parts = page.getByTestId("instrument-part");
  const count = await parts.count();
  const result = {};
  for (let i = 0; i < count; i++) {
    const part = parts.nth(i);
    const name = (await part.locator("h4").innerText()).trim();
    result[name] = (await part.innerText()).trim();
  }
  return result;
}

// Expected innerText() for each visible instrument-part, keyed by pattern then instrument name.
// hideEmptyParts=true (from kuva.tabit) means instruments with no notes are absent.
const EXPECTED_NOTATION = {
  // k-1: all 5 instruments have notes
  "k-1": {
    Bass: "|1---|2---|3---|4---|5---|6---|7---|8---|\n|O-O-|XO--|X---|X---|O-O-|XO--|O-XO|--X-|",
    "Bass 2":
      "|1---|2---|3---|4---|5---|6---|7---|8---|\n|X-X-|X-XO|XOO-|O---|X-X-|X--O|O-XO|--X-|",
    Djembe:
      "|1---|2---|3---|4---|5---|6---|7---|8---|\n|t-tt|t-S-|--O-|O---|t-O-|tO-t|O-tO|--S-|",
    Snare:
      "|1---|2---|3---|4---|5---|6---|7---|8---|\n|--X-|X---|----|X--X|--X-|X-X-|----|X-XX|",
    Shaker:
      "|1---|2---|3---|4---|5---|6---|7---|8---|\n|XXXX|X-X-|----|XXX-|X-X-|--X-|XX-X|X-XX|",
  },
  // k-2: all 5 instruments have notes
  "k-2": {
    Bass: "|1---|2---|3---|4---|5---|6---|7---|8---|\n|OOO-|X---|X---|X-OO|O---|X---|X---|X---|",
    "Bass 2":
      "|1---|2---|3---|4---|5---|6---|7---|8---|\n|OOO-|X---|X---|X-OO|O---|X---|X---|X---|",
    Djembe:
      "|1---|2---|3---|4---|5---|6---|7---|8---|\n|OOO-|S---|--tS|-SOO|O-tt|-St-|tt-S|t---|",
    Snare:
      "|1---|2---|3---|4---|5---|6---|7---|8---|\n|X---|X--X|-X-X|X---|X--X|X--X|----|----|",
    Shaker:
      "|1---|2---|3---|4---|5---|6---|7---|8---|\n|X-XX|X-XX|XXX-|--X-|X-XX|X-XX|X-X-|--X-|",
  },
  // lightbulb: only Bass and Snare have notes; Bass 2, Djembe, Shaker are empty
  lightbulb: {
    Bass: "|1---|2---|3---|4---|\n|OOOO|O---|----|OOO3 |",
    Snare: "|1---|2---|3---|4---|\n|----|----|X---|----|",
  },
  // break: Bass 2 is empty; Bass, Djembe, Snare, Shaker have notes
  break: {
    Bass: "|1-|2-|3-|4-|\n|--|--|--|OO|",
    Djembe: "|1-|2-|3-|4-|\n|-t|t-|tt|-t|",
    Snare: "|1-|2-|3-|4-|\n|-X|X-|XX|-X|",
    Shaker: "|1-|2-|3-|4-|\n|-X|X-|XX|-X|",
  },
  // squash: Bass 2 is empty; Bass, Djembe, Snare, Shaker have notes
  squash: {
    Bass: "|1|2|3|4|\n|O|O|O|O|",
    Djembe: "|1|2|3|4|\n|O|O|O|O|",
    Snare: "|1|2|3|4|\n|X|X|X|X|",
    Shaker: "|1|2|3|4|\n|X|X|X|X|",
  },
};

module.exports = { EXAMPLE_PATTERNS, getPatternNotation, EXPECTED_NOTATION };
