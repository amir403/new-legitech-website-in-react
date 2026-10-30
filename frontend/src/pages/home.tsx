import { Link, useLoaderData } from 'react-router'
import { ArticleCards, IndustryGrid, ProcessGrid, ProjectCards, ServiceCards } from '@/components/blocks'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { get, type Industry, type Insight, type Pricing, type Service, type WorkConcept } from '@/lib/api'

export async function loader({ request }: { request: Request }) {
  const [services, concepts, industries, insights, pricing] = await Promise.all([
    get<Service[]>('/services', request.signal),
    get<WorkConcept[]>('/work-concepts', request.signal),
    get<Industry[]>('/industries', request.signal),
    get<Insight[]>('/insights', request.signal),
    // Optional: the home page still renders without the pricing band.
    get<Pricing>('/pricing', request.signal).catch(() => null),
  ])
  const startingPrices = (pricing?.categories ?? [])
    .filter((c) => c.packages.length)
    .map((c) => ({ slug: c.slug, name: c.name, from: Math.min(...c.packages.map((p) => p.min_price)) }))
  return { services, concepts, industries, insights: insights.slice(0, 3), startingPrices }
}

const principles = [
  ['Your goals come first.', 'We connect design and development decisions to the problem you need to solve.'],
  ['Progress you can see.', 'Shared milestones and regular feedback keep the work understandable.'],
  ['The details matter.', 'Usability, performance and maintainability belong in the conversation from the start.'],
  ['Built for what comes next.', 'A focused first release, with a foundation for future improvements.'],
]

const stack = ['Web & frontend', 'Mobile platforms', 'Backend & APIs', 'Cloud infrastructure', 'Data & integrations', 'AI & automation']

const faqs = [
  ['How much does a project cost?', 'Cost depends on the scope, complexity, integrations and level of design required. We start by understanding your priorities, then agree on a scope and estimate before development begins.'],
  ['How long will development take?', 'A focused website and a custom software platform have very different timelines. Discovery helps define a realistic schedule, milestones and what can be delivered in the first release.'],
  ['Can you improve an existing website or application?', 'Yes. We can review an existing product, identify its constraints and plan targeted design, performance, integration or feature improvements.'],
  ['Who owns the source code?', 'Ownership, licences and handover deliverables are agreed in the project contract before work starts. Third-party tools and open-source components may have their own licence terms.'],
  ['Do you provide support after launch?', 'Yes. Maintenance, updates and further development can be arranged. The support scope, response expectations and costs are agreed for each engagement.'],
  ['Can we start with a smaller first version?', 'Yes. An MVP focuses on the essential user journey, so you can launch a useful first version and use feedback to decide what comes next.'],
]

