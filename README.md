# chess-fen-clean

Clean chess positions (FEN) that people copy from books, PDFs, e-books,
websites and chats, and explain in plain English why a position is not legal.
Zero dependencies, one small file.

```js
import { cleanFen } from 'chess-fen-clean';

cleanFen('FEN: r1bqkbnr/pppp1ppp/2n5/4p3/\n2B1P3/5N2/PPPP1PPP/RNBQK2R b');
// { fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b - - 0 1', problem: null }

cleanFen('8/8/8/8/8/8/8/K7 w - - 0 1');
// { fen: null, problem: 'Black has no king.' }
```

## Why

A FEN copied by hand rarely arrives clean. Real examples this library fixes:

| Copied text | What goes wrong | What it does |
|---|---|---|
| `FEN: rnbqkbnr/... w KQkq - 0 1` | a label in front | removes it |
| `[FEN "rnbqkbnr/..."]` | a PGN header | takes the FEN out |
| `"rnbqkbnr/..."` | quotes, curly quotes | removes them |
| `.../4p3/` + line break + `2B1P3/...` | a line break inside the position (PDF, Kindle) | joins it |
| double spaces, non-breaking or zero-width spaces | invisible characters | removes them |
| `KQkq – 3 3` | a typographic dash instead of `-` | fixes it |
| `... b` only | no castling, en passant or move counters | fills in `- - 0 1` |
| `KQkq` with the king already moved | castling that cannot happen | drops that right |

When the position is not legal, `problem` says why, in words a player
understands:

- `A position needs 8 rows separated by "/" (this one has 7).`
- `Row 1 has fewer than 8 squares.`
- `"x" is not a piece letter (use K Q R B N P, small for Black).`
- `White has 2 kings.` / `Black has no king.`
- `A pawn is on the first or last row, which cannot happen.`
- `Whose move is it? Add "w" (White) or "b" (Black) after the position.`
- `Black's king is in check, but it is White's move. Check the side to move.`

## API

`cleanFen(text)` returns `{ fen, problem }`: a full six-field FEN and
`problem: null`, or `fen: null` and the reason.

`isAttacked(board, square, by)` is exported too: `board` maps squares
(`'e1'`) to pieces (`'wK'`, `'bP'`), `by` is `'w'` or `'b'`.

## Tests

```sh
npm test
```

## Origin

Written for [BEST CHESS](https://bestchessapp.github.io/), a free offline
chess app, so that positions from chess books can be pasted straight in.

## License

MIT
