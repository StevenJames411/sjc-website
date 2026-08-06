// The wire between "clicked a word on the canvas" and "that word's row, open, in the sidebar".
//
// ── WHY A LATCH AND NOT JUST AN EVENT ────────────────────────────────────────────────────────
// The two ends mount in the wrong order. Clicking a word inside a section that isn't selected
// yet does two things at once: Puck selects the section, and we ask for a row. But the sidebar
// field doesn't exist until AFTER the selection lands, so an event fired at click time is shouted
// into an empty room and the row never opens — which looks exactly like the feature not working.
//
// So the key is LATCHED as well as announced. A field already on screen hears the event; a field
// that mounts a moment later picks the key up off the latch. Both paths, one behaviour.
//
// ⚠️ The latch is single-use. Left set, the next section you select would scroll itself to a row
// belonging to the section you clicked before it.

type Listener = (key: string) => void;

let pending: string | null = null;
const listeners = new Set<Listener>();

/** Called from the canvas: "the person clicked the thing with this token." */
export function requestTextFocus(key: string) {
  pending = key;
  listeners.forEach((fn) => fn(key));
}

/** Called by a field as it mounts. Returns the key once, then forgets it. */
export function takePendingFocus(): string | null {
  const k = pending;
  pending = null;
  return k;
}

/** Called by a field already on screen. Returns its own unsubscribe. */
export function onTextFocus(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Clear without consuming — used when the selection changes for any other reason. */
export function clearPendingFocus() {
  pending = null;
}
