import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Dumbbell, Utensils, User, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/contexts/SubscriptionContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/entreno', label: 'Entrenamiento', icon: Dumbbell },
  { path: '/nutricion', label: 'Nutrición', icon: Utensils },
  { path: '/perfil', label: 'Perfil', icon: User },
];

export const WebLayout: React.FC = () => {
  const location = useLocation();
  const { isPremium } = useSubscription();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex w-64 border-r border-border bg-card flex-col fixed h-screen">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">AUTOPILOT</h1>
              <p className="text-xs text-muted-foreground">
                {isPremium ? 'Premium' : 'Free'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path || 
              (path !== '/' && location.pathname.startsWith(path));
            
            return (
              <NavLink
                key={path}
                to={path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  isActive 
                    ? 'bg-primary text-primary-foreground font-semibold' 
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Premium CTA */}
        {!isPremium && (
          <div className="p-4 border-t border-border">
            <NavLink
              to="/premium"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 hover:from-yellow-500/20 hover:to-orange-500/20 transition-colors"
            >
              <Zap className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="font-semibold text-foreground text-sm">Hazte Premium</p>
                <p className="text-xs text-muted-foreground">Desbloquea todo</p>
              </div>
            </NavLink>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        {/* Top bar for mobile */}
        <header className="md:hidden sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">AUTOPILOT</span>
            </div>
            {isPremium && (
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-500 font-medium">
                Premium
              </span>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-screen pb-20 md:pb-0">
          <div className="max-w-5xl mx-auto p-4 md:p-8">
            <Outlet />
          </div>
        </main>

        {/* Bottom navigation for mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path ||
                (path !== '/' && location.pathname.startsWith(path));
              
              return (
                <NavLink
                  key={path}
                  to={path}
                  className={cn(
                    'flex flex-col items-center justify-center flex-1 py-2 transition-all',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <Icon className={cn('w-5 h-5', isActive && 'scale-110')} />
                  <span className="text-[10px] mt-1 font-medium">{label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};
