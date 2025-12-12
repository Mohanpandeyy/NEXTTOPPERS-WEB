import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Radio, Bell, Menu, X, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useAppSettings } from '@/hooks/useAppSettings';

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/batches', label: 'Batches', icon: BookOpen },
  { href: '/today-live', label: 'Today Live', icon: Radio },
  { href: '/notifications', label: 'Notifications', icon: Bell },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useSupabaseAuth();
  const { appName, logoUrl } = useAppSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
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
                    'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="outline" size="sm" className="rounded-xl border-primary/30 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300">
                      Admin Panel
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all duration-300">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
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

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary transition-all duration-300"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
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
                      'flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'text-muted-foreground hover:text-foreground hover:bg-card'
                    )}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
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
    </nav>
  );
}
