import { useEffect, useState, type FormEvent } from 'react'
import { data, Link, redirect, useLoaderData, useRevalidator, type LoaderFunctionArgs } from 'react-router'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { gbp, get, startCheckout, ValidationError, type ItemType, type OrderStatus, type Pricing } from '@/lib/api'

type Item = { type: ItemType; id: number; name: string; description: string | null; amount: number; range: string; includes: string[] }

/** Finds the item in the public pricing data, so the page shows exactly what the API will charge (its min_price). */
function findItem(pricing: Pricing, type: string, id: number): Item | undefined {
  const base = (p: { id: number; name: string; description: string | null; min_price: number; price_display: string }) => ({
    id: p.id,
    description: p.description,
    amount: p.min_price,
    range: p.price_display,
  })
  if (type === 'package') {
    const p = pricing.categories.flatMap((c) => c.packages).find((x) => x.id === id)
    return p && { ...base(p), type, name: `${p.name} package`, includes: [`Delivery in ${p.delivery_time}`, `${p.revisions} revisions`, `${p.support_period} support after launch`] }
  }
  if (type === 'bundle') {
    const b = pricing.bundles.find((x) => x.id === id)
    return b && { ...base(b), type, name: b.name, includes: [...(b.package ? [`${b.package.name} package`] : []), ...b.addons.map((a) => a.name)] }
  }
  if (type === 'addon') {
    const a = [...pricing.categories.flatMap((c) => c.addons), ...pricing.general_addons].find((x) => x.id === id)
    return a && { ...base(a), type, name: a.name, includes: [] }
  }
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const item = findItem(await get<Pricing>('/pricing', request.signal), params.type ?? '', Number(params.id))
  if (!item) throw data(null, { status: 404 })
  return item
}

const FieldMessage = ({ id, error }: { id: string; error?: string }) =>
  error ? (
    <p id={`${id}-error`} className="field-error">
      {error}
    </p>
  ) : null

export default function Checkout() {
  const item = useLoaderData<typeof loader>()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState('')
  const [sending, setSending] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const invalid = (k: string) => (errors[k] ? { 'aria-invalid': true, 'aria-describedby': `${k}-error` } : {})

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const d = new FormData(event.currentTarget)
    const v = (k: string) => String(d.get(k) ?? '').trim()
    setSending(true)
    setErrors({})
    setStatus('')
    try {
      const url = await startCheckout({ item_type: item.type, item_id: item.id, name: v('name'), email: v('email'), company: v('company'), notes: v('notes'), accept_terms: accepted, website: v('website') })
      setStatus('Taking you to secure payment…')
      window.location.assign(url)
    } catch (err) {
      if (err instanceof ValidationError) {
        setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, m]) => [k, m[0]])))
        setStatus(err.errors.item_id ? err.errors.item_id[0] : 'Please check the highlighted fields.')
      } else {
        setStatus(err instanceof Error ? err.message : 'We could not start the payment. Please try again.')
      }
      setSending(false)
    }
  }

  return (
    <>
      <title>{`Checkout: ${item.name} | LegiTech.io`}</title>
      <meta name="description" content={`Pay for the ${item.name} securely online.`} />
      <meta name="robots" content="noindex" />
      <section className="page-hero section checkout-hero">
        <h1>
          Checkout
          <br />
          <span>{item.name}</span>
        </h1>
      </section>
      <section className="section contact-layout checkout-layout">
        <aside>
          <div className="checkout-summary">
            <h2>Order summary</h2>
            <p className="checkout-item">{item.name}</p>
            {item.description && <p className="small-copy">{item.description}</p>}
            {item.includes.length > 0 && (
              <ul>
                {item.includes.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            )}
            <dl className="checkout-total">
              <dt>You pay today</dt>
              <dd className="price-range">{gbp(item.amount)}</dd>
            </dl>
            <p className="small-copy">
              This is the starting price of the {item.range} range. If your project needs more than this covers, we agree the extra scope and cost with you before
              anything else is charged.
            </p>
          </div>
          <p className="small-copy">Payment is handled by Stripe. Card, Apple Pay, Google Pay or Klarna, depending on what is available to you.</p>
        </aside>
        <form onSubmit={onSubmit}>
          <div className="form-grid">
            <div>
              <Label htmlFor="name">Your name *</Label>
              <Input id="name" name="name" required autoComplete="name" maxLength={120} {...invalid('name')} />
              <FieldMessage id="name" error={errors.name} />
            </div>
            <div>
              <Label htmlFor="email">Email address *</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" maxLength={254} {...invalid('email')} />
              <FieldMessage id="email" error={errors.email} />
            </div>
          </div>
          <Label htmlFor="company">Company</Label>
          <Input id="company" name="company" autoComplete="organization" maxLength={160} {...invalid('company')} />
          <FieldMessage id="company" error={errors.company} />
          <Label htmlFor="notes">Anything we should know?</Label>
          <Textarea id="notes" name="notes" rows={4} maxLength={2000} placeholder="Optional: your website, deadline or a link to your brief." {...invalid('notes')} />
          <FieldMessage id="notes" error={errors.notes} />
          {/* Honeypot: hidden from people and assistive tech; bots that fill it are rejected by the API. */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, minHeight: 0, opacity: 0 }} />
          <div className="checkout-terms">
            {/* Explicit name: the links inside the label drop out of its computed accessible name. */}
            <Checkbox id="accept_terms" aria-label="I agree to the terms and have read the privacy notice" checked={accepted} onCheckedChange={(c) => setAccepted(c === true)} required {...invalid('accept_terms')} />
            <Label htmlFor="accept_terms">
              I agree to the <Link to="/terms">terms</Link> and have read the <Link to="/privacy">privacy notice</Link>.
            </Label>
          </div>
          <FieldMessage id="accept_terms" error={errors.accept_terms} />
          <div className="form-actions">
            <Button className="pill" type="submit" disabled={sending}>
              {sending ? 'Starting payment…' : `Pay ${gbp(item.amount)} securely`} <span aria-hidden="true">↗</span>
            </Button>
            <Link className="under-link" to="/pricing">
              Back to pricing
            </Link>
          </div>
          <p id="form-status" role="status" aria-live="polite">
            {status}
          </p>
        </form>
      </section>
    </>
  )
}

