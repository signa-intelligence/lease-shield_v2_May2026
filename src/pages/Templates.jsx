
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileCheck, ArrowLeft, Mail, AlertCircle, FileText, Shield, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FeatureGate, useFeatureAccess } from "../components/shared/FeatureGate";

const TEMPLATES = [
  {
    id: 'deposit_return',
    title: 'Deposit Return Request',
    description: 'Formal letter requesting the return of your security deposit',
    icon: Shield,
    tier: 'lite',
    category: 'Deposit'
  },
  {
    id: 'maintenance_request',
    title: 'Maintenance Request',
    description: 'Report and request repairs for property issues',
    icon: AlertCircle,
    tier: 'lite',
    category: 'Maintenance'
  },
  {
    id: 'lease_termination',
    title: 'Lease Termination Notice',
    description: 'Provide notice of intent to vacate the property',
    icon: FileText,
    tier: 'protect',
    category: 'Lease'
  },
  {
    id: 'complaint_formal',
    title: 'Formal Complaint Letter',
    description: 'Professional complaint to landlord or property manager',
    icon: Mail,
    tier: 'protect',
    category: 'Dispute'
  },
  {
    id: 'dispute_escalation',
    title: 'Dispute Escalation',
    description: 'Escalate unresolved issues to authorities',
    icon: Scale,
    tier: 'protect',
    category: 'Dispute'
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
            <p className="text-slate-600">Professional letters for tenants</p>
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
                        <h3 className="font-bold text-lg text-slate-900">{template.title}</h3>
                        <Badge variant="outline" className="ml-2">
                          {template.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{template.description}</p>
                      {hasAccess ? (
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => navigate(createPageUrl("TemplateForm") + `?templateId=${template.id}`)}
                        >
                          Use Template
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
