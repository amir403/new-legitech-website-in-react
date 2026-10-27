import { Link, useLoaderData, type LoaderFunctionArgs } from 'react-router'
import { lines, NumberedTiles } from '@/components/blocks'
import { get, type Service } from '@/lib/api'

export const loader = ({ params, request }: LoaderFunctionArgs) => get<Service>(`/services/${params.slug}`, request.signal)

export default function ServiceDetail() {
  const s = useLoaderData<typeof loader>()
  return (
    <>
      <title>{`${s.name} | LegiTech.io`}</title>
      <meta name="description" content={s.summary} />
      <section className="page-hero section">
        <p className="eyebrow">SERVICE / {s.number}</p>
        <h1>{s.hero_title}</h1>
        <p className="intro">{s.summary}</p>
      </section>
      <section className="section detail-intro">
        <p className="eyebrow">{s.name}</p>
        <div>
          <h2>{lines(s.heading)}</h2>
          <p className="large-copy">{s.body}</p>
        </div>
      </section>
      <section className="section expertise">
        <div className="section-heading">
          <p className="eyebrow">WHAT WE CAN BUILD</p>
          <div>
            <h2>The possibilities.</h2>
            <p>Scope and features are tailored to your priorities.</p>
          </div>
        </div>
        <NumberedTiles className="feature-grid" items={s.features} />
      </section>
      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">WHAT TO EXPECT</p>
          <div>
            <h2>
              A clear route
              <br />
              to delivery.
            </h2>
            <p>Deliverables are agreed at the start of each engagement.</p>
          </div>
        </div>
        <NumberedTiles className="deliverables" items={s.deliverables} />
      </section>
      {s.related.length > 0 && (
        <section className="section related">
          <h2>Keep exploring.</h2>
          <div className="related-links">
            {s.related.map((r) => (
              <Link key={r.slug} to={`/services/${r.slug}`}>
                {r.name} ↗
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
