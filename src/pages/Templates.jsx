import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileCheck, ArrowLeft, Mail, AlertCircle, FileText, Shield, Scale, Clock, ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FeatureGate, useFeatureAccess } from "../components/shared/FeatureGate";

const TEMPLATES = [
  {
    id: 'deposit_request',
    title: 'Deposit Return Request',
    description: 'Polite formal letter requesting return of security deposit (EN/TH)',
    icon: Shield,
    tier: 'lite',
    category: 'Deposit',
    languages: ['en', 'th']
  },
  {
    id: 'deposit_late',
    title: 'Late Deposit Return Reminder',
    description: 'Follow-up reminder for overdue deposit return with timeline request',
    icon: Clock,
    tier: 'lite',
    category: 'Deposit',
    languages: ['en', 'th']
  },
  {
    id: 'repair_dispute',
    title: 'Repair Cost Dispute',
    description: 'Dispute unfair repair charges with evidence references',
    icon: AlertCircle,
    tier: 'protect',
    category: 'Dispute',
    languages: ['en', 'th']
  },
  {
    id: 'pdpa_request',
    title: 'PDPA Data Request',
    description: 'Request personal data and lease documents under PDPA',
    icon: FileText,
    tier: 'protect',
    category: 'Legal',
    languages: ['en', 'th']
  },
  {
    id: 'pre_move_out',
    title: 'Pre-Move-Out Notice',
    description: 'Formal notice of move-out date and inspection request',
    icon: Mail,
    tier: 'lite',
    category: 'Move-Out',
    languages: ['en', 'th']
  },
  {
    id: 'handover_check',
    title: 'Handover Inspection Checklist',
    description: 'Comprehensive checklist for property handover with photo slots',
    icon: ClipboardCheck,
    tier: 'protect',
    category: 'Move-Out',
    languages: ['en', 'th']
  },
  {
    id: 'contract_clarification',
    title: 'Contract Clarification Request',
    description: 'Request clarification on specific lease clauses',
    icon: Scale,
    tier: 'lite',
    category: 'Lease',
    languages: ['en', 'th']
  },
];

export default function Templates() {
  const navigate = useNavigate();
  const { hasAccess: hasTemplatesLite } = useFeatureAccess('templates_lite');
  const { hasAccess: hasTemplatesFull } = useFeatureAccess('templates_full');

  const canAccessTemplate = (tier) => {
    if (tier === 'lite') return hasTemplatesLite || hasTemplatesFull;
    if (tier === 'protect') return hasTemplatesFull;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("DocumentVault"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <FileCheck className="w-7 h-7 text-blue-600" />
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Letter Templates</h1>
            </div>
            <p className="text-slate-600">Professional bilingual letters for tenants</p>
          </div>
        </div>

        <div className="grid gap-4">
          {TEMPLATES.map((template) => {
            const Icon = template.icon;
            const hasAccess = canAccessTemplate(template.tier);
            
            return (
              <Card 
                key={template.id} 
                className={`border-none shadow-md hover:shadow-lg transition-all duration-300 ${!hasAccess ? 'opacity-60' : ''}`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-lg text-slate-900 mb-1">{template.title}</h3>
                          <div className="flex gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                            {template.languages.map(lang => (
                              <Badge key={lang} variant="outline" className="text-xs">
                                {lang.toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{template.description}</p>
                      {hasAccess ? (
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => navigate(createPageUrl("TemplateForm") + `?templateId=${template.id}`)}
                        >
                          Generate Letter
                        </Button>
                      ) : (
                        <Badge className="bg-purple-100 text-purple-700">
                          {template.tier.toUpperCase()} Plan Required
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}