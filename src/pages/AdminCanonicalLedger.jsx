import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Download, Copy, Search, CheckCircle2, AlertTriangle, 
  ArrowLeft, FileText, Database, RefreshCw 
} from "lucide-react";
import AuthGuard from "../components/shared/AuthGuard";
import { ToastProvider, useToast } from "../components/shared/Toast";
import PageHeader from "../components/shared/PageHeader";
import SkeletonLoader from "../components/shared/SkeletonLoader";
import { haptic } from "../components/shared/HapticFeedback";

function AdminCanonicalLedgerContent() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState({});

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: catalogData, isLoading, error, refetch } = useQuery({
    queryKey: ['canonicalLedger'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getCanonicalLedger', {});
      return response.data;
    },
    enabled: !!user
  });

  const isDarkMode = user?.theme === 'dark';
  const language = user?.language || 'en';

  // Admin check
  const userRole = user?.role?.toLowerCase();
  const accessLevel = user?.access_level?.toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'super_admin' || accessLevel === 'admin' || accessLevel === 'super_admin';

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40'
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB'
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto">
          <Card style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-amber-500" />
              <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                Admin Access Required
              </h2>
              <p className="mb-4" style={{ color: colors.textSecondary }}>
                This page is restricted to administrators only.
              </p>
              <Button onClick={() => navigate(createPageUrl("Dashboard"))}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleExportJSON = () => {
    if (!catalogData?.catalog) return;
    haptic.medium();
    
    const exportData = {
      catalog_version: catalogData.catalog_version,
      catalog_updated_at: catalogData.catalog_updated_at,
      catalog_count: catalogData.catalog_count,
      exported_at: new Date().toISOString(),
      catalog: catalogData.catalog
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canonical-clause-catalog-${catalogData.catalog_version}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Catalog exported as JSON');
  };

  const handleCopyJSON = async () => {
    if (!catalogData?.catalog) return;
    haptic.light();
    
    const exportData = {
      catalog_version: catalogData.catalog_version,
      catalog_updated_at: catalogData.catalog_updated_at,
      catalog_count: catalogData.catalog_count,
      catalog: catalogData.catalog
    };
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      toast.success('Catalog JSON copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const toggleRow = (catalogId) => {
    setExpandedRows(prev => ({
      ...prev,
      [catalogId]: !prev[catalogId]
    }));
  };

  // Filter catalog based on search
  const filteredCatalog = catalogData?.catalog?.filter(entry => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      entry.catalog_id?.toLowerCase().includes(term) ||
      entry.canonical_name?.toLowerCase().includes(term) ||
      entry.purpose?.toLowerCase().includes(term) ||
      entry.typical_keywords?.some(k => k.toLowerCase().includes(term)) ||
      entry.typical_variants?.some(v => v.toLowerCase().includes(term))
    );
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-7xl mx-auto">
          <SkeletonLoader variant="table" count={10} isDarkMode={isDarkMode} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto">
          <Card style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                Failed to Load Catalog
              </h2>
              <p className="mb-4" style={{ color: colors.textSecondary }}>
                {error.message || 'An error occurred while loading the canonical clause catalog.'}
              </p>
              <Button onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" /> Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Canonical Clause Catalog"
          subtitle={`Thailand Residential Lease Standard • ${catalogData?.catalog_count || 0} entries`}
          icon={Database}
          iconColor="#0C3B2E"
          showBack={true}
          backRoute={createPageUrl("AdminConsole")}
          isDarkMode={isDarkMode}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCopyJSON}>
                <Copy className="w-4 h-4 mr-2" /> Copy JSON
              </Button>
              <Button style={{ backgroundColor: '#0C3B2E', color: '#fff' }} onClick={handleExportJSON}>
                <Download className="w-4 h-4 mr-2" /> Export JSON
              </Button>
            </div>
          }
        />

        {/* Catalog Info Card */}
        <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F0FDF4' }}>
                <div className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Version</div>
                <div className="text-xl font-bold" style={{ color: '#0C3B2E' }}>{catalogData?.catalog_version}</div>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#EFF6FF' }}>
                <div className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Total Entries</div>
                <div className="text-xl font-bold" style={{ color: '#3B82F6' }}>{catalogData?.catalog_count}</div>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FEF3C7' }}>
                <div className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Active</div>
                <div className="text-xl font-bold" style={{ color: '#F59E0B' }}>
                  {catalogData?.catalog?.filter(c => c.is_active !== false).length || 0}
                </div>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC' }}>
                <div className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Updated</div>
                <div className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                  {catalogData?.catalog_updated_at ? new Date(catalogData.catalog_updated_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: colors.textSecondary }} />
              <Input
                placeholder="Search by ID, name, keywords, or variants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC' }}
              />
            </div>
            {searchTerm && (
              <div className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
                Showing {filteredCatalog.length} of {catalogData?.catalog_count} entries
              </div>
            )}
          </CardContent>
        </Card>

        {/* Catalog Table */}
        <Card className="border-none shadow-lg overflow-hidden" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader className="border-b" style={{ borderColor: colors.borderColor }}>
            <CardTitle style={{ color: colors.textPrimary }}>
              Clause Catalog Entries
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC' }}>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>Canonical Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold hidden md:table-cell" style={{ color: colors.textSecondary }}>Purpose</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold hidden lg:table-cell" style={{ color: colors.textSecondary }}>Keywords</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold" style={{ color: colors.textSecondary }}>Status</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold" style={{ color: colors.textSecondary }}>Ver</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCatalog.map((entry, idx) => (
                    <React.Fragment key={entry.catalog_id}>
                      <tr 
                        className="border-b cursor-pointer hover:opacity-80"
                        style={{ borderColor: colors.borderColor }}
                        onClick={() => toggleRow(entry.catalog_id)}
                      >
                        <td className="px-4 py-3">
                          <Badge variant="outline" style={{ fontFamily: 'monospace' }}>
                            {entry.catalog_id}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium" style={{ color: colors.textPrimary }}>
                            {entry.canonical_name}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="text-sm line-clamp-2" style={{ color: colors.textSecondary }}>
                            {entry.purpose}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {entry.typical_keywords?.slice(0, 3).map((kw, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {kw}
                              </Badge>
                            ))}
                            {entry.typical_keywords?.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{entry.typical_keywords.length - 3}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {entry.is_active !== false ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs" style={{ color: colors.textSecondary }}>
                            {entry.catalog_version}
                          </span>
                        </td>
                      </tr>
                      
                      {/* Expanded Row */}
                      {expandedRows[entry.catalog_id] && (
                        <tr style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC' }}>
                          <td colSpan={6} className="px-4 py-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <div className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>Purpose</div>
                                <div className="text-sm" style={{ color: colors.textPrimary }}>{entry.purpose}</div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>Typical Variants</div>
                                <div className="flex flex-wrap gap-1">
                                  {entry.typical_variants?.map((v, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">{v}</Badge>
                                  ))}
                                  {(!entry.typical_variants || entry.typical_variants.length === 0) && (
                                    <span className="text-sm" style={{ color: colors.textSecondary }}>None</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>All Keywords</div>
                                <div className="flex flex-wrap gap-1">
                                  {entry.typical_keywords?.map((kw, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold mb-2 text-red-600">Risk Triggers</div>
                                <ul className="list-disc list-inside text-sm" style={{ color: colors.textPrimary }}>
                                  {entry.risk_triggers?.map((rt, i) => (
                                    <li key={i}>{rt}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminCanonicalLedger() {
  return (
    <AuthGuard>
      <ToastProvider>
        <AdminCanonicalLedgerContent />
      </ToastProvider>
    </AuthGuard>
  );
}