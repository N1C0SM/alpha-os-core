import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Dumbbell, Utensils, CheckSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Hoy', icon: Home },
  { path: '/entreno', label: 'Entreno', icon: Dumbbell },
  { path: '/nutricion', label: 'Nutrición', icon: Utensils },
  { path: '/habitos', label: 'Hábitos', icon: CheckSquare },
  { path: '/perfil', label: 'Perfil', icon: User },
];

export const BottomNavigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="bottom-nav border-t border-border">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          
          return (
            <NavLink
              key={path}
              to={path}
              className={cn(
                'nav-item flex-1',
                isActive && 'active'
              )}
            >
              <Icon 
                className={cn(
                  'nav-icon w-6 h-6 mb-1 transition-all duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <span 
                className={cn(
                  'text-xs font-medium transition-colors',
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
