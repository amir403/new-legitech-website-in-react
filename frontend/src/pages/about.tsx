import { ProcessGrid } from '@/components/blocks'

const values = [
  ['Understand first', 'We ask questions and make space for the context behind a brief.'],
  ['Make it clear', 'We explain trade-offs and keep decisions connected to your goals.'],
  ['Work together', 'Design, engineering and your team stay part of the same conversation.'],
  ['Keep improving', 'We treat feedback as part of the work, from the first prototype onward.'],
]

export default function About() {
  return (
    <>
      <title>About | LegiTech.io</title>
      <meta name="description" content="Strategy, design and engineering brought together to turn ambitious ideas into useful digital products." />
      <section className="page-hero section">
        <p className="eyebrow">ABOUT LEGITECH.IO</p>
        <h1>
          Thoughtful people.
          <br />
          <span>Purposeful technology.</span>
        </h1>
        <p className="intro">We bring strategy, design and engineering together to help businesses turn ambitious ideas into useful digital products.</p>
      </section>
      <section className="section expertise about-statement">
        <p className="eyebrow">OUR POINT OF VIEW</p>
        <h2>
          Technology is the tool.
          <br />
          People are the point.
        </h2>
        <div className="two-col">
          <p>
            Every product starts with people: the team building a business, the customer trying to get something done and the colleagues keeping everything moving. We
            design around those needs.
          </p>
          <p>
            Our work spans websites, mobile applications, custom platforms and business automation. The common thread is clarity: making complicated things easier to
            understand and use.
          </p>
        </div>
      </section>
      <section className="section">
        <p className="eyebrow">HOW WE SHOW UP</p>
        <h2>
          Curious by nature.
          <br />
          Careful by design.
        </h2>
        <div className="values-grid">
          {values.map(([title, body]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section process-section">
        <h2>
          One team.
          <br />A connected process.
        </h2>
        <ProcessGrid />
      </section>
    </>
  )
}
