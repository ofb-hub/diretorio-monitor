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

/** Símbolo + nome. Na sidebar recolhida, o Layout usa só o LogoMark. */
export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className="size-8 shrink-0" />
      <div className="min-w-0 leading-none">
        <div className="truncate font-heading text-lg font-bold tracking-tight">
          Open<span className="text-primary">Mirror</span>
        </div>
        {/* AnimatedShinyText (Magic UI): um brilho atravessa o texto de tempos em tempos. */}
        <AnimatedShinyText className="mx-0 mt-1 block truncate text-[11px] font-medium tracking-wide text-muted-foreground/80 uppercase">
          Open Finance Brasil
        </AnimatedShinyText>
      </div>
    </div>
  )
}
