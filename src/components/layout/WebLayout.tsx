import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Dumbbell, Utensils, User, Zap, Settings, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/entreno', label: 'Entrenamiento', icon: Dumbbell },
  { path: '/nutricion', label: 'Nutrición', icon: Utensils },
  { path: '/perfil', label: 'Perfil', icon: User },
];

const AppSidebar: React.FC = () => {
  const location = useLocation();
  const { isPremium } = useSubscription();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Logo Header */}
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold text-foreground">AUTOPILOT</span>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ path, label, icon: Icon }) => (
                <SidebarMenuItem key={path}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(path)}
                    tooltip={label}
                  >
                    <NavLink to={path}>
                      <Icon className="w-5 h-5" />
                      <span>{label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-2">
        <SidebarMenu>
          {/* Premium Button */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={isPremium ? 'Premium Activo' : 'Upgrade a Premium'}
              className={cn(
                isPremium 
                  ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30' 
                  : 'text-yellow-500 hover:bg-yellow-500/10'
              )}
            >
              <NavLink to="/premium">
                {isPremium ? <Crown className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                <span>{isPremium ? 'Premium' : 'Upgrade'}</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Settings */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location.pathname === '/perfil/config'}
              tooltip="Configuración"
            >
              <NavLink to="/perfil/config">
                <Settings className="w-5 h-5" />
                <span>Configuración</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export const WebLayout: React.FC = () => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top Header with Sidebar Trigger */}
          <header className="sticky top-0 z-40 h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-4 md:px-6">
            <SidebarTrigger className="mr-4" />
            <div className="flex-1" />
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto w-full">
              <Outlet />
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-border mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="w-4 h-4 text-primary" />
                  <span>AUTOPILOT</span>
                  <span className="text-border">•</span>
                  <span>Tu entrenador automático</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  © {new Date().getFullYear()} AlphaSupps
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
};
