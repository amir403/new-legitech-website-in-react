import { Link, useLoaderData, type LoaderFunctionArgs } from 'react-router'
import { lines } from '@/components/blocks'
import { get, type Insight } from '@/lib/api'

export const loader = ({ params, request }: LoaderFunctionArgs) => get<Insight>(`/insights/${params.slug}`, request.signal)

export default function InsightDetail() {
  const a = useLoaderData<typeof loader>()
  return (
    <>
      <title>{`${a.title} | LegiTech.io`}</title>
      <meta name="description" content={a.intro} />
      <section className="page-hero section">
        <p className="eyebrow">
          {a.category} / {a.read_minutes} MIN READ
        </p>
        <h1>{a.title}</h1>
        <p className="intro">{a.intro}</p>
      </section>
      <div className="article-layout section">
        <aside>
          <p className="eyebrow">IN THIS ARTICLE</p>
          {a.sections.map((s, i) => (
            <a key={i} href={`#section-${i}`}>
              {s.heading}
            </a>
          ))}
        </aside>
        <article className="prose">
          {a.sections.map((s, i) => (
            <section key={i} id={`section-${i}`}>
              <h2>{s.heading}</h2>
              <p>{lines(s.body)}</p>
            </section>
          ))}
          <Link className="under-link" to="/insights">
            ← All insights
          </Link>
        </article>
      </div>
    </>
  )
}
