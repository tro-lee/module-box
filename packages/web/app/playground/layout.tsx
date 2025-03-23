import { SidebarProvider } from '@/components/ui/sidebar'

export default function PlaygroundLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="h-screen w-screen">
      <SidebarProvider>{children}</SidebarProvider>
    </div>
  )
}
