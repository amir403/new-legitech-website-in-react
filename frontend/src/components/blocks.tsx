import { Fragment } from 'react'
import { Link } from 'react-router'
import type { Industry, Insight, Service, WorkConcept } from '@/lib/api'

/** Renders "\n" in API text as <br>, the way the original headings break. */
export const lines = (text: string) =>
  text.split('\n').map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ))

type ServiceCard = Pick<Service, 'slug' | 'icon' | 'number' | 'name' | 'summary'>

export function ServiceCards({ services }: { services: ServiceCard[] }) {
  return (
    <div className="expanded-services">
      {services.map((s) => (
        <Link key={s.slug} className="service-card" to={`/services/${s.slug}`}>
          <div className="service-top">
            <span className="service-icon">{s.icon}</span>
            <span>{s.number}</span>
          </div>
          <h3>{s.name}</h3>
          <p>{s.summary}</p>
          <span className="card-link">
            Explore service <span>↗</span>
          </span>
        </Link>
      ))}
    </div>
  )
}

/** The three illustrative mock interfaces, keyed by work concept slug. New concepts without a mockup get the plain backdrop. */
const mockups: Record<string, React.ReactNode> = {
  operations: (
    <div className="mini-app">
      <aside>
        L<span>Overview</span>
        <span>Projects</span>
        <span>Team</span>
      </aside>
      <div className="mini-main">
        <small>WORKSPACE / OVERVIEW</small>
        <h4>A little more clarity.</h4>
        <div className="mini-stats">
          <div>12<small>Active projects</small></div>
          <div>08<small>In progress</small></div>
          <div>04<small>Ready for review</small></div>
        </div>
        <div className="mini-row"><span>Website experience</span><b>In progress</b></div>
        <div className="mini-row"><span>Customer portal</span><b>Review</b></div>
        <div className="mini-row"><span>Workflow automation</span><b>Planned</b></div>
      </div>
    </div>
  ),
  learning: (
    <div className="learning-app">
      <div className="mini-nav">learn / <span>My classroom</span></div>
      <small>YOUR NEXT CHAPTER</small>
      <h4>Make room<br />for discovery.</h4>
      <div className="lesson"><span>01</span><div>Introduction to design<small>Lesson resources · 25 min</small></div><b>↗</b></div>
      <div className="lesson"><span>02</span><div>Build your first prototype<small>Practical workshop · 40 min</small></div><b>↗</b></div>
    </div>
  ),
  commerce: (
    <div className="commerce-app">
      <div className="mini-nav">OBJECT / <span>Collection 01</span></div>
      <h4>Everyday.<br />Considered.</h4>
      <div className="catalogue">
        <div><span className="sample-swatch swatch1"></span><small>STONE / 01</small></div>
        <div><span className="sample-swatch swatch2"></span><small>OLIVE / 02</small></div>
        <div><span className="sample-swatch swatch3"></span><small>CARBON / 03</small></div>
      </div>
      <div className="shop-line">A material palette for modern living <span>↗</span></div>
    </div>
  ),
}

/** On Home the visual is decorative (the card caption names it); on Work it is labelled. */
export function ProjectVisual({ concept, decorative }: { concept: Pick<WorkConcept, 'slug' | 'name'>; decorative?: boolean }) {
  return (
    <div
      className={`project-visual visual-${concept.slug}`}
      {...(decorative ? { 'aria-hidden': true } : { 'aria-label': `Illustrative ${concept.name} interface`, role: 'img' })}
    >
      {mockups[concept.slug]}
    </div>
  )
}

export function ProjectCards({ concepts }: { concepts: WorkConcept[] }) {
  return (
    <div className="project-grid">
      {concepts.map((c) => (
        <Link key={c.slug} to={`/work#${c.slug}`} className="project-card">
          <ProjectVisual concept={c} decorative />
          <div className="project-caption">
            <div>
              <small>ILLUSTRATIVE CONCEPT</small>
              <h3>{c.name}</h3>
              <p>{c.tags}</p>
            </div>
            <span>↗</span>
          </div>
        </Link>
      ))}
    </div>
  )
}

const pad = (n: number) => String(n).padStart(2, '0')

export function IndustryGrid({ industries }: { industries: Industry[] }) {
  return (
    <div className="industry-grid">
      {industries.map((ind, i) => (
        <Link key={ind.slug} to={ind.service_slug ? `/services/${ind.service_slug}` : '/contact'}>
          <span>{pad(i + 1)}</span>
          <h3>{ind.name}</h3>
          <p>{ind.summary}</p>
          <b aria-hidden="true">↗</b>
        </Link>
      ))}
    </div>
  )
}

export function ArticleCards({ insights }: { insights: Omit<Insight, 'sections'>[] }) {
  return (
    <div className="article-grid">
      {insights.map((a, i) => (
        <Link key={a.slug} className="article-card" to={`/insights/${a.slug}`}>
          <div className={`article-art art-${i % 3}`} aria-hidden="true">
            <span>{a.teaser_art}</span>
          </div>
          <small>
            {a.category} · {a.read_minutes} min read
          </small>
          <h3>{a.title}</h3>
          <p>{a.intro}</p>
          <span className="card-link">Read article ↗</span>
        </Link>
      ))}
    </div>
  )
}

const steps = [
  ['Discover', 'Understand your users, map the challenge and agree on priorities.'],
  ['Design', 'Explore the experience with clear flows and interactive prototypes.'],
  ['Develop', 'Build in focused stages with visible progress and regular feedback.'],
  ['Test & launch', 'Check the experience, prepare the release and document the essentials.'],
  ['Support & evolve', 'Maintain your product and plan the next improvements together.'],
]

export function ProcessGrid() {
  return (
    <div className="process-grid">
      {steps.map(([title, body], i) => (
        <article key={title}>
          <span className="step-number">{pad(i + 1)}</span>
          <h3>{title}</h3>
          <p>{body}</p>
        </article>
      ))}
    </div>
  )
}

/** Numbered tiles without body text: service features and deliverables. */
export function NumberedTiles({ className, items }: { className: string; items: string[] }) {
  return (
    <div className={className}>
      {items.map((title, i) => (
        <article key={title}>
          <span>{pad(i + 1)}</span>
          <h3>{title}</h3>
        </article>
      ))}
    </div>
  )
}
