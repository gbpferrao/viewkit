import type { Editor } from '../app.composition';
export function bindShortcuts(editor: Editor) {
  const handler = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, [contenteditable=true]')) return;
    const command = event.ctrlKey || event.metaKey, key = event.key.toLowerCase();
    if (command && key === 'z') { event.preventDefault(); event.shiftKey ? editor.history.redo() : editor.history.undo(); }
    else if (command && key === 'y') { event.preventDefault(); editor.history.redo(); }
    else if (command && key === 'c') { event.preventDefault(); editor.history.copy(); }
    else if (command && key === 'v') { event.preventDefault(); editor.timeline.paste(editor.playback.time.value); }
    else if (key === 'delete' || key === 'backspace') { event.preventDefault(); editor.timeline.remove(); }
    else if (key === ' ') { event.preventDefault(); editor.playback.toggle(); }
    else if (key === 'arrowleft' || key === 'arrowright') { event.preventDefault(); editor.playback.step(key === 'arrowleft' ? -1 : 1); }
    else if (key === 's' && !command) { event.preventDefault(); editor.timeline.split(editor.playback.time.value); }
    else if (key === 'escape') editor.project.select([]);
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}

