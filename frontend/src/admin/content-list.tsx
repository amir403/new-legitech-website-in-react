import { Link, useLoaderData, useRevalidator, type LoaderFunctionArgs } from 'react-router'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { adminFetch } from './api'
import { apiPath, findType } from './content-types'

export type Row = { id: number; slug: string; is_published?: boolean; is_active?: boolean; published_at?: string | null; sort_order?: number } & Record<string, unknown>

export async function loader({ params }: LoaderFunctionArgs) {
  const type = findType(params.type)
  if (!type) throw new Response(null, { status: 404 })
  return { typeKey: type.key, rows: (await adminFetch<{ data: Row[] }>('GET', apiPath(type))).data }
}

function status(row: Row) {
  if ('is_published' in row) return row.is_published ? 'Published' : 'Hidden'
  if ('is_active' in row) return row.is_active ? 'Published' : 'Hidden'
  if (!row.published_at) return 'Draft'
  return new Date(row.published_at) > new Date() ? 'Scheduled' : 'Published'
}

export function ContentList() {
  const { typeKey, rows } = useLoaderData<typeof loader>()
  const type = findType(typeKey)!
  const { revalidate } = useRevalidator()

  async function remove(row: Row) {
    try {
      await adminFetch('DELETE', `${apiPath(type)}/${row.id}`)
      toast.success(`Deleted “${String(row[type.title])}”.`)
      revalidate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed.')
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{type.label}</h1>
        <Button asChild>
          <Link to={`/admin/${type.key}/new`}>New {type.singular}</Link>
        </Button>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{type.title === 'title' ? 'Title' : 'Name'}</TableHead>
              <TableHead className="hidden md:table-cell">{type.meta ? 'Category · price' : 'Slug'}</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  Nothing here yet.
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  <Link to={`/admin/${type.key}/${row.id}`} className="hover:underline">
                    {String(row[type.title])}
                  </Link>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{type.meta ? type.meta(row) : row.slug}</TableCell>
                <TableCell>
                  <Badge variant={status(row) === 'Published' ? 'default' : 'secondary'}>{status(row)}</Badge>
                </TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/admin/${type.key}/${row.id}`}>Edit</Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete “{String(row[type.title])}”?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This removes it from the website and cannot be undone. To hide it temporarily, switch it off in the edit form instead.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={() => remove(row)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
