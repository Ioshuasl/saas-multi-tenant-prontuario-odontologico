'use client';

/** Barrel só para o CLI shadcn. App code: sidebar-context / chrome / panel / menu. */

export { SidebarProvider, useSidebar } from '@/shared/ui/sidebar-context';
export { SidebarInset, SidebarRail, SidebarTrigger } from '@/shared/ui/sidebar-chrome';
export { Sidebar } from '@/shared/ui/sidebar-panel';
export {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from '@/shared/ui/sidebar-menu';
