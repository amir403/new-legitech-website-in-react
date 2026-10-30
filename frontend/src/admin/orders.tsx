import { Fragment, useState } from 'react'
import { Link, useLoaderData, useSearchParams, type LoaderFunctionArgs } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { gbp } from '@/lib/api'
import { adminFetch } from './api'

type Order = {
  id: number
  reference: string
  item_type: string
  item_name: string
  amount: string
  customer_name: string
  customer_email: string
  company: string | null
  notes: string | null
  status: keyof typeof STATUSES
  stripe_payment_intent: string | null
  paid_at: string | null
  created_at: string
}
type Page = { data: Order[]; current_page: number; last_page: number; total: number }

// Same keys as App\Models\Order::STATUSES.
const STATUSES = { pending: 'Awaiting payment', paid: 'Paid', failed: 'Failed', expired: 'Expired', refunded: 'Refunded' } as const
const ALL = 'all'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const qs = new URLSearchParams({ page: url.searchParams.get('page') ?? '1' })
  const status = url.searchParams.get('status')
  if (status) qs.set('status', status)
  return adminFetch<Page>('GET', `/orders?${qs}`)
}

/** Read-only: payments are changed in the Stripe Dashboard (refunds arrive here through the webhook). */
export function Orders() {
  const page = useLoaderData<typeof loader>()
  const [params, setParams] = useSearchParams()
  const [open, setOpen] = useState<number | null>(null)

  const pageLink = (n: number) => {
    const p = new URLSearchParams(params)
    p.set('page', String(n))
    return `?${p}`
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">
          Orders <span className="text-base font-normal text-muted-foreground">({page.total})</span>
        </h1>
        <Select value={params.get('status') ?? ALL} onValueChange={(s) => setParams(s === ALL ? {} : { status: s })}>
          <SelectTrigger className="w-44" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {Object.entries(STATUSES).map(([k, label]) => (
              <SelectItem key={k} value={k}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden md:table-cell">Item</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Created</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No orders yet.
                </TableCell>
              </TableRow>
            )}
            {page.data.map((o) => (
              <Fragment key={o.id}>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">{o.customer_name}</div>
                    <a href={`mailto:${o.customer_email}`} className="text-sm text-muted-foreground hover:underline">
                      {o.customer_email}
                    </a>
                  </TableCell>
                  <TableCell className="hidden max-w-56 truncate md:table-cell">{o.item_name}</TableCell>
                  <TableCell className="text-right tabular-nums">{gbp(Number(o.amount))}</TableCell>
                  <TableCell>
                    <Badge variant={o.status === 'paid' ? 'default' : o.status === 'pending' ? 'outline' : 'secondary'}>{STATUSES[o.status]}</Badge>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{new Date(o.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" aria-expanded={open === o.id} onClick={() => setOpen(open === o.id ? null : o.id)}>
                      {open === o.id ? 'Hide' : 'View'}
                    </Button>
                  </TableCell>
                </TableRow>
                {open === o.id && (
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableCell colSpan={6} className="whitespace-normal">
                      <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">
                        <dt className="text-muted-foreground">Reference</dt>
                        <dd className="font-mono">{o.reference}</dd>
                        <dt className="text-muted-foreground">Item</dt>
                        <dd>{o.item_name}</dd>
                        <dt className="text-muted-foreground">Company</dt>
                        <dd>{o.company || 'Not provided'}</dd>
                        <dt className="text-muted-foreground">Paid at</dt>
                        <dd>{o.paid_at ? new Date(o.paid_at).toLocaleString() : 'Not paid'}</dd>
                        <dt className="text-muted-foreground">Stripe payment</dt>
                        <dd className="font-mono">{o.stripe_payment_intent ?? '—'}</dd>
                      </dl>
                      {o.notes && <p className="mt-4 max-w-3xl whitespace-pre-line">{o.notes}</p>}
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Refunds are made in the Stripe Dashboard and show up here automatically.</p>
      {page.last_page > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <span className="text-muted-foreground">
            Page {page.current_page} of {page.last_page}
          </span>
          {page.current_page > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link to={pageLink(page.current_page - 1)}>Previous</Link>
            </Button>
          )}
          {page.current_page < page.last_page && (
            <Button asChild variant="outline" size="sm">
              <Link to={pageLink(page.current_page + 1)}>Next</Link>
            </Button>
          )}
        </div>
      )}
    </>
  )
}
