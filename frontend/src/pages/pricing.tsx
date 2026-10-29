import { Check, Minus } from 'lucide-react'
import { Link, useLoaderData } from 'react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { get, type Bundle, type Package, type PricedItem, type Pricing as PricingData } from '@/lib/api'

/** One request for every tab, so switching categories never refetches. */
export const loader = ({ request }: { request: Request }) => get<PricingData>('/pricing', request.signal)

const pricingNote = 'Prices are indicative and in GBP. Your final quote depends on the scope of your project.'

/** Contact form service to pre-select for each category. The form ignores a value that isn't one of its options. */
const contactService: Record<string, string> = { website: 'Website & web app development', 'e-commerce': 'E-commerce development' }

const contactLink = (item: string, price: string, category?: string) =>
  `/contact?${new URLSearchParams({ ...(category && contactService[category] ? { service: contactService[category] } : {}), interest: `${item} (${price})` })}`

const mid = (p: PricedItem) => (p.min_price + p.max_price) / 2

function PriceRange({ display }: { display: string | null }) {
  return display ? <span className="price-range">{display}</span> : null
}

/** Values starting with ✅ / ❌ render as icons with a text label for screen readers; any text after the mark is kept. */
function FeatureIcon({ value }: { value: string }) {
  const included = value.startsWith('✅')
  if (!included && !value.startsWith('❌')) return <>{value}</>
  const rest = value.slice(1).trim()
  const Icon = included ? Check : Minus
  return (
    <span className={included ? 'feature-yes' : 'feature-no'}>
      <Icon aria-hidden="true" size={14} strokeWidth={3} />
      <span className={rest ? undefined : 'sr-only'}>{rest || (included ? 'Included' : 'Not included')}</span>
    </span>
  )
}

/** Comparison rows: the package's feature rows (same label order across a category), then the fixed package columns. */
function rows(packages: Package[]) {
  const labels = packages[0]?.features.map((f) => f.label) ?? []
  return [
    ...labels.map((label) => ({ label, values: packages.map((p) => p.features.find((f) => f.label === label)?.value ?? '—') })),
    { label: 'Support after launch', values: packages.map((p) => p.support_period) },
    { label: 'Delivery time', values: packages.map((p) => p.delivery_time) },
    { label: 'Revisions', values: packages.map((p) => p.revisions) },
    { label: 'Monthly maintenance', values: packages.map((p) => (p.monthly_maintenance_display ? `${p.monthly_maintenance_display} / month` : '—')) },
  ]
}

type Row = ReturnType<typeof rows>[number]

function PackageCard({ pkg, index, comparison, category }: { pkg: Package; index: number; comparison: Row[]; category: string }) {
  const recommended = pkg.tier === 'standard'
  return (
    <article className={recommended ? 'package-card is-recommended' : 'package-card'}>
      <div className="package-head">
        <h3>{pkg.name}</h3>
        {recommended && <span className="badge">Recommended</span>}
      </div>
      {pkg.description && <p className="package-desc">{pkg.description}</p>}
      <p className="package-price">
        <PriceRange display={pkg.price_display} />
        <span className="package-price-note">one-off, per project</span>
      </p>
      <dl className="package-meta">
        <div>
          <dt>Delivery</dt>
          <dd>{pkg.delivery_time}</dd>
        </div>
        <div>
          <dt>Revisions</dt>
          <dd>{pkg.revisions}</dd>
        </div>
        <div>
          <dt>Support</dt>
          <dd>{pkg.support_period}</dd>
        </div>
      </dl>
      {pkg.monthly_maintenance_display && <p className="package-maint">Maintenance: {pkg.monthly_maintenance_display} / month</p>}
      <Link className={recommended ? 'pill package-cta' : 'outline-button package-cta'} to={contactLink(`${pkg.name} package`, pkg.price_display, category)} aria-label={`Get started with the ${pkg.name} package`}>
        Get started <span aria-hidden="true">↗</span>
      </Link>
      {/* Phones get the full feature list here instead of the comparison table. */}
      <details className="package-details">
        <summary>Everything included</summary>
        <dl>
          {comparison.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>
                <FeatureIcon value={row.values[index]} />
              </dd>
            </div>
          ))}
        </dl>
      </details>
    </article>
  )
}

