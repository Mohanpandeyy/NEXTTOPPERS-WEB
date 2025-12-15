import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Award, Clock, Sparkles, GraduationCap, Target, Zap, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BatchCard from '@/components/cards/BatchCard';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import FeedbackFormUser from '@/components/FeedbackFormUser';

const categories = [
  { name: 'JEE', icon: '🎯', color: 'bg-primary/10 text-primary border-primary/20' },
  { name: 'NEET', icon: '🔬', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  { name: 'Boards', icon: '📚', color: 'bg-violet-500/10 text-violet-600 border-violet-500/20' },
  { name: 'Foundation', icon: '🏗️', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  { name: '9-10', icon: '📖', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
  { name: '11-12', icon: '🎓', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
];

const features = [
  {
    icon: GraduationCap,
    title: 'Expert Faculty',
    description: 'Learn from India\'s top educators with years of experience',
    color: 'bg-primary/10 text-primary'
  },
  {
    icon: Target,
    title: 'Structured Learning',
    description: 'Well-organized curriculum designed for maximum results',
    color: 'bg-emerald-500/10 text-emerald-600'
  },
  {
    icon: Zap,
    title: 'Live Classes',
    description: 'Interactive live sessions with real-time doubt clearing',
    color: 'bg-amber-500/10 text-amber-600'
  },
  {
    icon: Trophy,
    title: 'Proven Results',
    description: 'Thousands of students achieved their dream scores',
    color: 'bg-violet-500/10 text-violet-600'
  },
];

const stats = [
  { label: 'Active Students', value: '10K+', icon: Users },
  { label: 'Expert Teachers', value: '50+', icon: Award },
  { label: 'Hours of Content', value: '5000+', icon: Clock },
  { label: 'Batches', value: '100+', icon: BookOpen },
];

export default function Home() {
  const { appName, logoUrl } = useAppSettings();
  const { user } = useSupabaseAuth();
  
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
    <div className="min-h-screen bg-background">
      {/* Feedback popup for logged in users */}
      {user && <FeedbackFormUser />}
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              <span>Your Success Journey Starts Here</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Crack Your{' '}
              <span className="text-gradient">Dream Exam</span>
              <br />
              With Expert Guidance
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of successful students preparing for JEE, NEET & Boards with 
              India's best teachers. Live classes, notes, DPPs & more.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/batches">
                <Button size="lg" className="gradient-primary text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group">
                  Explore Batches
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/today-live">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-xl">
                  Live Classes
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border bg-card/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl gradient-primary flex items-center justify-center">
                  <stat.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Students Love Us</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything you need to ace your exams, all in one place
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div 
                key={feature.title}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Path</h2>
            <p className="text-muted-foreground">
              Select your target exam and start your preparation
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={`/batches?exam=${cat.name}`}
                className="group"
              >
                <div className={`${cat.color} rounded-2xl p-6 text-center border transition-all duration-300 hover:scale-105 hover:shadow-lg`}>
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{cat.icon}</div>
                  <div className="font-bold">{cat.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Batches Section */}
      {batches.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">Popular Batches</h2>
                <p className="text-muted-foreground">Top-rated courses by expert faculty</p>
              </div>
              <Link to="/batches" className="hidden md:block">
                <Button variant="outline" className="rounded-xl group">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {batches.map((batch) => (
                <BatchCard key={batch.id} batch={batch} />
              ))}
            </div>

            <div className="mt-8 text-center md:hidden">
              <Link to="/batches">
                <Button variant="outline" className="rounded-xl">
                  View All Batches
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="gradient-primary rounded-3xl p-10 md:p-16 text-center text-primary-foreground relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
            
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Ready to Start Your Journey?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto text-lg">
                Join {appName} today and get access to the best learning resources
              </p>
              <Link to="/batches">
                <Button size="lg" variant="secondary" className="text-lg px-10 py-6 rounded-xl hover:scale-105 transition-transform">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xl font-bold">
              {logoUrl ? (
                <img src={logoUrl} alt={appName} className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
              <span>{appName}</span>
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
