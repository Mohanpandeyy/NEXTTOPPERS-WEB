import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BatchCard from '@/components/cards/BatchCard';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Database } from '@/integrations/supabase/types';

type ExamType = Database['public']['Enums']['exam_type'];
type BatchStatus = Database['public']['Enums']['batch_status'];

const examTypes: ExamType[] = ['JEE', 'NEET', 'Boards', 'Foundation', '9-10', '11-12'];
const statusTypes: BatchStatus[] = ['ongoing', 'upcoming', 'completed'];

export default function Batches() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExam, setSelectedExam] = useState<ExamType | null>(
    (searchParams.get('exam') as ExamType) || null
  );
  const [selectedStatus, setSelectedStatus] = useState<BatchStatus | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: batches = [] } = useQuery({
    queryKey: ['batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const filteredBatches = useMemo(() => {
    return batches.filter((batch) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !batch.name.toLowerCase().includes(query) &&
          !(batch.description || '').toLowerCase().includes(query) &&
          !(batch.tags || []).some(tag => tag.toLowerCase().includes(query))
        ) {
          return false;
        }
      }
      
      if (selectedExam && batch.target_exam !== selectedExam) return false;
      if (selectedStatus && batch.status !== selectedStatus) return false;
      
      return true;
    });
  }, [batches, searchQuery, selectedExam, selectedStatus]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedExam(null);
    setSelectedStatus(null);
    setSearchParams({});
  };

  const hasActiveFilters = searchQuery || selectedExam || selectedStatus;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">All Batches</h1>
          <p className="text-muted-foreground">
            Find the perfect course for your preparation journey
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search batches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <aside
            className={`${
              showFilters ? 'fixed inset-0 z-50 bg-background p-4' : 'hidden'
            } md:relative md:block md:w-64 flex-shrink-0`}
          >
            <div className="flex items-center justify-between mb-6 md:hidden">
              <h3 className="font-semibold">Filters</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Exam Type Filter */}
              <div>
                <h4 className="font-medium mb-3">Target Exam</h4>
                <div className="flex flex-wrap gap-2">
                  {examTypes.map((exam) => (
                    <Badge
                      key={exam}
                      variant={selectedExam === exam ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setSelectedExam(selectedExam === exam ? null : exam)}
                    >
                      {exam}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <h4 className="font-medium mb-3">Status</h4>
                <div className="flex flex-wrap gap-2">
                  {statusTypes.map((status) => (
                    <Badge
                      key={status}
                      variant={selectedStatus === status ? 'default' : 'outline'}
                      className="cursor-pointer capitalize"
                      onClick={() => setSelectedStatus(selectedStatus === status ? null : status)}
                    >
                      {status}
                    </Badge>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="w-full">
                  Clear all filters
                </Button>
              )}
            </div>

            {showFilters && (
              <Button
                className="w-full mt-6 md:hidden"
                onClick={() => setShowFilters(false)}
              >
                Apply Filters
              </Button>
            )}
          </aside>

          {/* Batches Grid */}
          <div className="flex-1">
            {hasActiveFilters && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchQuery}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setSearchQuery('')}
                    />
                  </Badge>
                )}
                {selectedExam && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedExam}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setSelectedExam(null)}
                    />
                  </Badge>
                )}
                {selectedStatus && (
                  <Badge variant="secondary" className="gap-1 capitalize">
                    {selectedStatus}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setSelectedStatus(null)}
                    />
                  </Badge>
                )}
              </div>
            )}

            {filteredBatches.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold mb-2">No batches found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search query
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Showing {filteredBatches.length} batches
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBatches.map((batch, i) => (
                    <div
                      key={batch.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <BatchCard batch={batch} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
