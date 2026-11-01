import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Server, Sparkles } from 'lucide-react'
import { useDirectory } from '../lib/DirectoryContext'
import { formatCnpj, serverLabel } from '../lib/directory'
import { normalizeText } from '../lib/search'
import { onOpenCommandMenu } from '../lib/commandMenu'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'

/**
 * Busca rápida (⌘K / Ctrl+K): pula direto para uma organização ou marca.
 * Feita com o Command do shadcn (que usa o cmdk por baixo).
 */
export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { organisations } = useDirectory()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    const off = onOpenCommandMenu(() => setOpen(true))
    return () => {
      window.removeEventListener('keydown', onKey)
      off()
    }
  }, [])

  const { orgs, brands } = useMemo(() => {
    const orgs = [...organisations].sort((a, b) =>
      a.OrganisationName.localeCompare(b.OrganisationName),
    )
    // Marcas = Authorisation Servers com nome diferente da org (ex.: "Itaú", "Iti").
    const brands = orgs.flatMap((org) =>
      (org.AuthorisationServers ?? [])
        .filter((s) => s.CustomerFriendlyName && s.CustomerFriendlyName !== org.OrganisationName)
        .map((s) => ({ org, srv: s, name: serverLabel(org, s.CustomerFriendlyName) })),
    )
    return { orgs, brands }
  }, [organisations])

  const go = (path: string) => {
    setOpen(false)
    navigate(path)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Busca rápida"
      description="Encontre uma organização ou marca do diretório"
      className="sm:max-w-xl"
    >
      {/* Nesta versão do shadcn o CommandDialog não traz o <Command>: ele vai aqui. */}
      <Command>
        <CommandInput placeholder="Nome, marca ou CNPJ…" />
        <CommandList>
          <CommandEmpty>Nada encontrado.</CommandEmpty>
          <CommandGroup heading="Organizações">
            {orgs.map((org) => (
              <CommandItem
                key={org.OrganisationId}
                // value + keywords alimentam o filtro do cmdk; incluímos versões
                // sem acento e o CNPJ só com dígitos.
                value={`org ${org.OrganisationId}`}
                keywords={[
                  org.OrganisationName,
                  normalizeText(org.OrganisationName),
                  normalizeText(org.LegalEntityName),
                  (org.RegistrationNumber ?? '').replace(/\D/g, ''),
                ]}
                onSelect={() => go(`/participantes/${org.OrganisationId}`)}
              >
                <Building2 />
                <span className="truncate">{org.OrganisationName}</span>
                <CommandShortcut className="shrink-0 font-mono tracking-normal whitespace-nowrap">
                  {formatCnpj(org.RegistrationNumber)}
                </CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Marcas (Authorisation Servers)">
            {brands.map(({ org, srv, name }) => (
              <CommandItem
                key={srv.AuthorisationServerId}
                value={`srv ${srv.AuthorisationServerId}`}
                keywords={[name, normalizeText(name)]}
                onSelect={() => go(`/participantes/${org.OrganisationId}`)}
              >
                <Server />
                <span className="truncate">{name}</span>
                <CommandShortcut className="max-w-48 shrink-0 truncate tracking-normal">
                  {org.OrganisationName}
                </CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Páginas">
            <CommandItem value="pagina participantes" onSelect={() => go('/participantes')}>
              <Building2 /> Participantes
            </CommandItem>
            <CommandItem value="pagina vitrine" onSelect={() => go('/vitrine')}>
              <Sparkles /> Vitrine
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
