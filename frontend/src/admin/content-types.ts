/**
 * Field definitions for each content type. Must match the rules in backend/app/Http/Controllers/Admin/ContentController.php,
 * and for the pricing types the Form Requests in backend/app/Http/Requests/Admin/.
 */
export type Field =
  | { name: string; label: string; kind: 'text' | 'textarea' | 'number' | 'switch' | 'datetime' | 'money'; help?: string; optional?: boolean }
  | { name: string; label: string; kind: 'list'; help?: string } // string[] edited one item per line
  | { name: 'sections'; label: string; kind: 'sections' } // {heading, body}[]
  | { name: 'features'; label: string; kind: 'features'; help?: string } // {label, value}[]
  | { name: string; label: string; kind: 'service' | 'services'; help?: string } // one / many service slugs
  | { name: string; label: string; kind: 'select'; options: { value: string; label: string }[]; help?: string }
  | { name: string; label: string; kind: 'category' | 'package'; optional?: boolean; help?: string } // pricing category / package id
  | { name: 'addon_ids'; label: string; kind: 'addons'; help?: string } // add-on ids

export type ContentType = {
  key: string
  label: string
  singular: string
  title: string
  fields: Field[]
  empty: Record<string, unknown>
  /** Admin API path when it differs from `/${key}`. */
  api?: string
  /** Pricing rows have no slug. */
  slug?: false
  group?: 'pricing'
  /** Second list column; defaults to the slug. */
  meta?: (row: Record<string, unknown>) => string
}

const gbp = (n: unknown) => `£${Number(n).toLocaleString('en-GB', { maximumFractionDigits: 2 })}`
const priceMeta = (row: Record<string, unknown>) =>
  `${(row.category as { name: string } | null)?.name ?? 'All categories'} · ${gbp(row.min_price)} – ${gbp(row.max_price)}`

const pricing: Pick<ContentType, 'slug' | 'group' | 'meta'> = { slug: false, group: 'pricing', meta: priceMeta }

const priced: Field[] = [
  { name: 'min_price', label: 'Price from (£)', kind: 'money' },
  { name: 'max_price', label: 'Price to (£)', kind: 'money', help: 'Shown as “£from – £to”. Must not be lower than the from price.' },
]

const active: Field[] = [
  { name: 'sort_order', label: 'Order', kind: 'number', help: 'Lower numbers show first. Must be unique within the category.' },
  { name: 'is_active', label: 'Shown on the pricing page', kind: 'switch' },
]

const publish: Field[] = [
  { name: 'sort_order', label: 'Order', kind: 'number', help: 'Lower numbers show first. On services this is also the card number.' },
  { name: 'is_published', label: 'Published', kind: 'switch' },
]

