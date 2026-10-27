import { data } from 'react-router'

export type Service = {
  slug: string
  number: string
  icon: string
  name: string
  summary: string
  hero_title: string
  heading: string
  body: string
  features: string[]
  deliverables: string[]
  related: { slug: string; name: string }[]
}

export type Insight = {
  slug: string
  category: string
  read_minutes: number
  title: string
  intro: string
  teaser_art: string | null
  sections: { heading: string; body: string }[]
  published_at: string
}

export type WorkConcept = {
  slug: string
  name: string
  tags: string
  title: string
  summary: string
  opportunity: string
  includes: string[]
}

export type Industry = {
  slug: string
  name: string
  summary: string
  service_slug: string | null
}

export type Enquiry = {
  name: string
  email: string
  company: string
  service: string
  budget: string
  timeline: string
  idea: string
}

/** Thrown by postEnquiry on a 422 so the form can show the server's messages next to each field. */
export class ValidationError extends Error {
  errors: Record<string, string[]>
  constructor(errors: Record<string, string[]>) {
    super('Validation failed')
    this.errors = errors
  }
}

const base = import.meta.env.VITE_API_URL ?? '/api'

/** GET for route loaders. Non-2xx responses become router errors, so errorElement renders them. */
export async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(base + path, { headers: { Accept: 'application/json' }, signal })
  if (!res.ok) throw data(null, { status: res.status, statusText: res.statusText })
  return (await res.json()).data
}

export async function postEnquiry(enquiry: Enquiry): Promise<void> {
  const res = await fetch(base + '/enquiries', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(enquiry),
  })
  if (res.status === 422) throw new ValidationError((await res.json()).errors)
  if (res.status === 429) throw new Error('Too many enquiries from this connection. Please try again in a minute.')
  if (!res.ok) throw new Error('We could not send your enquiry. Please try again or download the brief instead.')
}