export async function successLoader({ request }: LoaderFunctionArgs) {
  const sessionId = new URL(request.url).searchParams.get('session_id')
  if (!sessionId) throw redirect('/pricing')
  return get<OrderStatus>(`/checkout/${encodeURIComponent(sessionId)}`, request.signal)
}

const copy: Record<OrderStatus['status'], [string, string, string]> = {
  paid: ['Payment received.', 'Thank you.', 'We have emailed you a confirmation and will be in touch to plan the next steps.'],
  pending: ['Confirming', 'your payment…', 'This usually takes a few seconds. You will also get an email once it is confirmed.'],
  failed: ['The payment', 'did not go through.', 'Nothing was charged. You can try again, or get in touch and we will help.'],
  expired: ['This checkout', 'has expired.', 'Nothing was charged. Start again from the pricing page whenever you are ready.'],
  refunded: ['This order', 'was refunded.', 'If you have any questions about it, please get in touch.'],
}

export function CheckoutSuccess() {
  const order = useLoaderData<typeof successLoader>()
  const { revalidate } = useRevalidator()
  const [checks, setChecks] = useState(0)
  // Stripe redirects here before its webhook may have reached us; re-check for about 30 seconds.
  useEffect(() => {
    if (order.status !== 'pending' || checks >= 10) return
    const timer = setTimeout(() => {
      setChecks((c) => c + 1)
      revalidate()
    }, 3000)
    return () => clearTimeout(timer)
  }, [order.status, checks, revalidate])
  const [line1, line2, body] = copy[order.status]
  return (
    <>
      <title>{order.status === 'paid' ? 'Payment received | LegiTech.io' : 'Order status | LegiTech.io'}</title>
      <meta name="robots" content="noindex" />
      <section className="page-hero section">
        <h1>
          {line1}
          <br />
          <span>{line2}</span>
        </h1>
        <p className="intro">{body}</p>
        <dl className="checkout-receipt">
          <div>
            <dt>Reference</dt>
            <dd>{order.reference}</dd>
          </div>
          <div>
            <dt>Item</dt>
            <dd>{order.item_name}</dd>
          </div>
          <div>
            <dt>Amount</dt>
            <dd>{gbp(order.amount)}</dd>
          </div>
        </dl>
        <div className="hero-actions">
          <Link className="pill" to="/">
            Back to home <span aria-hidden="true">↗</span>
          </Link>
          {order.status !== 'paid' && (
            <Link className="outline-button" to="/contact">
              Contact us
            </Link>
          )}
        </div>
      </section>
    </>
  )
}

export function CheckoutCancelled() {
  return (
    <>
      <title>Payment cancelled | LegiTech.io</title>
      <meta name="robots" content="noindex" />
      <section className="page-hero section">
        <h1>
          Payment cancelled.
          <br />
          <span>Nothing was charged.</span>
        </h1>
        <p className="intro">Changed your mind or have a question first? Pick another package, or tell us what you need and we will send a quote.</p>
        <div className="hero-actions">
          <Link className="pill" to="/pricing">
            Back to pricing <span aria-hidden="true">↗</span>
          </Link>
          <Link className="outline-button" to="/contact">
            Ask a question
          </Link>
        </div>
      </section>
    </>
  )
}
