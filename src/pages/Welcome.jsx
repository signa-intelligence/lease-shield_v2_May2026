import React from "react";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2, FileText, Wallet, Scale, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Welcome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Shield className="w-14 h-14 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome to Lease Shield
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Protect your rental rights with AI-powered lease analysis
          </p>
          <Link to={createPageUrl("Dashboard")}>
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl text-lg px-8 py-6">
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mt-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">AI Lease Scanner</h3>
            <p className="text-blue-100">
              Upload your lease and get instant analysis with risk scoring and red flags detection
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Deposit Tracker</h3>
            <p className="text-blue-100">
              Monitor your security deposits with automatic reminders and return tracking
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Dispute Resolution</h3>
            <p className="text-blue-100">
              Expert support for rental disputes with professional case management
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Document Vault</h3>
            <p className="text-blue-100">
              Securely store all your rental documents, receipts, and evidence in one place
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold mb-4">Ready to protect your rights?</h2>
          <p className="text-blue-100 mb-6">
            Join thousands of renters who trust Lease Shield
          </p>
          <Link to={createPageUrl("Dashboard")}>
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}