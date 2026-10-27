/** Field definitions for each content type. Must match the rules in backend/app/Http/Controllers/Admin/ContentController.php. */
export type Field =
  | { name: string; label: string; kind: 'text' | 'textarea' | 'number' | 'switch' | 'datetime'; help?: string; optional?: boolean }
  | { name: string; label: string; kind: 'list'; help?: string } // string[] edited one item per line
  | { name: 'sections'; label: string; kind: 'sections' } // {heading, body}[]
  | { name: string; label: string; kind: 'service' | 'services'; help?: string } // one / many service slugs

export type ContentType = { key: string; label: string; singular: string; title: string; fields: Field[]; empty: Record<string, unknown> }

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
]

export const findType = (key: string | undefined) => contentTypes.find((t) => t.key === key)
