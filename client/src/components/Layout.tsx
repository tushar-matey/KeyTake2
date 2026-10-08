import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';
import { LogOut, Home, List, PlusCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Toaster } from './ui/toaster';

export function Layout() {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Meetings', path: '/meetings', icon: List },
    { name: 'New Meeting', path: '/meetings/new', icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Sidebar (Desktop) / Header (Mobile) */}
      <nav className="border-r md:w-64 flex-shrink-0 p-4 flex md:flex-col justify-between overflow-y-auto">
        <div>
          <div className="flex items-center gap-2 font-semibold text-lg mb-6 tracking-tight">
            <span className="bg-primary text-primary-foreground p-1 rounded-md">KT</span>
            KeyTake
          </div>
          <div className="hidden md:flex flex-col gap-2">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? 'secondary' : 'ghost'}
                className="justify-start"
                asChild
              >
                <Link to={item.path}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden gap-2">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant={location.pathname === item.path ? 'secondary' : 'ghost'}
              size="icon"
              asChild
            >
              <Link to={item.path}>
                <item.icon className="h-4 w-4" />
              </Link>
            </Button>
          ))}
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        <div className="hidden md:flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <ThemeToggle />
            <Button variant="outline" className="w-full ml-2" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-5xl">
            <Outlet />
          </div>
        </div>
      </main>

      <Toaster />
    </div>
  );
}
