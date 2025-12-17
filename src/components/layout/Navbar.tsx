import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Radio, Bell, Menu, X, LogIn, LogOut, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import AIHelper from '@/components/AIHelper';

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/batches', label: 'Batches', icon: BookOpen },
  { href: '/today-live', label: 'Today Live', icon: Radio },
  { href: '/notifications', label: 'Notifications', icon: Bell, showBadge: true },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useSupabaseAuth();
  const { appName, logoUrl } = useAppSettings();
  const { unreadCount, requestPermission } = useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAIHelper, setShowAIHelper] = useState(false);

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (user) {
      requestPermission();
    }
  }, [user, requestPermission]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const NotificationBadge = ({ count, className }: { count: number; className?: string }) => {
    if (count === 0) return null;
    return (
      <span className={cn(
        "absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center",
        "bg-red-500 text-white text-[10px] font-bold rounded-full px-1",
        "animate-pulse shadow-lg",
        className
      )}>
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/30 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 text-xl font-bold text-foreground hover:text-primary transition-all duration-300 group"
          >
            {logoUrl ? (
              <img src={logoUrl} alt={appName} className="w-10 h-10 rounded-xl object-cover transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg transition-all duration-500 group-hover:shadow-glow group-hover:scale-110 group-hover:rotate-3">
                <Radio className="w-6 h-6 text-primary-foreground" />
              </div>
            )}
            <span className="hidden sm:inline font-bold text-lg">{appName}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 bg-secondary/50 backdrop-blur-sm rounded-2xl p-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card'
                  )}
                >
                  <div className="relative">
                    <Icon className="w-4 h-4" />
                    {link.showBadge && user && (
                      <NotificationBadge count={unreadCount} className="-top-2 -right-2" />
                    )}
                  </div>
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAIHelper(true)}
                className="rounded-xl hover:bg-purple-500/10"
                title="AI Helper"
              >
                <Sparkles className="w-5 h-5 text-purple-500" />
              </Button>
            )}
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="outline" size="sm" className="rounded-xl border-primary/30 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300">
                      Admin Panel
                    </Button>
                  </Link>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback>
                          {profile?.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="w-4 h-4 mr-2" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="rounded-xl gradient-primary shadow-lg hover:shadow-glow transition-all duration-300 hover:scale-105">
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button with notification badge */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile notification indicator */}
            {user && unreadCount > 0 && (
              <Link to="/notifications" className="relative p-2.5 rounded-xl bg-secondary/50">
                <Bell className="w-5 h-5" />
                <NotificationBadge count={unreadCount} />
              </Link>
            )}
            
            <button
              className="p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary transition-all duration-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-6 pt-2 animate-slide-up">
            <div className="flex flex-col gap-2 bg-secondary/30 backdrop-blur-sm rounded-2xl p-3">
              {navLinks.map((link, i) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'text-muted-foreground hover:text-foreground hover:bg-card'
                    )}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      {link.label}
                    </div>
                    {link.showBadge && user && unreadCount > 0 && (
                      <span className="min-w-[20px] h-[20px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1.5">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
              <div className="h-px bg-border/50 my-2" />
              {user ? (
                <>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-primary hover:bg-primary/10 transition-all duration-300"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all duration-300"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-medium gradient-primary text-primary-foreground shadow-lg transition-all duration-300"
                >
                  <LogIn className="w-5 h-5" />
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
      {/* AI Helper */}
      {showAIHelper && (
        <AIHelper onClose={() => setShowAIHelper(false)} />
      )}
    </nav>
  );
}
