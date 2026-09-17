import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { RequestDetailModal } from './components/RequestDetailModal';
import { SendRequestModal } from './components/SendRequestModal';

import { OverviewView } from './components/views/OverviewView';
import { RequestsView } from './components/views/RequestsView';
import { OptimizationView } from './components/views/OptimizationView';
import { ModelsView } from './components/views/ModelsView';
import { CacheView } from './components/views/CacheView';
import { RagView } from './components/views/RagView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { SettingsView } from './components/views/SettingsView';

import { 
  AggregatedMetrics, 
  OptimizationConfig, 
  QueryExecutionResult, 
  NavTab 
} from './types';

const DEFAULT_METRICS: AggregatedMetrics = {
  totalQueries: 0,
  totalTokensSaved: 0,
  totalCostSaved: 0,
  baselineTotalCost: 0,
  optimizedTotalCost: 0,
  overallCostReductionPct: 0,
  overallTokenReductionPct: 0,
  avgLatencyBaselineMs: 0,
  avgLatencyOptimizedMs: 0,
  avgLatencyReductionPct: 0,
  cacheHitCount: 0,
  cacheHitRate: 0,
  llmCallsAvoided: 0,
  modelDistribution: {
    smallTierCount: 0,
    strongTierCount: 0,
    cacheBypassedCount: 0,
  },
  avgQualityScore: 0,
  activeCacheEntries: 0,
};

const DEFAULT_CONFIG: OptimizationConfig = {
  cacheEnabled: true,
  cacheThreshold: 0.92,
  routingEnabled: true,
  routingComplexityThreshold: 0.50,
  pruningEnabled: true,
  pruningTopK: 3,
  compressionEnabled: true,
  compressionLevel: 'standard',
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [timeRange, setTimeRange] = useState('24h');
  const [environment, setEnvironment] = useState('prod-us-east');
  
  const [metrics, setMetrics] = useState<AggregatedMetrics>(DEFAULT_METRICS);
  const [queries, setQueries] = useState<QueryExecutionResult[]>([]);
  const [config, setConfig] = useState<OptimizationConfig>(DEFAULT_CONFIG);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [inspectedQuery, setInspectedQuery] = useState<QueryExecutionResult | null>(null);
  const [isSendRequestOpen, setIsSendRequestOpen] = useState(false);

  // Fetch metrics, queries, and config
  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [metricsRes, queriesRes, configRes] = await Promise.all([
        fetch('/api/metrics'),
        fetch('/api/queries?limit=200'),
        fetch('/api/config'),
      ]);

      if (metricsRes.ok) {
        const m = await metricsRes.json();
        setMetrics(m);
      }
      if (queriesRes.ok) {
        const qData = await queriesRes.json();
        setQueries(qData.queries || []);
      }
      if (configRes.ok) {
        const c = await configRes.json();
        setConfig(c);
      }
    } catch (err) {
      console.error('Error fetching dashboard telemetry:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update configuration
  const handleUpdateConfig = async (newConfig: Partial<OptimizationConfig>) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
      }
    } catch (err) {
      console.error('Error updating config:', err);
    }
  };

  // Reset all queries & cache
  const handleResetAll = async () => {
    try {
      await fetch('/api/metrics/reset', { method: 'POST' });
      setQueries([]);
      setMetrics(DEFAULT_METRICS);
      await fetchData();
    } catch (err) {
      console.error('Error resetting telemetry:', err);
    }
  };

  // Clear semantic vector cache
  const handleClearCache = async () => {
    try {
      await fetch('/api/cache/clear', { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('Error clearing cache:', err);
    }
  };

  // On successful test request execution from SendRequestModal
  const handleQueryExecuted = (result: QueryExecutionResult) => {
    fetchData();
    setInspectedQuery(result);
  };

  return (
    <div className="flex min-h-screen bg-[#0b0e14] text-[#e6edf3] font-sans">
      {/* Left Application Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        requestsCount={queries.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Navigation */}
        <TopNav
          currentTab={currentTab}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          environment={environment}
          setEnvironment={setEnvironment}
          onRefresh={fetchData}
          isRefreshing={isRefreshing}
          onOpenSendRequest={() => setIsSendRequestOpen(true)}
        />

        {/* View Switcher */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'overview' && (
            <OverviewView
              metrics={metrics}
              recentQueries={queries}
              onSelectQuery={setInspectedQuery}
              onNavigateTab={setCurrentTab}
              onOpenSendRequest={() => setIsSendRequestOpen(true)}
            />
          )}

          {currentTab === 'requests' && (
            <RequestsView
              queries={queries}
              onSelectQuery={setInspectedQuery}
              onOpenSendRequest={() => setIsSendRequestOpen(true)}
              onRefresh={fetchData}
              isRefreshing={isRefreshing}
            />
          )}

          {currentTab === 'optimization' && (
            <OptimizationView
              config={config}
              onUpdateConfig={handleUpdateConfig}
              queries={queries}
            />
          )}

          {currentTab === 'models' && (
            <ModelsView
              metrics={metrics}
              queries={queries}
            />
          )}

          {currentTab === 'cache' && (
            <CacheView
              metrics={metrics}
              config={config}
              onClearCache={handleClearCache}
              onUpdateConfig={handleUpdateConfig}
            />
          )}

          {currentTab === 'rag' && (
            <RagView />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView
              metrics={metrics}
              queries={queries}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              config={config}
              onResetAll={handleResetAll}
              onClearCache={handleClearCache}
            />
          )}
        </main>
      </div>

      {/* Engineering Trace / Request Detail Modal */}
      {inspectedQuery && (
        <RequestDetailModal
          query={inspectedQuery}
          onClose={() => setInspectedQuery(null)}
        />
      )}

      {/* Send Test Request Modal */}
      <SendRequestModal
        isOpen={isSendRequestOpen}
        onClose={() => setIsSendRequestOpen(false)}
        config={config}
        onSuccess={handleQueryExecuted}
      />
    </div>
  );
}
