import { BoxesIcon, BriefcaseIcon, ExternalLinkIcon, FactoryIcon, InboxIcon, LayersIcon, LogOutIcon, NewspaperIcon, PuzzleIcon, ReceiptIcon, TagIcon, type LucideIcon } from 'lucide-react'
import { Link, NavLink, Outlet, redirect, useLoaderData, useLocation, useNavigate, useNavigation } from 'react-router'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { adminFetch, getMe } from './api'
import { contentTypes } from './content-types'

export async function loader() {
  const me = await getMe()
  if (!me) throw redirect('/admin/login')
  return me
}

const icons: Record<string, LucideIcon> = { services: LayersIcon, insights: NewspaperIcon, 'work-concepts': BriefcaseIcon, industries: FactoryIcon, 'pricing-packages': TagIcon, 'pricing-addons': PuzzleIcon, 'pricing-bundles': BoxesIcon }
const nav = (types: typeof contentTypes) => types.map((t) => ({ to: `/admin/${t.key}`, label: t.label, icon: icons[t.key] }))
const contentNav = nav(contentTypes.filter((t) => !t.group))
const pricingNav = nav(contentTypes.filter((t) => t.group === 'pricing'))

function NavItem({ to, label, icon: Icon }: { to: string; label: string; icon: LucideIcon }) {
  const { pathname } = useLocation()
  const { setOpenMobile } = useSidebar()
  return (
    <SidebarMenuItem>
      {/* Active for the list and its edit/new pages. */}
      <SidebarMenuButton asChild isActive={pathname === to || pathname.startsWith(to + '/')} tooltip={label}>
        <NavLink to={to} onClick={() => setOpenMobile(false)}>
          <Icon />
          <span>{label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function AdminSidebar({ email, onLogout }: { email: string; onLogout: () => void }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/admin" className="flex h-8 items-center px-2 font-heading text-lg font-extrabold group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <span className="group-data-[collapsible=icon]:hidden">
            LegiTech<span className="text-[#4f6a00] dark:text-primary">.io</span>
          </span>
          <span className="hidden text-[#4f6a00] group-data-[collapsible=icon]:inline dark:text-primary">L</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Inbox</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItem to="/admin/enquiries" label="Enquiries" icon={InboxIcon} />
              <NavItem to="/admin/orders" label="Orders" icon={ReceiptIcon} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Website content</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {contentNav.map((n) => (
                <NavItem key={n.to} {...n} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Pricing</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {pricingNav.map((n) => (
                <NavItem key={n.to} {...n} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="View site">
              <a href="/" target="_blank" rel="noreferrer">
                <ExternalLinkIcon />
                <span>View site</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onLogout} tooltip="Log out">
              <LogOutIcon />
              <span className="truncate">
                Log out <span className="text-muted-foreground">({email})</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export function AdminLayout() {
  const me = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const busy = useNavigation().state !== 'idle'

  async function logout() {
    await adminFetch('POST', '/logout').catch(() => {})
    navigate('/admin/login')
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <title>Admin | LegiTech.io</title>
        <meta name="robots" content="noindex" />
        <AdminSidebar email={me.email} onLogout={logout} />
        <SidebarInset>
          <header className="flex h-14 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 self-center data-[orientation=vertical]:h-4" />
            <span className="text-sm text-muted-foreground">LegiTech.io admin</span>
          </header>
          <div className={cn('mx-auto w-full max-w-6xl px-4 py-8 transition-opacity', busy && 'opacity-60')}>
            <Outlet />
          </div>
        </SidebarInset>
        <Toaster position="bottom-right" />
      </SidebarProvider>
    </TooltipProvider>
  )
}

export function AdminError() {
  return (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-foreground">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">Refresh the page, or go back to the admin home.</p>
        <Button asChild className="mt-6">
          <Link to="/admin">Admin home</Link>
        </Button>
      </div>
    </div>
  )
}
