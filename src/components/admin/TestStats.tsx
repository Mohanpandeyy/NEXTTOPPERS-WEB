import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, ListChecks } from 'lucide-react';

interface TestStatsProps {
  totalTests: number;
  activeTests: number;
}

export default function TestStats({ totalTests, activeTests }: TestStatsProps) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
        <Card className="overflow-hidden relative group hover:shadow-lg transition-shadow">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-lg"
              >
                <FileText className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <motion.p key={totalTests} initial={{ scale: 1.2 }} animate={{ scale: 1 }}
                  className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {totalTests}
                </motion.p>
                <p className="text-sm text-muted-foreground">Total Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
        <Card className="overflow-hidden relative group hover:shadow-lg transition-shadow">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: -5 }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-500/50 flex items-center justify-center shadow-lg"
              >
                <ListChecks className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <motion.p key={activeTests} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-3xl font-bold text-green-600">
                  {activeTests}
                </motion.p>
                <p className="text-sm text-muted-foreground">Active Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
