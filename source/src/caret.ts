export function caretOffset(el: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;
  const range = sel.getRangeAt(0).cloneRange();
  range.selectNodeContents(el);
  range.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
  return range.toString().length;
}
export function setCaret(el: HTMLElement, pos: number) {
  el.focus();
  const sel = window.getSelection(); if (!sel) return;
  const range = document.createRange();
  let remaining = pos; let node: Node | null = null; let off = 0;
  const walk = (n: Node): boolean => {
    if (n.nodeType === 3) { const len = (n.textContent || '').length; if (remaining <= len) { node = n; off = remaining; return true; } remaining -= len; return false; }
    for (let i = 0; i < n.childNodes.length; i++) if (walk(n.childNodes[i])) return true; return false;
  };
  if (!el.firstChild) { range.selectNodeContents(el); range.collapse(false); }
  else if (walk(el)) { range.setStart(node!, off); range.collapse(true); }
  else { range.selectNodeContents(el); range.collapse(false); }
  sel.removeAllRanges(); sel.addRange(range);
}
export const EMOJIS = '📄📁📌📎🗂️📋📝✅🎯🚗🏎️🏁🏆⭐🔥💡📰📱📅📖📚🎨🎬📷🎥🛠️⚙️🚀💰📈📊🧩🔧🧰🗓️📣💬❓❗👍👀🙌💪🎉✨🌟🔴🟡🟢🔵🟣⚫⚪🇪🇸'.match(/./gu) || [];
