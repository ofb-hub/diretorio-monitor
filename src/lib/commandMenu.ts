// Abre a busca rápida (⌘K / Ctrl+K) de qualquer lugar da app sem precisar de
// contexto: quem abre dispara o evento, o CommandMenu (no Layout) escuta.

const EVENT = 'open-command-menu'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
/** Tecla modificadora do atalho, para exibir na interface: ⌘ no Mac, Ctrl no resto. */
export const modKeyLabel = isMac ? '⌘' : 'Ctrl'

export function openCommandMenu() {
  window.dispatchEvent(new Event(EVENT))
}

export function onOpenCommandMenu(handler: () => void): () => void {
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}
