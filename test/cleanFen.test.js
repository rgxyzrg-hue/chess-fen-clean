import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanFen } from '../src/index.js';

const ITALIAN = 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3';

test('copied text is repaired', () => {
  const cases = {
    plain: ITALIAN,
    label: `FEN: ${ITALIAN}`,
    'lower-case label': `fen=${ITALIAN}`,
    'curly quotes': `“${ITALIAN}”`,
    'PGN header': `[FEN "${ITALIAN}"]`,
    'line break inside the placement': 'r1bqkbnr/pppp1ppp/2n5/4p3/\n2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
    'double and non-breaking spaces': 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R  b KQkq   -  3 3',
    'zero-width space': 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2​/PPPP1PPP/RNBQK2R b KQkq - 3 3',
    'typographic dash': 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq – 3 3',
    'capital side to move': 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R B KQkq - 3 3',
  };
  for (const [name, text] of Object.entries(cases)) {
    const c = cleanFen(text);
    assert.equal(c.problem, null, name);
    assert.equal(c.fen, ITALIAN, name);
  }
});

test('missing fields are filled in', () => {
  const p = 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R';
  assert.equal(cleanFen(`${p} b KQkq -`).fen, `${p} b KQkq - 0 1`);
  assert.equal(cleanFen(`${p} b`).fen, `${p} b - - 0 1`);
});

test('impossible castling and en passant are dropped', () => {
  assert.equal(cleanFen('4k2r/8/8/8/8/8/8/R4K1R w KQk - 0 1').fen, '4k2r/8/8/8/8/8/8/R4K1R w k - 0 1');
  assert.equal(cleanFen('4k3/8/8/8/4P3/8/8/4K3 w - e6 0 1').fen, '4k3/8/8/8/4P3/8/8/4K3 w - - 0 1');
});

test('plain-English reasons', () => {
  const why = (t) => cleanFen(t).problem;
  assert.match(why(''), /Paste/);
  assert.match(why('8/8/8/8/8/8/8 w - - 0 1'), /8 rows/);
  assert.match(why('8/8/8/8/8/8/8/K6 w - - 0 1'), /fewer than 8/);
  assert.match(why('8/8/8/8/8/8/8/K6k1 w - - 0 1'), /more than 8/);
  assert.match(why('8/8/8/8/8/8/8/K5xk w - - 0 1'), /not a piece/);
  assert.match(why('8/8/8/8/8/8/8/K7 w - - 0 1'), /Black has no king/);
  assert.match(why('k7/8/8/8/8/8/8/K5KK w - - 0 1'), /White has 3 kings/);
  assert.match(why('k7/8/8/8/8/8/8/KP6 w - - 0 1'), /first or last row/);
  assert.match(why('k7/8/8/8/8/8/8/K7'), /Whose move/);
  assert.match(why('k7/8/8/8/8/8/8/K7 x - - 0 1'), /"w" or "b"/);
  assert.match(why('k6R/8/8/8/8/8/8/K7 w - - 0 1'), /Black's king is in check/);
});
