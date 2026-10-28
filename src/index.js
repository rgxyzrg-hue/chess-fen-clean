// chess-fen-clean: turn a chess position copied by a person (from a book,
// a PDF, an e-book, a website or a chat) into a clean, legal FEN, or explain
// in plain English why it is not a legal position. No dependencies.
//
// Copied text often has a "FEN:" label, quotes, a [FEN "..."] PGN header,
// line breaks inside the position, double or invisible spaces, typographic
// dashes, or no move counters at all. All of that is repaired. Castling and
// en-passant fields that do not fit the pieces are dropped, not refused.

const PIECES = 'kqrbnp';
const FILES = 'abcdefgh';

/**
 * @param {string} raw text that should contain a FEN
 * @returns {{ fen: string|null, problem: string|null }}
 */
export function cleanFen(raw) {
  let text = String(raw ?? '')
    .replace(/[​-‍⁠﻿]/g, '')
    .replace(/[   \t\r\n]/g, ' ')
    .replace(/[‐-―−]/g, '-')
    .trim();
  const header = /\[\s*FEN\s+"([^"]*)"\s*\]/i.exec(text);
  if (header) text = header[1].trim();
  text = text
    .replace(/^(FEN|Position)\s*[:=.\-]?\s*/i, '')
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
    .replace(/\s*\/\s*/g, '/')
    .trim();
  if (!text) return fail('Paste or type a position.');

  const fields = text.split(/\s+/);
  const placement = fields[0];
  const rows = placement.split('/');
  if (rows.length !== 8) {
    return fail(`A position needs 8 rows separated by "/" (this one has ${rows.length}).`);
  }

  // board[square] = 'wK', 'bp' ... (colour + upper-case piece letter)
  const board = {};
  for (let row = 0; row < 8; row++) {
    let file = 0;
    for (const ch of rows[row]) {
      if (/[0-9]/.test(ch)) {
        const n = Number(ch);
        if (n < 1 || n > 8) return fail(`Row ${8 - row} has a wrong number "${ch}".`);
        file += n;
        continue;
      }
      if (!PIECES.includes(ch.toLowerCase())) {
        return fail(`"${ch}" is not a piece letter (use K Q R B N P, small for Black).`);
      }
      if (file > 7) return fail(`Row ${8 - row} has more than 8 squares.`);
      board[FILES[file] + (8 - row)] = (ch === ch.toUpperCase() ? 'w' : 'b') + ch.toUpperCase();
      file++;
    }
    if (file !== 8) {
      return fail(`Row ${8 - row} has ${file > 8 ? 'more' : 'fewer'} than 8 squares.`);
    }
  }

  const count = (side, type) => Object.values(board).filter((p) => p === side + type).length;
  for (const [side, name] of [['w', 'White'], ['b', 'Black']]) {
    const kings = count(side, 'K');
    if (kings === 0) return fail(`${name} has no king.`);
    if (kings > 1) return fail(`${name} has ${kings} kings.`);
    if (count(side, 'P') > 8) return fail(`${name} has more than 8 pawns.`);
    if (Object.values(board).filter((p) => p[0] === side).length > 16) {
      return fail(`${name} has more than 16 pieces.`);
    }
  }
  if (Object.entries(board).some(([sq, p]) => p[1] === 'P' && (sq[1] === '1' || sq[1] === '8'))) {
    return fail('A pawn is on the first or last row, which cannot happen.');
  }

  if (fields.length < 2) {
    return fail('Whose move is it? Add "w" (White) or "b" (Black) after the position.');
  }
  const turn = fields[1].toLowerCase();
  if (turn !== 'w' && turn !== 'b') {
    return fail(`After the position, "w" or "b" must say whose move it is (found "${fields[1]}").`);
  }

  // Castling: keep only the rights the king and rooks still allow.
  const castleIn = fields[2] ?? '-';
  let castling = '';
  for (const [letter, king, rook, side] of [
    ['K', 'e1', 'h1', 'w'], ['Q', 'e1', 'a1', 'w'], ['k', 'e8', 'h8', 'b'], ['q', 'e8', 'a8', 'b'],
  ]) {
    if (castleIn.includes(letter) && board[king] === side + 'K' && board[rook] === side + 'R') {
      castling += letter;
    }
  }
  if (!castling) castling = '-';

  // En passant: only a square a pawn really could take on.
  let ep = (fields[3] ?? '-').toLowerCase();
  if (ep !== '-') {
    const ok = /^[a-h][36]$/.test(ep) &&
      ((turn === 'w' && ep[1] === '6' && board[ep[0] + '5'] === 'bP') ||
        (turn === 'b' && ep[1] === '3' && board[ep[0] + '4'] === 'wP'));
    if (!ok) ep = '-';
  }

  const half = Number.parseInt(fields[4], 10);
  const full = Number.parseInt(fields[5], 10);
  const fen = `${placement} ${turn} ${castling} ${ep} ${Number.isFinite(half) && half >= 0 ? half : 0} ${Number.isFinite(full) && full >= 1 ? full : 1}`;

  // The side that just moved cannot have its king in check.
  const other = turn === 'w' ? 'b' : 'w';
  const king = Object.keys(board).find((sq) => board[sq] === other + 'K');
  if (isAttacked(board, king, turn)) {
    return fail(
      `${other === 'w' ? 'White' : 'Black'}'s king is in check, but it is ` +
      `${turn === 'w' ? 'White' : 'Black'}'s move. Check the side to move.`,
    );
  }
  return { fen, problem: null };
}

/** True when the side `by` ('w' or 'b') attacks `square` on `board`. */
export function isAttacked(board, square, by) {
  const f = FILES.indexOf(square[0]);
  const r = Number(square[1]);
  const at = (df, dr) => {
    const ff = f + df, rr = r + dr;
    return ff >= 0 && ff < 8 && rr >= 1 && rr <= 8 ? FILES[ff] + rr : null;
  };
  const is = (sq, type) => sq !== null && board[sq] === by + type;
  const pawnRow = by === 'w' ? -1 : 1;
  if (is(at(-1, pawnRow), 'P') || is(at(1, pawnRow), 'P')) return true;
  for (const [df, dr] of [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]) {
    if (is(at(df, dr), 'N')) return true;
  }
  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) if ((df || dr) && is(at(df, dr), 'K')) return true;
  }
  const ray = (dirs, types) => dirs.some(([df, dr]) => {
    for (let k = 1; k < 8; k++) {
      const sq = at(df * k, dr * k);
      if (sq === null) return false;
      if (board[sq]) return board[sq][0] === by && types.includes(board[sq][1]);
    }
    return false;
  });
  return ray([[1, 0], [-1, 0], [0, 1], [0, -1]], 'RQ') ||
    ray([[1, 1], [1, -1], [-1, 1], [-1, -1]], 'BQ');
}

function fail(problem) {
  return { fen: null, problem };
}