export default function Home() {
  const { services, concepts, industries, insights, startingPrices } = useLoaderData<typeof loader>()
  return (
    <>
      <title>LegiTech.io | Complexity. Made simple.</title>
      <meta name="description" content="We turn ambitious ideas into websites, apps and software that move your business forward." />
      <section className="hero">
        <div className="hero-top">
          <p className="eyebrow">
            <span className="tiny-cross">✳</span> STRATEGY. DESIGN. DEVELOPMENT.
          </p>
          <p className="edition">
            GOOD IDEAS DESERVE
            <br />
            EXCEPTIONAL SOFTWARE.
          </p>
        </div>
        <div className="hero-content">
          <div className="hero-copy">
            <h1>
              Complexity.
              <br />
              <span>Made simple.</span>
            </h1>
            <p className="intro">
              We turn ambitious ideas into websites, apps and software that move your business forward. Thoughtfully designed. Built around you.
            </p>
            <div className="hero-actions">
              <Button asChild className="pill">
                <Link to="/contact">
                  Start your project <span>↗</span>
                </Link>
              </Button>
              <Link className="under-link" to="/services">
                Explore our services
              </Link>
            </div>
          </div>
          <div className="hero-art">
            <img src="/hero-sculpture.png" alt="" width={1024} height={1024} fetchPriority="high" />
            <span>
              CONNECTED THINKING.
              <br />
              CONSIDERED ENGINEERING.
            </span>
          </div>
        </div>
        <div className="hero-bottom">
          <span>YOUR VISION. OUR NEXT CHALLENGE.</span>
          <a href="#expertise">SCROLL TO EXPLORE ↓</a>
        </div>
      </section>

      <div className="discipline">
        <span>Think clearly.</span>
        <b>✳</b>
        <span>Design thoughtfully.</span>
        <b>✳</b>
        <span>Build beautifully.</span>
        <b>✳</b>
        <span>Keep evolving.</span>
      </div>

      <section className="section expertise" id="expertise">
        <div className="section-heading">
          <p className="eyebrow">01 / WHAT WE DO</p>
          <div>
            <h2>
              One partner.
              <br />
              Every possibility.
            </h2>
            <p>Eight connected services. From your first idea to the systems that power your business.</p>
          </div>
        </div>
        <ServiceCards services={services} />
        {startingPrices.length > 0 && (
          <div className="pricing-teaser">
            <div>
              <h3>Clear pricing, before we start.</h3>
              <p>Fixed-scope packages with indicative price ranges in GBP.</p>
              <Link className="under-link" to="/pricing">
                See all pricing <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <ul>
              {startingPrices.map((c) => (
                <li key={c.slug}>
                  <Link to="/pricing">
                    <span>{c.name} packages</span>
                    <b>from £{c.from.toLocaleString('en-GB')}</b>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">02 / POSSIBILITIES IN PRACTICE</p>
          <div>
            <h2>
              See what
              <br />
              takes shape.
            </h2>
            <p>Illustrative product concepts showing how thoughtful design can bring a software idea to life.</p>
          </div>
        </div>
        <ProjectCards concepts={concepts} />
      </section>

      <section className="section why-section">
        <div>
          <p className="eyebrow">03 / WHY LEGITECH.IO</p>
          <h2>
            A clear path.
            <br />
            A close partnership.
          </h2>
          <p className="intro">Good software comes from understanding your business as well as the technology.</p>
          <Link className="under-link" to="/about">
            Get to know us ↗
          </Link>
        </div>
        <div className="principles">
          {principles.map(([title, body], i) => (
            <article key={title}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section process-section">
        <div className="section-heading">
          <p className="eyebrow">04 / HOW WE WORK</p>
          <div>
            <h2>
              From first thought.
              <br />
              To next chapter.
            </h2>
            <p>A connected process, with you involved at every important decision.</p>
          </div>
        </div>
        <ProcessGrid />
      </section>

      <section className="section expertise">
        <div className="section-heading">
          <p className="eyebrow">05 / BUILT AROUND YOUR WORLD</p>
          <div>
            <h2>
              Different industries.
              <br />
              Shared ambition.
            </h2>
            <p>Solutions shaped around the way your organisation actually works.</p>
          </div>
        </div>
        <IndustryGrid industries={industries} />
      </section>

      <section className="section stack-section">
        <p className="eyebrow">06 / TECHNOLOGY WITH PURPOSE</p>
        <h2>
          The right tools.
          <br />
          <span>For the right reasons.</span>
        </h2>
        <p className="intro">
          Your requirements guide the stack. We consider the experience, integrations and long-term maintenance before choosing the technology.
        </p>
        <div className="stack-list">
          {stack.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      </section>

      <section className="section insights-section">
        <div className="section-heading">
          <p className="eyebrow">07 / IDEAS & INSIGHTS</p>
          <div>
            <h2>
              A little perspective.
              <br />
              A better next step.
            </h2>
            <Link className="under-link" to="/insights">
              Explore all insights ↗
            </Link>
          </div>
        </div>
        <ArticleCards insights={insights} />
      </section>

      <section className="section faq-section">
        <div>
          <p className="eyebrow">08 / A FEW GOOD QUESTIONS</p>
          <h2>
            Before
            <br />
            we begin.
          </h2>
          <p>
            Have a different question?
            <br />
            <Link className="under-link" to="/contact">
              Let’s talk ↗
            </Link>
          </p>
        </div>
        <Accordion type="multiple" className="faqs">
          {faqs.map(([q, a]) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger>
                {q}
                <span aria-hidden="true">+</span>
              </AccordionTrigger>
              <AccordionContent>
                <p>{a}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </>
  )
}
