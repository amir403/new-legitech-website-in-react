import { createElement } from 'react'
import { redirect, type RouteObject } from 'react-router'

// One dynamic import for the whole admin, so public visitors never download it.
const admin = () => import('./modules')

export const adminRoute: RouteObject = {
  path: 'admin',
  children: [
    { path: 'login', lazy: async () => { const { login } = await admin(); return { loader: login.loader, Component: login.Login } } },
    {
      lazy: async () => {
        const { layout } = await admin()
        return { loader: layout.loader, Component: layout.AdminLayout, errorElement: createElement(layout.AdminError) }
      },
      children: [
        { index: true, loader: () => redirect('/admin/enquiries') },
        { path: 'enquiries', lazy: async () => { const { enquiries } = await admin(); return { loader: enquiries.loader, Component: enquiries.Enquiries } } },
        { path: ':type', lazy: async () => { const { contentList } = await admin(); return { loader: contentList.loader, Component: contentList.ContentList } } },
        { path: ':type/new', lazy: async () => { const { contentForm } = await admin(); return { loader: contentForm.loader, Component: contentForm.ContentForm } } },
        { path: ':type/:id', lazy: async () => { const { contentForm } = await admin(); return { loader: contentForm.loader, Component: contentForm.ContentForm } } },
      ],
    },
  ],
}
