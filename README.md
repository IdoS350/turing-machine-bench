# Turing Machine Bench

An interactive Turing machine simulator for studying computability. Define a transition function as text or directly in a table, then step through the computation forwards and backwards and watch the tape.

## Features

- **Two ways to write a machine:** a plain-text program editor with line-numbered errors, or a transition table where clicking any cell opens a rule editor. Both stay in sync.
- **Step-by-step control:** previous/next, jump by N steps, play/pause at 1–5,000 steps/s, or run to halt (capped at 100,000 steps for machines that never halt).
- **Full history:** every step can be undone; click any row in the trace to rewind to it.
- **Live feedback:** the next transition is highlighted in the table and spelled out under the tape; the run ends with _accepted_, _rejected_, or _halted_ and the reason why.
- **Examples:** binary increment, palindromes over {a, b}, aⁿbⁿ, unary addition, and the 3-state busy beaver.
- **Persistent:** your program, input and settings are saved in local storage.

## Getting started

Requires Node 20.19+ or 22.12+ and [pnpm](https://pnpm.io).

```sh
pnpm install
pnpm dev
```

Then open the URL Vite prints (usually http://localhost:5173).

### Scripts

| Command             | What it does                             |
| ------------------- | ---------------------------------------- |
| `pnpm dev`          | Start the dev server with HMR            |
| `pnpm build`        | Type-check and build for production      |
| `pnpm preview`      | Serve the production build locally       |
| `pnpm test`         | Run the unit tests once (Vitest)         |
| `pnpm test:watch`   | Run the unit tests in watch mode         |
| `pnpm typecheck`    | Type-check without building              |
| `pnpm lint`         | Lint with oxlint                         |
| `pnpm format`       | Format with Prettier                     |
| `pnpm format:check` | Check formatting without writing changes |

## Writing a machine

Set the **start state**, optional **accept** and **reject** states (comma- or space-separated), and write one rule per line:

```text
state read write move next
```

```text
; Adds 1 to a binary number.
right 0 0 R right
right 1 1 R right
right _ _ L carry
carry 1 0 L carry
carry 0 1 S done
carry _ 1 S done
```

- `_` is the blank symbol. Symbols are single characters; spaces in the input become blanks.
- `move` is `L`, `R` or `S` (stay).
- `*` as _read_ matches any symbol that has no more specific rule; as _write_ it leaves the cell unchanged; as _next_ it keeps the current state.
- Comments start with `;`. Arrows and commas are ignored, so `q0, 1 -> 0, R, q1` also works.
- The machine halts when it enters an accept or reject state, or when no rule applies. If accept states are defined, getting stuck counts as a reject.

Edits (in the text or the table) don't touch the running machine until you click **Load machine** (or press <kbd>⌘</kbd>/<kbd>Ctrl</kbd>+<kbd>Enter</kbd>).

### Keyboard shortcuts

| Keys                                       | Action               |
| ------------------------------------------ | -------------------- |
| <kbd>←</kbd> / <kbd>→</kbd>                | Previous/next step   |
| <kbd>Shift</kbd>+<kbd>←</kbd>/<kbd>→</kbd> | Back/forward N steps |
| <kbd>Space</kbd>                           | Play/pause           |
| <kbd>R</kbd>                               | Reset                |

## Project structure

```text
src/
├── machine/        Pure TypeScript engine (no React) + unit tests
│   ├── model.ts        Types and shared constants
│   ├── parser.ts       Program text → machine definition, with line-numbered errors
│   ├── machine.ts      Step, undo, run, rewind, halting rules
│   ├── programEdits.ts Rewrites program text from table edits
│   └── examples.ts     Built-in example machines
├── session/        MachineSession: owns the running machine and playback loop,
│                   publishes immutable snapshots via useSyncExternalStore
├── components/     One folder per component, each with its CSS module
├── hooks/          Keyboard shortcuts
├── lib/            Small utilities (class names, number formatting)
├── styles/         Design tokens, global styles, shared popup styles
├── settings.ts     Persisted settings (local storage)
├── App.tsx         Page layout and wiring
└── main.tsx        Entry point
```

### Design notes

- **The engine is framework-free.** Everything under `src/machine` is plain TypeScript with Vitest coverage, so the simulation logic can be tested and reasoned about on its own.
- **Playback lives outside React.** `MachineSession` mutates the machine in place (fast at thousands of steps per second) and emits a new immutable snapshot after each action, or at most once per animation frame during playback. Memoized components only re-render when their slice of the snapshot changes.
- **The text program is the single source of truth.** The transition table reads from it and writes back to it by rewriting the affected line, preserving comments.
- **[React Compiler](https://react.dev/learn/react-compiler) is on** (via Babel in `vite.config.ts`) with `panicThreshold: 'all_errors'`: if it can't optimize a component, the build fails rather than silently skipping it.
- **UI primitives come from [Base UI](https://base-ui.com)** (menu, popover, dialog, tooltip, slider, number field, form fields), styled with CSS Modules and the tokens in `src/styles/tokens.css`. Its full docs ship with the package under `node_modules/@base-ui/react/docs`.
- Imports use the `@/` alias for `src/` (configured in `vite.config.ts` and `tsconfig.app.json`); only co-located CSS modules are imported relatively.

## Tech stack

React 19 + React Compiler · TypeScript 7 · Vite 8 · Base UI · Vitest · oxlint · Prettier · pnpm
