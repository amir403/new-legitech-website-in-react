import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Shared layout pieces ported from legacy-static/style.css (.eyebrow, .page-hero, .section, .section-heading). */

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-[1540px] px-[clamp(18px,4vw,64px)]', className)}>{children}</div>
}

export function Eyebrow({ className, children }: { className?: string; children: ReactNode }) {
  return <p className={cn('mb-5 text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase', className)}>{children}</p>
}

export function Section({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={cn('scroll-mt-24 py-[clamp(72px,10vw,138px)]', className)}>
      <Container>{children}</Container>
    </section>
  )
}

export function PageHero({ eyebrow, title, intro }: { eyebrow: string; title: ReactNode; intro: string }) {
  return (
    <Section className="pb-[clamp(40px,6vw,80px)]">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="mb-7 max-w-[1100px] text-[clamp(2.65rem,8vw,8.6rem)] leading-[0.92] font-extrabold tracking-tight [&_span]:text-lime">
        {title}
      </h1>
      <p className="max-w-[760px] text-lg text-muted-foreground md:text-xl">{intro}</p>
    </Section>
  )
}

export function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-12 grid gap-6 lg:grid-cols-[minmax(180px,1fr)_3fr]">
      <Eyebrow className="pt-3">{eyebrow}</Eyebrow>
      <div>
        <h2 className="mb-5 text-[clamp(2.1rem,4.2vw,4.2rem)] leading-[0.95] font-extrabold tracking-tight">{title}</h2>
        {children && <div className="max-w-[640px] text-muted-foreground">{children}</div>}
      </div>
    </div>
  )
}

/** Numbered tile used by features, deliverables, principles and process steps. */
export function NumberedGrid({ items, className }: { items: { title: string; body?: string }[]; className?: string }) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {items.map((item, i) => (
        <article key={item.title} className="rounded-lg border bg-card p-6">
          <span className="text-sm font-bold text-lime">{String(i + 1).padStart(2, '0')}</span>
          <h3 className="mt-8 text-xl leading-tight font-bold">{item.title}</h3>
          {item.body && <p className="mt-3 text-muted-foreground">{item.body}</p>}
        </article>
      ))}
    </div>
  )
}