function PackageComparisonTable({ packages, comparison, categoryName }: { packages: Package[]; comparison: Row[]; categoryName: string }) {
  return (
    <div className="pricing-block comparison">
      <h2 className="pricing-subhead">Compare every detail</h2>
      <table className="comparison-table">
        <caption className="sr-only">{categoryName} packages compared</caption>
        <thead>
          <tr>
            <td />
            {packages.map((p) => (
              <th scope="col" key={p.id} className={p.tier === 'standard' ? 'is-recommended' : undefined}>
                {p.name}
                <PriceRange display={p.price_display} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparison.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              {row.values.map((v, i) => (
                <td key={packages[i].id} className={packages[i].tier === 'standard' ? 'is-recommended' : undefined}>
                  <FeatureIcon value={v} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AddonsSection({ addons }: { addons: PricedItem[] }) {
  if (!addons.length) return null
  return (
    <div className="pricing-block">
      <div className="pricing-block-head">
        <h2 className="pricing-subhead">Add-ons</h2>
        <p>Add any of these to a package, or order them on their own.</p>
      </div>
      <ul className="addon-list">
        {addons.map((a) => (
          <li key={a.id}>
            <div>
              <h3>{a.name}</h3>
              {a.description && <p>{a.description}</p>}
            </div>
            <PriceRange display={a.price_display} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function BundleCard({ bundle }: { bundle: Bundle }) {
  const parts: PricedItem[] = [...(bundle.package ? [bundle.package] : []), ...bundle.addons]
  // Display only: what the parts cost separately (midpoints) minus the bundle's midpoint. Hidden when it isn't a saving.
  const savings = Math.round(parts.reduce((sum, p) => sum + mid(p), 0) - mid(bundle))
  return (
    <article className="bundle-card">
      <div className="bundle-copy">
        <div className="package-head">
          <h3>{bundle.name}</h3>
          {savings > 0 && <span className="badge">Save about £{savings.toLocaleString('en-GB')}</span>}
        </div>
        {bundle.description && <p className="package-desc">{bundle.description}</p>}
        <ul className="bundle-parts" aria-label={`${bundle.name} includes`}>
          {parts.map((p) => (
            <li key={`${'tier' in p ? 'package' : 'addon'}-${p.id}`}>{'tier' in p ? `${p.name} package` : p.name}</li>
          ))}
        </ul>
      </div>
      <div className="bundle-buy">
        <PriceRange display={bundle.price_display} />
        <Link className="pill package-cta" to={contactLink(bundle.name, bundle.price_display, bundle.category ?? undefined)} aria-label={`Get started with the ${bundle.name}`}>
          Get started <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </article>
  )
}

export default function Pricing() {
  const { categories, general_addons, bundles } = useLoaderData<typeof loader>()
  return (
    <>
      <title>Pricing | LegiTech.io</title>
      <meta name="description" content="Website and Shopify e-commerce packages in GBP, with add-ons and brand bundles. Indicative price ranges for every package." />
      <section className="page-hero section pricing-hero">
        <h1>
          Clear packages.
          <br />
          <span>Honest ranges.</span>
        </h1>
        <p className="intro">Pick a starting point for your website or online store. Every project gets a fixed quote once we understand the scope.</p>
      </section>
      <section className="section pricing-section">
        {categories.length > 0 && (
          <Tabs defaultValue={categories[0].slug}>
            <TabsList className="pricing-tabs" aria-label="Package type">
              {categories.map((c) => (
                <TabsTrigger key={c.slug} value={c.slug}>
                  {c.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {categories.map((c) => {
              const comparison = rows(c.packages)
              const categoryBundles = bundles.filter((b) => b.category === null || b.category === c.slug)
              return (
                <TabsContent key={c.slug} value={c.slug}>
                  <div className="package-grid">
                    {c.packages.map((p, i) => (
                      <PackageCard key={p.id} pkg={p} index={i} comparison={comparison} category={c.slug} />
                    ))}
                  </div>
                  <p className="pricing-note">{pricingNote}</p>
                  {c.packages.length > 0 && <PackageComparisonTable packages={c.packages} comparison={comparison} categoryName={c.name} />}
                  {categoryBundles.length > 0 && (
                    <div className="pricing-block">
                      <div className="pricing-block-head">
                        <h2 className="pricing-subhead">Bundles</h2>
                        <p>Everything you need to launch, priced together.</p>
                      </div>
                      <div className="bundle-list">
                        {categoryBundles.map((b) => (
                          <BundleCard key={b.id} bundle={b} />
                        ))}
                      </div>
                    </div>
                  )}
                  <AddonsSection addons={[...c.addons, ...general_addons]} />
                </TabsContent>
              )
            })}
          </Tabs>
        )}
      </section>
    </>
  )
}
