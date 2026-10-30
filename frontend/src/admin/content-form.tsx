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
import { get, type Pricing } from '@/lib/api'
import { apiPath, findType, type Field } from './content-types'
import type { Row } from './content-list'

export async function loader({ params }: LoaderFunctionArgs) {
  const type = findType(params.type)
  if (!type) throw new Response(null, { status: 404 })
  const needs = (...kinds: Field['kind'][]) => type.fields.some((f) => kinds.includes(f.kind))
  const options = (path: string) => adminFetch<{ data: Row[] }>('GET', path).then((r) => r.data.map((o) => ({ id: o.id, name: String(o.name) })))
  const [row, services, categories, packages, addons] = await Promise.all([
    params.id ? adminFetch<{ data: Row }>('GET', `${apiPath(type)}/${params.id}`).then((r) => r.data) : null,
    needs('service', 'services') ? adminFetch<{ data: Row[] }>('GET', '/services').then((r) => r.data.map((s) => ({ slug: s.slug, name: String(s.name) }))) : [],
    // Categories have no admin endpoint; the public pricing response lists them all.
    needs('category') ? get<Pricing>('/pricing').then((p) => p.categories.map((c) => ({ id: c.id, name: c.name }))) : [],
    needs('package') ? options('/pricing/packages') : [],
    needs('addons') ? options('/pricing/addons') : [],
  ])
  return { typeKey: type.key, row, services, categories, packages, addons }
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
  const { typeKey, row, services, categories, packages, addons } = useLoaderData<typeof loader>()
  const type = findType(typeKey)!
  const navigate = useNavigate()
  const [values, setValues] = useState<Values>(() => (row ? { ...type.empty, ...row } : type.slug === false ? { ...type.empty } : { slug: '', ...type.empty }))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const set = (name: string, value: unknown) => setValues((v) => ({ ...v, [name]: value }))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      if (row) {
        await adminFetch('PUT', `${apiPath(type)}/${row.id}`, values)
        toast.success('Saved.')
      } else {
        await adminFetch('POST', apiPath(type), values)
        toast.success(`Created. It is ${values.is_published === false || values.is_active === false || values.published_at === null ? 'hidden until you publish it' : 'live'}.`)
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
      case 'money':
        return (
          <Input
            id={id}
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            className="w-40"
            value={v === null || v === undefined ? '' : String(v)}
            // Optional amounts stay null when cleared (an open-ended maintenance price shows as "£150+").
            onChange={(e) => set(f.name, e.target.value === '' ? (f.optional ? null : 0) : e.target.valueAsNumber)}
            aria-invalid={invalid}
          />
        )
      case 'select':
        return (
          <Select value={String(v ?? '')} onValueChange={(s) => set(f.name, s)}>
            <SelectTrigger id={id} className="w-72" aria-invalid={invalid}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {f.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case 'category':
      case 'package': {
        const list = f.kind === 'category' ? categories : packages
        return (
          <Select value={v === null || v === undefined ? NONE : String(v)} onValueChange={(s) => set(f.name, s === NONE ? null : Number(s))}>
            <SelectTrigger id={id} className="w-72" aria-invalid={invalid}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE} disabled={!f.optional}>
                {f.kind === 'package' ? 'None' : f.optional ? 'All categories' : 'Choose a category'}
              </SelectItem>
              {list.map((o) => (
                <SelectItem key={o.id} value={String(o.id)}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      }
      case 'addons': {
        const selected = (v as number[]) ?? []
        return (
          <div className="grid gap-2 sm:grid-cols-2">
            {addons.map((a) => (
              <Label key={a.id} className="font-normal">
                <Checkbox checked={selected.includes(a.id)} onCheckedChange={(c) => set(f.name, c ? [...selected, a.id] : selected.filter((x) => x !== a.id))} />
                {a.name}
              </Label>
            ))}
          </div>
        )
      }
      case 'features': {
        const rows = (v as { label: string; value: string }[]) ?? []
        const update = (i: number, patch: Partial<{ label: string; value: string }>) => set('features', rows.map((r, j) => (j === i ? { ...r, ...patch } : r)))
        const move = (i: number, by: number) => {
          const next = [...rows]
          ;[next[i], next[i + by]] = [next[i + by], next[i]]
          set('features', next)
        }
        return (
          <div className="grid gap-2">
            {rows.map((r, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto] sm:items-center">
                <Input aria-label={`Row ${i + 1} label`} placeholder="Label, e.g. Pages" value={r.label} onChange={(e) => update(i, { label: e.target.value })} aria-invalid={errors[`features.${i}.label`] ? true : undefined} />
                <Input aria-label={`Row ${i + 1} value`} placeholder="Value, e.g. Up to 8 pages" value={r.value} onChange={(e) => update(i, { value: e.target.value })} aria-invalid={errors[`features.${i}.value`] ? true : undefined} />
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move row ${i + 1} up`}>
                    ↑
                  </Button>
                  <Button type="button" variant="ghost" size="sm" disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label={`Move row ${i + 1} down`}>
                    ↓
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => set('features', rows.filter((_, j) => j !== i))}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" className="justify-self-start" onClick={() => set('features', [...rows, { label: '', value: '' }])}>
              Add row
            </Button>
          </div>
        )
      }
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
      {type.slug !== false && (
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
      )}
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
