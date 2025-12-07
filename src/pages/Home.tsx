import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Award, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BatchCard from '@/components/cards/BatchCard';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const categories = [
  { name: 'JEE', icon: '🎯', color: 'bg-blue-500/10 text-blue-600' },
  { name: 'NEET', icon: '🔬', color: 'bg-green-500/10 text-green-600' },
  { name: 'Boards', icon: '📚', color: 'bg-purple-500/10 text-purple-600' },
  { name: 'Foundation', icon: '🏗️', color: 'bg-amber-500/10 text-amber-600' },
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
      <section className="relative gradient-hero overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(234_89%_58%/0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(38_92%_50%/0.1),transparent_50%)]" />
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              Learn Smart,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Achieve More
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Your complete learning platform for JEE, NEET, and Board exams. 
              Access live classes, notes, DPPs, and expert guidance all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Link to="/batches">
                <Button size="lg" className="gradient-primary text-lg px-8">
                  Explore Batches
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="text-center animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl gradient-primary flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Browse by Category</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose your target exam and find the perfect batch for your preparation
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, i) => (
              <Link
                key={cat.name}
                to={`/batches?exam=${cat.name}`}
                className="group animate-fade-in"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className={`${cat.color} rounded-xl p-6 text-center transition-all hover:scale-105 hover:shadow-elevated`}>
                  <div className="text-3xl mb-2">{cat.icon}</div>
                  <div className="font-semibold">{cat.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Batches Section */}
      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Featured Batches</h2>
              <p className="text-muted-foreground">Top-rated courses by our expert faculty</p>
            </div>
            <Link to="/batches" className="hidden md:block">
              <Button variant="outline">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {batches.map((batch, i) => (
              <div
                key={batch.id}
                className="animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <BatchCard batch={batch} />
              </div>
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link to="/batches">
              <Button variant="outline">
                View All Batches
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="gradient-primary rounded-2xl p-8 md:p-12 text-center text-primary-foreground">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Learning?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Join thousands of students who are already preparing for their dream careers with EduMaster.
            </p>
            <Link to="/batches">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xl font-bold">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              EduMaster
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 EduMaster. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
