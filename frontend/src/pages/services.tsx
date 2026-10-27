import { useLoaderData } from 'react-router'
import { ProcessGrid, ServiceCards } from '@/components/blocks'
import { get, type Service } from '@/lib/api'

export const loader = ({ request }: { request: Request }) => get<Service[]>('/services', request.signal)

export default function Services() {
  const services = useLoaderData<typeof loader>()
  return (
    <>
      <title>Services | LegiTech.io</title>
      <meta name="description" content="Custom software, websites, mobile apps, SaaS, design, automation, e-commerce and cloud support." />
      <section className="page-hero section">
        <p className="eyebrow">OUR EXPERTISE</p>
        <h1>
          Everything your
          <br />
          <span>next idea needs.</span>
        </h1>
        <p className="intro">From a single website to a connected software platform, we bring the right skills together around your goals.</p>
      </section>
      <section className="section expertise">
        <ServiceCards services={services} />
      </section>
      <section className="section">
        <p className="eyebrow">ONE CONNECTED PROCESS</p>
        <h2>
          Start where you are.
          <br />
          Build what comes next.
        </h2>
        <ProcessGrid />
      </section>
    </>
  )
}
