import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Rola a janela ao topo quando o caminho muda (ex.: lista -> detalhe).
 * Observa só o pathname — mudar filtros/busca (querystring) não rola.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
