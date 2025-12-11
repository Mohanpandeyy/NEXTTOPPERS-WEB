import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Award, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BatchCard from '@/components/cards/BatchCard';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAppSettings } from '@/hooks/useAppSettings';

const categories = [
  { name: 'JEE', icon: '🎯', color: 'bg-primary/10 text-primary' },
  { name: 'NEET', icon: '🔬', color: 'bg-green-500/10 text-green-600' },
  { name: 'Boards', icon: '📚', color: 'bg-purple-500/10 text-purple-600' },
  { name: 'Foundation', icon: '🏗️', color: 'bg-accent/10 text-accent' },
  { name: '9-10', icon: '📖', color: 'bg-pink-500/10 text-pink-600' },
  { name: '11-12', icon: '🎓', color: 'bg-cyan-500/10 text-cyan-600' },
];

const stats = [
  { label: 'Active Students', value: '10K+', icon: Users },
  { label: 'Expert Teachers', value: '50+', icon: Award },
  { label: 'Hours of Content', value: '5000+', icon: Clock },
  { label: 'Batches', value: '100+', icon: BookOpen },
];

export default function Home() {
  const { appName, logoUrl } = useAppSettings();
  
  const { data: batches = [] } = useQuery({
    queryKey: ['public-batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('visibility', 'public')
        .limit(4);
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative gradient-hero overflow-hidden min-h-[90vh] flex items-center">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(234_89%_58%/0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(38_92%_50%/0.15),transparent_50%)]" />
          <div className="absolute top-20 left-[10%] w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-[10%] w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        </div>
        
        {/* Floating shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] left-[15%] w-4 h-4 bg-primary/30 rounded-full animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute top-[30%] right-[20%] w-6 h-6 bg-accent/30 rounded-full animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-[25%] left-[25%] w-3 h-3 bg-primary/40 rounded-full animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-[40%] right-[10%] w-5 h-5 bg-accent/40 rounded-full animate-float" style={{ animationDelay: '1.5s' }} />
        </div>
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 animate-bounce-in">
              <Sparkles className="w-4 h-4" />
              <span>Start your learning journey today</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
              Learn Smart,{' '}
              <span className="text-gradient relative">
                Achieve More
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 10C50 4 100 2 150 6C200 10 250 8 298 4" stroke="url(#gradient)" strokeWidth="4" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(234 89% 58%)" />
                      <stop offset="100%" stopColor="hsl(38 92% 50%)" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Your complete learning platform for JEE, NEET, and Board exams. 
              Access live classes, notes, DPPs, and expert guidance all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/batches">
                <Button size="lg" className="gradient-primary text-lg px-10 py-6 rounded-2xl shadow-glow hover:shadow-elevated transition-all duration-500 hover:scale-105 group">
                  Explore Batches
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card/80 backdrop-blur-lg border-y border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 stagger-children">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="text-center group"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center shadow-lg group-hover:shadow-glow group-hover:scale-110 transition-all duration-500">
                  <stat.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 animate-slide-up">Browse by Category</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Choose your target exam and find the perfect batch for your preparation
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 stagger-children">
            {categories.map((cat, i) => (
              <Link
                key={cat.name}
                to={`/batches?exam=${cat.name}`}
                className="group"
              >
                <div className={`${cat.color} rounded-2xl p-6 text-center transition-all duration-500 hover-magnetic glass-card border border-border/50 hover:border-primary/30`}>
                  <div className="text-4xl mb-3 transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12">{cat.icon}</div>
                  <div className="font-bold text-lg">{cat.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Batches Section */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-secondary/30 via-secondary/50 to-secondary/30 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(234_89%_58%/0.1),transparent_50%)]" />
        <div className="container mx-auto px-4 relative">
          <div className="flex items-center justify-between mb-16">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-3 animate-slide-up">Featured Batches</h2>
              <p className="text-muted-foreground text-lg animate-slide-up" style={{ animationDelay: '0.1s' }}>Top-rated courses by our expert faculty</p>
            </div>
            <Link to="/batches" className="hidden md:block animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Button variant="outline" className="rounded-xl hover:bg-primary hover:text-primary-foreground transition-all duration-300 group">
                View All
                <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
            {batches.map((batch) => (
              <BatchCard key={batch.id} batch={batch} />
            ))}
          </div>

          <div className="mt-10 text-center md:hidden">
            <Link to="/batches">
              <Button variant="outline" className="rounded-xl">
                View All Batches
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="relative gradient-primary rounded-3xl p-10 md:p-16 text-center text-primary-foreground overflow-hidden shadow-glow">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/10 rounded-full blur-3xl animate-float" />
              <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
            </div>
            
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 animate-slide-up">
                Ready to Start Learning?
              </h2>
              <p className="text-primary-foreground/80 mb-10 max-w-2xl mx-auto text-lg animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Join thousands of students who are already preparing for their dream careers with {appName}.
              </p>
              <Link to="/batches">
                <Button size="lg" variant="secondary" className="text-lg px-10 py-6 rounded-2xl hover:scale-105 transition-all duration-500 shadow-lg hover:shadow-xl animate-slide-up group" style={{ animationDelay: '0.2s' }}>
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card/80 backdrop-blur-lg border-t border-border py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 text-2xl font-bold group">
              {logoUrl ? (
                <img src={logoUrl} alt={appName} className="w-10 h-10 rounded-xl object-cover transition-transform duration-300 group-hover:scale-110" />
              ) : (
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-glow group-hover:scale-110">
                  <BookOpen className="w-6 h-6 text-primary-foreground" />
                </div>
              )}
              <span className="transition-colors duration-300 group-hover:text-primary">{appName}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {appName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