export const contentTypes: ContentType[] = [
  {
    key: 'services',
    label: 'Services',
    singular: 'service',
    title: 'name',
    fields: [
      { name: 'name', label: 'Name', kind: 'text' },
      { name: 'icon', label: 'Icon', kind: 'text', help: 'One symbol, e.g. ⌘' },
      { name: 'summary', label: 'Summary', kind: 'textarea', help: 'Shown on cards and under the page title.' },
      { name: 'hero_title', label: 'Page title', kind: 'text' },
      { name: 'heading', label: 'Intro heading', kind: 'textarea', help: 'Line breaks are kept.' },
      { name: 'body', label: 'Intro text', kind: 'textarea' },
      { name: 'features', label: 'What we can build', kind: 'list', help: 'One per line.' },
      { name: 'deliverables', label: 'What to expect', kind: 'list', help: 'One per line.' },
      { name: 'related_slugs', label: 'Keep exploring', kind: 'services', help: 'Up to 4 related services.' },
      ...publish,
    ],
    empty: { icon: '', name: '', summary: '', hero_title: '', heading: '', body: '', features: [], deliverables: [], related_slugs: [], sort_order: 0, is_published: false },
  },
  {
    key: 'insights',
    label: 'Insights',
    singular: 'insight',
    title: 'title',
    fields: [
      { name: 'title', label: 'Title', kind: 'text' },
      { name: 'category', label: 'Category', kind: 'text' },
      { name: 'read_minutes', label: 'Read time (minutes)', kind: 'number' },
      { name: 'intro', label: 'Intro', kind: 'textarea' },
      { name: 'teaser_art', label: 'Card art text', kind: 'text', optional: true, help: 'Short text on the card, e.g. 01 → 02' },
      { name: 'sections', label: 'Sections', kind: 'sections' },
      { name: 'published_at', label: 'Publish date', kind: 'datetime', optional: true, help: 'Empty = draft. A future date schedules it.' },
    ],
    empty: { title: '', category: '', read_minutes: 4, intro: '', teaser_art: '', sections: [{ heading: '', body: '' }], published_at: null },
  },
  {
    key: 'work-concepts',
    label: 'Work concepts',
    singular: 'work concept',
    title: 'name',
    fields: [
      { name: 'name', label: 'Name', kind: 'text' },
      { name: 'tags', label: 'Tags', kind: 'text', help: 'e.g. Custom software / Workflow design' },
      { name: 'title', label: 'Headline', kind: 'text' },
      { name: 'summary', label: 'Summary', kind: 'textarea' },
      { name: 'opportunity', label: 'The opportunity', kind: 'textarea' },
      { name: 'includes', label: 'What a real build could include', kind: 'list', help: 'One per line.' },
      ...publish,
    ],
    empty: { name: '', tags: '', title: '', summary: '', opportunity: '', includes: [], sort_order: 0, is_published: false },
  },
  {
    key: 'industries',
    label: 'Industries',
    singular: 'industry',
    title: 'name',
    fields: [
      { name: 'name', label: 'Name', kind: 'text' },
      { name: 'summary', label: 'Summary', kind: 'textarea' },
      { name: 'service_slug', label: 'Links to service', kind: 'service', help: 'Empty = links to the contact page.' },
      ...publish,
    ],
    empty: { name: '', summary: '', service_slug: null, sort_order: 0, is_published: false },
  },
  {
    key: 'pricing-packages',
    api: '/pricing/packages',
    label: 'Packages',
    singular: 'package',
    title: 'name',
    ...pricing,
    fields: [
      { name: 'pricing_category_id', label: 'Category', kind: 'category' },
      { name: 'name', label: 'Name', kind: 'text' },
      {
        name: 'tier',
        label: 'Tier',
        kind: 'select',
        help: 'The Standard tier is highlighted as recommended.',
        options: [
          { value: 'starter', label: 'Starter' },
          { value: 'standard', label: 'Standard' },
          { value: 'premium', label: 'Premium' },
        ],
      },
      { name: 'description', label: 'Short description', kind: 'textarea', optional: true },
      ...priced,
      { name: 'delivery_time', label: 'Delivery time', kind: 'text', help: 'e.g. 3 – 4 weeks' },
      { name: 'revisions', label: 'Revisions', kind: 'text' },
      { name: 'support_period', label: 'Support after launch', kind: 'text', help: 'e.g. 2 months' },
      { name: 'monthly_maintenance_min', label: 'Monthly maintenance from (£)', kind: 'money', optional: true },
      { name: 'monthly_maintenance_max', label: 'Monthly maintenance to (£)', kind: 'money', optional: true, help: 'Leave empty to show “£from+”.' },
      { name: 'features', label: 'Comparison rows', kind: 'features', help: 'Use the same row labels, in the same order, for every package in a category. Start a value with ✅ or ❌ to show a tick or a dash.' },
      ...active,
    ],
    empty: {
      pricing_category_id: null, name: '', tier: 'starter', description: '', min_price: 0, max_price: 0, delivery_time: '', revisions: '', support_period: '',
      monthly_maintenance_min: null, monthly_maintenance_max: null, features: [{ label: '', value: '' }], sort_order: 0, is_active: false,
    },
  },
  {
    key: 'pricing-addons',
    api: '/pricing/addons',
    label: 'Add-ons',
    singular: 'add-on',
    title: 'name',
    ...pricing,
    fields: [
      { name: 'pricing_category_id', label: 'Category', kind: 'category', optional: true, help: 'Empty = shown in every category.' },
      { name: 'name', label: 'Name', kind: 'text' },
      { name: 'description', label: 'Note', kind: 'text', optional: true, help: 'e.g. Per page' },
      ...priced,
      ...active,
    ],
    empty: { pricing_category_id: null, name: '', description: '', min_price: 0, max_price: 0, sort_order: 0, is_active: false },
  },
  {
    key: 'pricing-bundles',
    api: '/pricing/bundles',
    label: 'Bundles',
    singular: 'bundle',
    title: 'name',
    ...pricing,
    fields: [
      { name: 'pricing_category_id', label: 'Category', kind: 'category', optional: true, help: 'Empty = shown in every category.' },
      { name: 'name', label: 'Name', kind: 'text' },
      { name: 'description', label: 'Short description', kind: 'textarea', optional: true },
      ...priced,
      { name: 'package_id', label: 'Includes package', kind: 'package', optional: true },
      { name: 'addon_ids', label: 'Includes add-ons', kind: 'addons', help: 'A “Save about £…” badge appears when the bundle costs less than these parts bought separately.' },
      ...active,
    ],
    empty: { pricing_category_id: null, package_id: null, name: '', description: '', min_price: 0, max_price: 0, addon_ids: [], sort_order: 0, is_active: false },
  },
]

export const apiPath = (type: ContentType) => type.api ?? `/${type.key}`

export const findType = (key: string | undefined) => contentTypes.find((t) => t.key === key)
