import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Dumbbell, Utensils, ListChecks, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Hoy', icon: Home },
  { path: '/entreno', label: 'Entreno', icon: Dumbbell },
  { path: '/nutricion', label: 'Nutrición', icon: Utensils },
  { path: '/habitos', label: 'Hábitos', icon: ListChecks },
  { path: '/perfil', label: 'Perfil', icon: User },
];

export const BottomNavigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2 safe-bottom">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          
          return (
            <NavLink
              key={path}
              to={path}
              className={cn(
                'relative flex flex-col items-center justify-center flex-1 py-2 transition-all duration-200',
                'active:scale-95'
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
              )}
              
              <div className={cn(
                'relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200',
                isActive ? 'bg-primary/15' : 'bg-transparent'
              )}>
                <Icon 
                  className={cn(
                    'w-5 h-5 transition-all duration-200',
                    isActive 
                      ? 'text-primary scale-110' 
                      : 'text-muted-foreground'
                  )}
                />
              </div>
              
              <span 
                className={cn(
                  'text-[10px] font-medium mt-0.5 transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};