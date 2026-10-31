// Acesso ao localStorage que nunca lança: com storage bloqueado (modo privado,
// cookies desativados) o acessor pode jogar SecurityError e derrubar a app.

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // storage indisponível ou cheio — segue só em memória
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // idem
  }
}
