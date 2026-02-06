'use client';

import { Keyboard } from 'lucide-react';

const shortcuts = [
  { key: '1', action: 'Positive' },
  { key: '2', action: 'Negative' },
  { key: '3', action: 'Neutral' },
  { key: '←', action: 'Previous' },
  { key: '→', action: 'Next' },
  { key: 'S', action: 'Skip' },
  { key: 'Z', action: 'Undo' },
];

export function KeyboardHints() {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-400">
        <Keyboard className="h-4 w-4" />
        Keyboard Shortcuts
      </div>
      <div className="flex flex-wrap gap-3">
        {shortcuts.map((shortcut) => (
          <div key={shortcut.key} className="flex items-center gap-2 text-sm">
            <kbd className="rounded bg-zinc-800 px-2 py-1 font-mono text-xs text-zinc-300">
              {shortcut.key}
            </kbd>
            <span className="text-zinc-500">{shortcut.action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default KeyboardHints;
