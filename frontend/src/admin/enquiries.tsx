import { Fragment, useState } from 'react'
import { Link, useLoaderData, useRevalidator, useSearchParams, type LoaderFunctionArgs } from 'react-router'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { adminFetch } from './api'

type Enquiry = { id: number; name: string; email: string; company: string | null; service: string; budget: string; timeline: string; idea: string; status: string; created_at: string }
type Page = { data: Enquiry[]; current_page: number; last_page: number; total: number }

// Same keys as App\Models\Enquiry::STATUSES.
const STATUSES = { new: 'New', contacted: 'Contacted', closed: 'Closed' } as const
const ALL = 'all'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const qs = new URLSearchParams({ page: url.searchParams.get('page') ?? '1' })
  const status = url.searchParams.get('status')
  if (status) qs.set('status', status)
  return adminFetch<Page>('GET', `/enquiries?${qs}`)
}

export function Enquiries() {
  const page = useLoaderData<typeof loader>()
  const [params, setParams] = useSearchParams()
  const { revalidate } = useRevalidator()
  const [open, setOpen] = useState<number | null>(null)

  async function setStatus(e: Enquiry, status: string) {
    try {
      await adminFetch('PATCH', `/enquiries/${e.id}`, { status })
      toast.success(`Marked as ${STATUSES[status as keyof typeof STATUSES].toLowerCase()}.`)
      revalidate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed.')
    }
  }

  async function remove(e: Enquiry) {
    try {
      await adminFetch('DELETE', `/enquiries/${e.id}`)
      toast.success('Enquiry deleted.')
      revalidate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed.')
    }
  }

  const pageLink = (n: number) => {
    const p = new URLSearchParams(params)
    p.set('page', String(n))
    return `?${p}`
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">
          Enquiries <span className="text-base font-normal text-muted-foreground">({page.total})</span>
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
              <TableHead>From</TableHead>
              <TableHead className="hidden md:table-cell">Service</TableHead>
              <TableHead className="hidden sm:table-cell">Received</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No enquiries yet.
                </TableCell>
              </TableRow>
            )}
            {page.data.map((e) => (
              <Fragment key={e.id}>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">{e.name}</div>
                    <a href={`mailto:${e.email}`} className="text-sm text-muted-foreground hover:underline">
                      {e.email}
                    </a>
                  </TableCell>
                  <TableCell className="hidden max-w-56 truncate md:table-cell">{e.service}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{new Date(e.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Select value={e.status} onValueChange={(s) => setStatus(e, s)}>
                      <SelectTrigger size="sm" className="w-32" aria-label={`Status for ${e.name}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUSES).map(([k, label]) => (
                          <SelectItem key={k} value={k}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="space-x-2 text-right whitespace-nowrap">
                    <Button variant="outline" size="sm" aria-expanded={open === e.id} onClick={() => setOpen(open === e.id ? null : e.id)}>
                      {open === e.id ? 'Hide' : 'View'}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete the enquiry from {e.name}?</AlertDialogTitle>
                          <AlertDialogDescription>This permanently removes their details. Use this for spam or when they ask to be deleted.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction variant="destructive" onClick={() => remove(e)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
                {open === e.id && (
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableCell colSpan={5} className="whitespace-normal">
                      <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">
                        <dt className="text-muted-foreground">Company</dt>
                        <dd>{e.company || 'Not provided'}</dd>
                        <dt className="text-muted-foreground">Service</dt>
                        <dd>{e.service}</dd>
                        <dt className="text-muted-foreground">Budget</dt>
                        <dd>{e.budget}</dd>
                        <dt className="text-muted-foreground">Timeline</dt>
                        <dd>{e.timeline}</dd>
                      </dl>
                      <p className="mt-4 max-w-3xl whitespace-pre-line">{e.idea}</p>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
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
