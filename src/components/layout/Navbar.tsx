import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, GraduationCap, User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import AdminLoginModal from '@/components/modals/AdminLoginModal';

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/batches', label: 'Batches', icon: BookOpen },
  { href: '/my-classes', label: 'My Classes', icon: GraduationCap },
];

export default function Navbar() {
  const location = useLocation();
  const { currentUser, isAdmin, logout } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogoClick = () => {
    if (!isAdmin) {
      setIsLoginModalOpen(true);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo - clickable for admin login */}
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-2 text-xl font-bold text-foreground hover:text-primary transition-colors"
            >
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span>EduMaster</span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
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
              {isAdmin ? (
                <>
                  <Link to="/admin">
                    <Button variant="outline" size="sm">
                      Admin Panel
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    Logout
                  </Button>
                </>
              ) : (
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
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
            <div className="md:hidden pb-4 animate-fade-in">
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  );
                })}
                {isAdmin && (
                  <>
                    <Link
                      to="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary"
                    >
                      Admin Panel
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10"
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}
