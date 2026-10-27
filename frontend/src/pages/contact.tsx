import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLoaderData, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { get, postEnquiry, ValidationError, type Enquiry } from '@/lib/api'

type Options = { services: string[]; budgets: string[]; timelines: string[] }

export const loader = ({ request }: { request: Request }) => get<Options>('/enquiry-options', request.signal)

const toEnquiry = (form: HTMLFormElement): Enquiry & { website: string } => {
  const d = new FormData(form)
  const v = (k: string) => String(d.get(k) ?? '').trim()
  return { name: v('name'), email: v('email'), company: v('company'), service: v('service'), budget: v('budget'), timeline: v('timeline'), idea: v('idea'), website: v('website') }
}

const briefText = (e: Enquiry) =>
  [
    'LegiTech.io project brief',
    '',
    `Name: ${e.name}`,
    `Email: ${e.email}`,
    `Company: ${e.company || 'Not provided'}`,
    `Service: ${e.service}`,
    `Budget: ${e.budget}`,
    `Timeline: ${e.timeline}`,
    '',
    'Project idea:',
    e.idea,
  ].join('\n')

function downloadBrief(text: string) {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
  link.download = 'legitech-project-brief.txt'
  link.click()
  // Revoke later: revoking synchronously can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}

const FieldError = ({ id, error }: { id: string; error?: string }) =>
  error ? (
    <p id={`${id}-error`} className="field-error">
      {error}
    </p>
  ) : null

function SelectField({ id, label, options, error, required, defaultValue, placeholder }: {
  id: string
  label: ReactNode
  options: string[]
  error?: string
  required?: boolean
  defaultValue?: string
  placeholder?: string
}) {
  return (
    <>
      <Label htmlFor={id}>{label}</Label>
      <Select name={id} required={required} defaultValue={defaultValue}>
        <SelectTrigger id={id} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError id={id} error={error} />
    </>
  )
}

export default function Contact() {
  const options = useLoaderData<typeof loader>()
  // Pricing "Get started" links pre-fill the service and the start of the brief.
  const [params] = useSearchParams()
  const presetService = options.services.find((s) => s === params.get('service'))
  const interest = params.get('interest')
  const formRef = useRef<HTMLFormElement>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState('')
  const [sending, setSending] = useState(false)

  const invalid = (k: string) => (errors[k] ? { 'aria-invalid': true, 'aria-describedby': `${k}-error` } : {})

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setSending(true)
    setErrors({})
    setStatus('')
    try {
      await postEnquiry(toEnquiry(form))
      form.reset()
      setStatus('Thanks, your enquiry has been sent. We will reply by email.')
    } catch (e) {
      if (e instanceof ValidationError) {
        const fieldErrors = Object.fromEntries(Object.entries(e.errors).map(([k, v]) => [k, v[0]]))
        setErrors(fieldErrors)
        // Some errors (e.g. the hidden anti-spam field) have no visible field, so always say something.
        setStatus('Please check the highlighted fields and try again.')
        requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      } else {
        setStatus(e instanceof Error ? e.message : 'Something went wrong.')
      }
    } finally {
      setSending(false)
    }
  }

  async function onBrief(mode: 'copy' | 'download') {
    const form = formRef.current
    if (!form?.reportValidity()) return
    const text = briefText(toEnquiry(form))
    if (mode === 'copy') {
      try {
        await navigator.clipboard.writeText(text)
        setStatus('Your project brief has been copied.')
        return
      } catch {
        // Clipboard needs a secure context and permission; fall back to a file.
      }
    }
    downloadBrief(text)
    setStatus(mode === 'copy' ? 'Copy was not available, so your brief has been downloaded.' : 'Your project brief has been downloaded.')
  }

  return (
    <>
      <title>Start a project | LegiTech.io</title>
      <meta name="description" content="Tell LegiTech.io about your software, website or app project." />
      <section className="page-hero section">
        <p className="eyebrow">START A CONVERSATION</p>
        <h1>
          Your next idea.
          <br />
          <span>Starts right here.</span>
        </h1>
        <p className="intro">Tell us what you have in mind. A few clear details are all you need to shape the first conversation.</p>
      </section>
      <section className="section contact-layout">
        <aside>
          <p className="eyebrow">LET’S GET THE BASICS RIGHT</p>
          <h2>
            What would
            <br />
            you like to build?
          </h2>
          <p>A new product, a better website or a simpler way to work. Start with the challenge and we can take it from there.</p>
          <div className="contact-note">
            <h3>We reply by email.</h3>
            <p>Sending this form shares your details with our team so we can respond. You can also copy or download the brief to keep a copy.</p>
          </div>
          <p className="small-copy">Please leave out passwords, payment information and other sensitive details.</p>
        </aside>
        <form id="project-form" ref={formRef} onSubmit={onSubmit}>
          <div className="form-grid">
            <div>
              <Label htmlFor="name">Your name *</Label>
              <Input id="name" name="name" required autoComplete="name" placeholder="Your full name" maxLength={120} {...invalid('name')} />
              <FieldError id="name" error={errors.name} />
            </div>
            <div>
              <Label htmlFor="email">Email address *</Label>
              <Input id="email" name="email" required type="email" autoComplete="email" placeholder="you@company.com" maxLength={254} {...invalid('email')} />
              <FieldError id="email" error={errors.email} />
            </div>
          </div>
          <Label htmlFor="company">Company</Label>
          <Input id="company" name="company" autoComplete="organization" placeholder="Your company or organisation" maxLength={160} {...invalid('company')} />
          <FieldError id="company" error={errors.company} />
          <SelectField id="service" label="What can we help with? *" options={options.services} error={errors.service} required placeholder="Select a service" defaultValue={presetService} />
          <Label htmlFor="idea">Tell us about your project *</Label>
          <Textarea
            id="idea"
            name="idea"
            rows={6}
            required
            minLength={10}
            maxLength={5000}
            defaultValue={interest ? `I'm interested in the ${interest.slice(0, 200)}.\n\n` : undefined}
            placeholder="What would you like to build, who is it for, and what needs to work better?"
            {...invalid('idea')}
          />
          <FieldError id="idea" error={errors.idea} />
          <div className="form-grid">
            <div>
              <SelectField id="budget" label="Budget range" options={options.budgets} error={errors.budget} defaultValue={options.budgets[0]} />
            </div>
            <div>
              <SelectField id="timeline" label="Ideal timeline" options={options.timelines} error={errors.timeline} defaultValue={options.timelines[0]} />
            </div>
          </div>
          {/* Honeypot: hidden from people and assistive tech; bots that fill it are rejected by the API. */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, minHeight: 0, opacity: 0 }} />
          <p className="small-copy">
            We use these details only to reply to your enquiry. <Link to="/privacy">Read the privacy notice.</Link>
          </p>
          <div className="form-actions">
            <Button className="pill" type="submit" disabled={sending}>
              {sending ? 'Sending…' : 'Send enquiry'} <span>↗</span>
            </Button>
            <Button className="outline-button" type="button" variant="outline" onClick={() => onBrief('copy')}>
              Copy brief
            </Button>
            <Button className="outline-button" type="button" variant="outline" onClick={() => onBrief('download')}>
              Download brief ↓
            </Button>
          </div>
          <p id="form-status" role="status" aria-live="polite">
            {status}
          </p>
        </form>
      </section>
    </>
  )
}
