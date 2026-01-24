import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import AuthGuard from '../components/shared/AuthGuard';
import PageHeader from '../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart3, MessageCircle, Clock, TrendingUp } from 'lucide-react';

function LisaAnalyticsContent() {
  const [timeRange, setTimeRange] = useState('7d');
  
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['lisaAnalytics', timeRange],
    queryFn: async () => {
      const cutoffDate = new Date();
      if (timeRange === '7d') cutoffDate.setDate(cutoffDate.getDate() - 7);
      if (timeRange === '30d') cutoffDate.setDate(cutoffDate.getDate() - 30);
      
      const filter = timeRange === 'all' 
        ? {} 
        : { created_date: { $gte: cutoffDate.toISOString() } };
      
      const items = await base44.entities.LisaAnalytics.list();
      const filtered = items.filter(item => {
        if (timeRange === 'all') return true;
        return new Date(item.created_date) >= cutoffDate;
      });
      
      const totalQuestions = filtered.length;
      const avgResponseTime = filtered.reduce((sum, i) => sum + (i.response_time_ms || 0), 0) / (totalQuestions || 1);
      
      const byCategory = filtered.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {});
      
      const questionFrequency = filtered.reduce((acc, item) => {
        const key = item.question.substring(0, 50);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      
      const topQuestions = Object.entries(questionFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      const actions = filtered.reduce((acc, item) => {
        if (item.action_taken) {
          acc[item.action_taken] = (acc[item.action_taken] || 0) + 1;
        }
        return acc;
      }, {});
      
      return {
        totalQuestions,
        avgResponseTime: Math.round(avgResponseTime),
        byCategory,
        topQuestions,
        actions
      };
    }
  });
  
  if (isLoading || !analytics) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <PageHeader title="Lisa Analytics" subtitle="Chat performance and insights" />
        <div className="max-w-6xl mx-auto p-4">
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-[#0C3B2E] rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader title="Lisa Analytics" subtitle="Chat performance and insights" />
      
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Time Range Selector */}
        <div className="flex gap-2">
          <button 
            onClick={() => setTimeRange('7d')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              timeRange === '7d' 
                ? 'bg-[#0C3B2E] text-white shadow-md' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Last 7 Days
          </button>
          <button 
            onClick={() => setTimeRange('30d')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              timeRange === '30d' 
                ? 'bg-[#0C3B2E] text-white shadow-md' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Last 30 Days
          </button>
          <button 
            onClick={() => setTimeRange('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              timeRange === 'all' 
                ? 'bg-[#0C3B2E] text-white shadow-md' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Time
          </button>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-[#0C3B2E]">
                    {analytics.totalQuestions}
                  </div>
                  <div className="text-sm text-gray-600">Total Questions</div>
                </div>
                <MessageCircle className="w-12 h-12 text-[#0C3B2E] opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-[#0C3B2E]">
                    {analytics.avgResponseTime}ms
                  </div>
                  <div className="text-sm text-gray-600">Avg Response Time</div>
                </div>
                <Clock className="w-12 h-12 text-[#0C3B2E] opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-[#0C3B2E]">
                    {Object.keys(analytics.byCategory).length}
                  </div>
                  <div className="text-sm text-gray-600">Question Categories</div>
                </div>
                <BarChart3 className="w-12 h-12 text-[#0C3B2E] opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Questions by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.byCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => (
                  <div key={category} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="capitalize font-medium">{category.replace('_', ' ')}</span>
                    <span className="font-semibold text-[#0C3B2E]">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Top Questions */}
        <Card>
          <CardHeader>
            <CardTitle>Most Frequent Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topQuestions.map(([question, count], idx) => (
                <div key={idx} className="border-b pb-3 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div className="text-sm font-medium flex-1">{question}...</div>
                    <div className="text-xs bg-[#0C3B2E] text-white px-2 py-1 rounded ml-2">
                      {count}x
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Actions Taken */}
        <Card>
          <CardHeader>
            <CardTitle>User Actions After Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.actions)
                .sort((a, b) => b[1] - a[1])
                .map(([action, count]) => (
                  <div key={action} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="capitalize font-medium">{action.replace(/_/g, ' ')}</span>
                    <span className="font-semibold text-[#0C3B2E]">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LisaAnalytics() {
  return (
    <AuthGuard>
      <LisaAnalyticsContent />
    </AuthGuard>
  );
}