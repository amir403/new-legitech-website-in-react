import { Link } from 'react-router'
import { Logo, navLinks } from '@/components/site-header'

const footerServices = [
  { to: '/services/custom-software', label: 'Custom software development' },
  { to: '/services/web-development', label: 'Website & web app development' },
  { to: '/services/mobile-apps', label: 'Mobile app development' },
  { to: '/services/saas-products', label: 'SaaS product development' },
]

/** The lime "Have something in mind?" band shown above the footer on most pages. */
export function ContactBand() {
  return (
    <section className="contact section">
      <div>
        <p className="eyebrow">HAVE SOMETHING IN MIND?</p>
        <h2>
          Let’s make
          <br />
          your next move.
        </h2>
      </div>
      <Link className="round-cta" to="/contact" aria-label="Start a project enquiry">
        ↗
      </Link>
      <div className="contact-bottom">
        <p>Big ambition. Clear direction. Let’s start there.</p>
        <Link to="/contact">Start a conversation ↗</Link>
      </div>
    </section>
  )
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div>
          <Link to="/" aria-label="LegiTech.io home">
            <Logo />
          </Link>
          <p>
            Clear thinking.
            <br />
            Exceptional software.
          </p>
        </div>
        <div>
          <h3>Explore</h3>
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to}>
              {l.label}
            </Link>
          ))}
        </div>
        <div>
          <h3>What we do</h3>
          {footerServices.map((l) => (
            <Link key={l.to} to={l.to}>
              {l.label}
            </Link>
          ))}
        </div>
        <div>
          <h3>Let’s build something.</h3>
          <p>
            Your next idea starts
            <br />
            with a conversation.
          </p>
          <Link className="footer-cta" to="/contact">
            Start a project ↗
          </Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} LegiTech.io</span>
        <div>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Website terms</Link>
        </div>
        <a href="#top">Back to top ↑</a>
      </div>
    </footer>
  )
}
