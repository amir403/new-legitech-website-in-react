import { useLoaderData } from 'react-router'
import { ArticleCards } from '@/components/blocks'
import { get, type Insight } from '@/lib/api'

export const loader = ({ request }: { request: Request }) => get<Insight[]>('/insights', request.signal)

export default function Insights() {
  const insights = useLoaderData<typeof loader>()
  return (
    <>
      <title>Insights | LegiTech.io</title>
      <meta name="description" content="Practical thinking for people planning a website, application or new digital product." />
      <section className="page-hero section">
        <p className="eyebrow">IDEAS & INSIGHTS</p>
        <h1>
          A clearer view.
          <br />
          <span>A smarter next step.</span>
        </h1>
        <p className="intro">Practical thinking for people planning a website, application or new digital product.</p>
      </section>
      <section className="section insights-section">
        <ArticleCards insights={insights} />
      </section>
    </>
  )
}
