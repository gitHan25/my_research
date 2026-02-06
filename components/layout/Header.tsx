'use client';

import { LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
  // Get initials from display name or email
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-6 backdrop-blur-sm">
      {/* Left side - can be used for breadcrumbs or page title */}
      <div className="flex items-center gap-4">
        {/* Placeholder for page-specific content */}
      </div>

      {/* Right side - User menu */}
      <div className="flex items-center gap-4">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-3 px-2 hover:bg-zinc-800"
              >
                <Avatar className="h-8 w-8 border border-zinc-700">
                  <AvatarFallback className="bg-zinc-800 text-xs text-zinc-300">
                    {getInitials(user.displayName || user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-zinc-200">
                    {user.displayName || 'User'}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={
                        user.role === 'admin'
                          ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/20'
                          : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-700'
                      }
                    >
                      {user.role}
                    </Badge>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 border-zinc-800 bg-zinc-900"
            >
              <DropdownMenuLabel className="text-zinc-400">
                My Account
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem
                disabled
                className="text-zinc-400 focus:bg-zinc-800 focus:text-zinc-200"
              >
                <UserIcon className="mr-2 h-4 w-4" />
                <span>{user.email}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem
                onClick={onLogout}
                className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}

export default Header;
