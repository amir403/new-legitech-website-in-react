import { Link, useLoaderData } from 'react-router'
import { IndustryGrid } from '@/components/blocks'
import { get, type Industry } from '@/lib/api'

export const loader = ({ request }: { request: Request }) => get<Industry[]>('/industries', request.signal)

export default function Industries() {
  const industries = useLoaderData<typeof loader>()
  return (
    <>
      <title>Industries | LegiTech.io</title>
      <meta name="description" content="Software shaped around your users, workflows and operational needs." />
      <section className="page-hero section">
        <p className="eyebrow">INDUSTRIES</p>
        <h1>
          Your world.
          <br />
          <span>Better connected.</span>
        </h1>
        <p className="intro">We shape software around your users, workflows and operational needs. Explore where our services can help.</p>
      </section>
      <section className="section expertise">
        <IndustryGrid industries={industries} />
      </section>
      <section className="section detail-intro">
        <p className="eyebrow">A DIFFERENT SECTOR?</p>
        <div>
          <h2>Start with the challenge.</h2>
          <p className="large-copy">
            You do not need to fit a category. Tell us what your team needs to do, where the friction is and what a better experience would look like.
          </p>
          <Link className="under-link" to="/contact">
            Discuss your project ↗
          </Link>
        </div>
      </section>
    </>
  )
}
