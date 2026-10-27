import { Link, useLoaderData } from 'react-router'
import { ProjectVisual } from '@/components/blocks'
import { get, type WorkConcept } from '@/lib/api'

export const loader = ({ request }: { request: Request }) => get<WorkConcept[]>('/work-concepts', request.signal)

export default function Work() {
  const concepts = useLoaderData<typeof loader>()
  return (
    <>
      <title>Our work | LegiTech.io</title>
      <meta name="description" content="Illustrative product concepts showing how thoughtful design can bring a software idea to life." />
      <section className="page-hero section">
        <p className="eyebrow">OUR WORK / SOLUTION CONCEPTS</p>
        <h1>
          Ideas made
          <br />
          <span>tangible.</span>
        </h1>
        <p className="intro">Explore illustrative product concepts. These are design examples, not completed client projects or performance claims.</p>
      </section>
      {concepts.map((c) => (
        <section key={c.slug} id={c.slug} className="section concept-section">
          <div className="concept-copy">
            <p className="eyebrow">ILLUSTRATIVE CONCEPT / {c.tags}</p>
            <h2>{c.title}</h2>
            <p>{c.summary}</p>
            <h3>The opportunity</h3>
            <p>{c.opportunity}</p>
            <h3>What a real build could include</h3>
            <ul>
              {c.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link className="under-link" to="/contact">
              Discuss a similar idea ↗
            </Link>
          </div>
          <ProjectVisual concept={c} />
        </section>
      ))}
    </>
  )
}
