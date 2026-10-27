import { Check, X } from 'lucide-react'
import { Link, useLoaderData } from 'react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { get, type Bundle, type Package, type PricedItem, type Pricing as PricingData } from '@/lib/api'

/** One request for every tab, so switching categories never refetches. */
export const loader = ({ request }: { request: Request }) => get<PricingData>('/pricing', request.signal)

export const pricingNote = 'Prices are indicative. Your final quote depends on the scope of your project.'

/** Contact form service to pre-select for each category. The form ignores a value that isn't one of its options. */
const contactService: Record<string, string> = { website: 'Website & web app development', 'e-commerce': 'E-commerce development' }

const contactLink = (item: string, price: string, category?: string) =>
  `/contact?${new URLSearchParams({ ...(category && contactService[category] ? { service: contactService[category] } : {}), interest: `${item} (${price})` })}`

const mid = (p: PricedItem) => (p.min_price + p.max_price) / 2

export function PriceRange({ display, suffix }: { display: string | null; suffix?: string }) {
  if (!display) return null
  return (
    <span className="price-range">
      {display}
      {suffix && <small> {suffix}</small>}
    </span>
  )
}

/** Values starting with ✅ / ❌ render as icons with a text label for screen readers; any text after the mark is kept. */
export function FeatureIcon({ value }: { value: string }) {
  const included = value.startsWith('✅')
  if (!included && !value.startsWith('❌')) return <>{value}</>
  const rest = value.slice(1).trim()
  const Icon = included ? Check : X
  return (
    <span className={included ? 'feature-yes' : 'feature-no'}>
      <Icon aria-hidden="true" size={18} strokeWidth={3} />
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

function PackageCard({ pkg, category }: { pkg: Package; category: string }) {
  const recommended = pkg.tier === 'standard'
  return (
    <article className={recommended ? 'package-card is-recommended' : 'package-card'}>
      <div className="package-top">
        <h3>{pkg.name}</h3>
        {recommended && <span className="badge">Recommended</span>}
      </div>
      <PriceRange display={pkg.price_display} />
      {pkg.description && <p>{pkg.description}</p>}
      <ul className="package-facts">
        <li>Delivery: {pkg.delivery_time}</li>
        <li>{pkg.revisions} revisions</li>
        <li>{pkg.support_period} support</li>
      </ul>
      <Link className={recommended ? 'pill' : 'outline-button'} to={contactLink(`${pkg.name} package`, pkg.price_display, category)} aria-label={`Get started with the ${pkg.name} package`}>
        Get started <span aria-hidden="true">↗</span>
      </Link>
    </article>
  )
}

function PackageComparisonTable({ packages, categoryName }: { packages: Package[]; categoryName: string }) {
  const comparison = rows(packages)
  return (
    <>
      <div className="comparison-scroll">
        <table className="comparison-table">
          <caption className="sr-only">{categoryName} packages compared</caption>
          <thead>
            <tr>
              <th scope="col">Feature</th>
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
      {/* Phones: one stacked list per package instead of a wide table. */}
      <div className="comparison-stack">
        {packages.map((p, i) => (
          <section key={p.id} className={p.tier === 'standard' ? 'package-card is-recommended' : 'package-card'} aria-label={`${p.name} package details`}>
            <h3>
              {p.name} <PriceRange display={p.price_display} />
            </h3>
            <dl>
              {comparison.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>
                    <FeatureIcon value={row.values[i]} />
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </>
  )
}

function AddonsSection({ addons }: { addons: PricedItem[] }) {
  if (!addons.length) return null
  return (
    <div className="pricing-block">
      <h2 className="pricing-subhead">Add-ons</h2>
      <div className="addon-grid">
        {addons.map((a) => (
          <article key={a.id} className="addon-card">
            <h3>{a.name}</h3>
            {a.description && <p>{a.description}</p>}
            <PriceRange display={a.price_display} />
          </article>
        ))}
      </div>
    </div>
  )
}

function BundleCard({ bundle }: { bundle: Bundle }) {
  const parts: PricedItem[] = [...(bundle.package ? [bundle.package] : []), ...bundle.addons]
  // Display only: what the parts cost separately (midpoints) minus the bundle's midpoint. Hidden when it isn't a saving.
  const savings = Math.round(parts.reduce((sum, p) => sum + mid(p), 0) - mid(bundle))
  return (
    <article className="bundle-card">
      <div className="package-top">
        <h3>{bundle.name}</h3>
        {savings > 0 && <span className="badge">Save about £{savings.toLocaleString('en-GB')}</span>}
      </div>
      {bundle.description && <p>{bundle.description}</p>}
      <ul>
        {parts.map((p) => (
          <li key={`${'tier' in p ? 'package' : 'addon'}-${p.id}`}>{'tier' in p ? `${p.name} package` : p.name}</li>
        ))}
      </ul>
      <PriceRange display={bundle.price_display} />
      <Link className="pill" to={contactLink(bundle.name, bundle.price_display, bundle.category ?? undefined)} aria-label={`Get started with the ${bundle.name}`}>
        Get started <span aria-hidden="true">↗</span>
      </Link>
    </article>
  )
}

export default function Pricing() {
  const { categories, general_addons, bundles } = useLoaderData<typeof loader>()
  return (
    <>
      <title>Pricing | LegiTech.io</title>
      <meta name="description" content="Website and Shopify e-commerce packages in GBP, with add-ons and brand bundles. Indicative price ranges for every package." />
      <section className="page-hero section">
        <p className="eyebrow">PRICING</p>
        <h1>
          Clear packages.
          <br />
          <span>No surprises.</span>
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
              const categoryBundles = bundles.filter((b) => b.category === null || b.category === c.slug)
              return (
                <TabsContent key={c.slug} value={c.slug}>
                  <div className="package-grid">
                    {c.packages.map((p) => (
                      <PackageCard key={p.id} pkg={p} category={c.slug} />
                    ))}
                  </div>
                  {c.packages.length > 0 && (
                    <div className="pricing-block">
                      <h2 className="pricing-subhead">Compare packages</h2>
                      <PackageComparisonTable packages={c.packages} categoryName={c.name} />
                    </div>
                  )}
                  <AddonsSection addons={[...c.addons, ...general_addons]} />
                  {categoryBundles.length > 0 && (
                    <div className="pricing-block">
                      <h2 className="pricing-subhead">Bundles</h2>
                      <div className="bundle-grid">
                        {categoryBundles.map((b) => (
                          <BundleCard key={b.id} bundle={b} />
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              )
            })}
          </Tabs>
        )}
        <p className="pricing-note">{pricingNote}</p>
      </section>
    </>
  )
}
