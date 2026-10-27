import { useState, type FormEvent } from 'react'
import { Link, useLoaderData, useNavigate, type LoaderFunctionArgs } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { AdminValidationError, adminFetch } from './api'
import { findType, type Field } from './content-types'
import type { Row } from './content-list'

export async function loader({ params }: LoaderFunctionArgs) {
  const type = findType(params.type)
  if (!type) throw new Response(null, { status: 404 })
  const needsServices = type.fields.some((f) => f.kind === 'service' || f.kind === 'services')
  const [row, services] = await Promise.all([
    params.id ? adminFetch<{ data: Row }>('GET', `/${type.key}/${params.id}`).then((r) => r.data) : null,
    needsServices ? adminFetch<{ data: Row[] }>('GET', '/services').then((r) => r.data.map((s) => ({ slug: s.slug, name: String(s.name) }))) : [],
  ])
  return { typeKey: type.key, row, services }
}

type Values = Record<string, unknown>
const NONE = '__none__' // Radix Select can't use '' as an item value.

/** `datetime-local` wants local "YYYY-MM-DDTHH:mm"; the API sends/accepts ISO strings. */
const toLocalInput = (iso: unknown) => {
  if (!iso) return ''
  const d = new Date(String(iso))
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export function ContentForm() {
  const { typeKey, row, services } = useLoaderData<typeof loader>()
  const type = findType(typeKey)!
  const navigate = useNavigate()
  const [values, setValues] = useState<Values>(() => (row ? { ...type.empty, ...row } : { slug: '', ...type.empty }))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const set = (name: string, value: unknown) => setValues((v) => ({ ...v, [name]: value }))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      if (row) {
        await adminFetch('PUT', `/${type.key}/${row.id}`, values)
        toast.success('Saved.')
      } else {
        await adminFetch('POST', `/${type.key}`, values)
        toast.success(`Created. It is ${values.is_published === false || values.published_at === null ? 'hidden until you publish it' : 'live'}.`)
      }
      navigate(`/admin/${type.key}`)
    } catch (err) {
      if (err instanceof AdminValidationError) {
        setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v[0]])))
        toast.error('Please fix the highlighted fields.')
      } else {
        toast.error(err instanceof Error ? err.message : 'Save failed.')
      }
    } finally {
      setSaving(false)
    }
  }

  // Array fields report errors as "features.2" or "sections.0.body"; show them on the parent field.
  const errorFor = (name: string) => errors[name] ?? Object.entries(errors).find(([k]) => k.startsWith(name + '.'))?.[1]

  function input(f: Field) {
    const v = values[f.name]
    const id = `f-${f.name}`
    const invalid = errorFor(f.name) ? true : undefined
    switch (f.kind) {
      case 'text':
        return <Input id={id} value={String(v ?? '')} onChange={(e) => set(f.name, e.target.value)} aria-invalid={invalid} />
      case 'textarea':
        return <Textarea id={id} rows={3} value={String(v ?? '')} onChange={(e) => set(f.name, e.target.value)} aria-invalid={invalid} />
      case 'number':
        return <Input id={id} type="number" className="w-32" value={String(v ?? 0)} onChange={(e) => set(f.name, e.target.valueAsNumber || 0)} aria-invalid={invalid} />
      case 'switch':
        return <Switch id={id} checked={Boolean(v)} onCheckedChange={(c) => set(f.name, c)} />
      case 'datetime':
        return (
          <div className="flex items-center gap-2">
            <Input id={id} type="datetime-local" className="w-60" value={toLocalInput(v)} onChange={(e) => set(f.name, e.target.value ? new Date(e.target.value).toISOString() : null)} aria-invalid={invalid} />
            {Boolean(v) && (
              <Button type="button" variant="ghost" size="sm" onClick={() => set(f.name, null)}>
                Make draft
              </Button>
            )}
          </div>
        )
      case 'list':
        return (
          <Textarea
            id={id}
            rows={5}
            value={((v as string[]) ?? []).join('\n')}
            // Keep blank lines while typing; they are dropped on save by the trim below.
            onChange={(e) => set(f.name, e.target.value.split('\n'))}
            onBlur={(e) => set(f.name, e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
            aria-invalid={invalid}
          />
        )
      case 'sections': {
        const sections = (v as { heading: string; body: string }[]) ?? []
        const update = (i: number, patch: Partial<{ heading: string; body: string }>) => set('sections', sections.map((s, j) => (j === i ? { ...s, ...patch } : s)))
        return (
          <div className="grid gap-3">
            {sections.map((s, i) => (
              <Card key={i} className="py-4">
                <CardContent className="grid gap-2 px-4">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor={`${id}-${i}`}>Section {i + 1}</Label>
                    <Button type="button" variant="ghost" size="sm" disabled={sections.length === 1} onClick={() => set('sections', sections.filter((_, j) => j !== i))}>
                      Remove
                    </Button>
                  </div>
                  <Input id={`${id}-${i}`} placeholder="Heading" value={s.heading} onChange={(e) => update(i, { heading: e.target.value })} />
                  <Textarea placeholder="Text" rows={4} value={s.body} onChange={(e) => update(i, { body: e.target.value })} />
                </CardContent>
              </Card>
            ))}
            <Button type="button" variant="outline" className="justify-self-start" onClick={() => set('sections', [...sections, { heading: '', body: '' }])}>
              Add section
            </Button>
          </div>
        )
      }
      case 'service':
        return (
          <Select value={(v as string | null) ?? NONE} onValueChange={(s) => set(f.name, s === NONE ? null : s)}>
            <SelectTrigger id={id} className="w-72" aria-invalid={invalid}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>None (contact page)</SelectItem>
              {services.map((s) => (
                <SelectItem key={s.slug} value={s.slug}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case 'services': {
        const selected = (v as string[]) ?? []
        return (
          <div className="grid gap-2 sm:grid-cols-2">
            {services
              .filter((s) => s.slug !== row?.slug)
              .map((s) => (
                <Label key={s.slug} className="font-normal">
                  <Checkbox checked={selected.includes(s.slug)} onCheckedChange={(c) => set(f.name, c ? [...selected, s.slug] : selected.filter((x) => x !== s.slug))} />
                  {s.name}
                </Label>
              ))}
          </div>
        )
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-3xl gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{row ? `Edit ${type.singular}` : `New ${type.singular}`}</h1>
        <Button asChild variant="ghost">
          <Link to={`/admin/${type.key}`}>← Back</Link>
        </Button>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="f-slug">URL slug</Label>
        {row ? (
          <p className="text-sm text-muted-foreground">
            <code>{row.slug}</code> (fixed after creation, because site links depend on it)
          </p>
        ) : (
          <>
            <Input id="f-slug" value={String(values.slug)} onChange={(e) => set('slug', e.target.value)} placeholder="e.g. data-engineering" aria-invalid={errors.slug ? true : undefined} />
            <p className="text-sm text-muted-foreground">Lowercase letters, numbers and dashes. It cannot be changed later.</p>
          </>
        )}
        {errors.slug && <p className="text-sm text-destructive">{errors.slug}</p>}
      </div>
      {type.fields.map((f) => (
        <div key={f.name} className="grid gap-2">
          <Label htmlFor={`f-${f.name}`}>
            {f.label}
            {'optional' in f && f.optional && <span className="font-normal text-muted-foreground"> (optional)</span>}
          </Label>
          {input(f)}
          {'help' in f && f.help && <p className="text-sm text-muted-foreground">{f.help}</p>}
          {errorFor(f.name) && <p className="text-sm text-destructive">{errorFor(f.name)}</p>}
        </div>
      ))}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : row ? 'Save changes' : `Create ${type.singular}`}
        </Button>
        <Button asChild variant="outline">
          <Link to={`/admin/${type.key}`}>Cancel</Link>
        </Button>
      </div>
    </form>
  )
}
