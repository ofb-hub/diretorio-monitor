import { cn } from '@/lib/utils'
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text'

// Cor da marca (o mesmo verde do `primary` do tema).
const BRAND = '#2ecc9b'

/**
 * Marca da app: dois espelhos frente a frente, abertos como portas — o "Open"
 * e o "Mirror" de OpenMirror. O da esquerda é o objeto (sólido); o da direita,
 * o reflexo (translúcido), que também remete à transparência do Open Finance.
 *
 * Sem fundo nem moldura, como as marcas de referência (Pix, Mastercard,
 * Dropbox): formas chapadas, legíveis em qualquer tamanho e fundo.
 * O mesmo desenho está em public/favicon.svg.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M5 7l10 3.5v11L5 25z" fill={BRAND} />
      <path d="M27 7l-10 3.5v11L27 25z" fill={BRAND} fillOpacity="0.45" />
    </svg>
  )
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2', compact && 'justify-center')}>
      <LogoMark className="size-9 shrink-0" />
      {!compact && (
        <div className="min-w-0 leading-tight">
          <div className="truncate font-heading text-[17px] font-semibold tracking-tight">
            Open<span className="text-primary">Mirror</span>
          </div>
          {/* AnimatedShinyText (Magic UI): um brilho atravessa o texto de tempos em tempos. */}
          <AnimatedShinyText className="mx-0 block truncate text-xs text-muted-foreground/80">
            Open Finance Brasil
          </AnimatedShinyText>
        </div>
      )}
    </div>
  )
}
