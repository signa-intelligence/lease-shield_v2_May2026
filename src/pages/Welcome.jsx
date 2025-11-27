import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Calendar, FolderLock, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Welcome() {
  const [showInstallModal, setShowInstallModal] = useState(false);
  const navigate = useNavigate();

  // Preserve query params (source, plan, etc.) for tracking
  const queryParams = window.location.search;

  const handleContinue = () => {
    navigate(`/login${queryParams}`);
  };

  const handleOpenApp = () => {
    setShowInstallModal(false);
    navigate(`/login${queryParams}`);
  };

  // Feature bullets
  const features = [
    {
      icon: Shield,
      title: "Deposit Shield",
      description: "Record your deposit, photos, and agreements."
    },
    {
      icon: Calendar,
      title: "Rent & Reminders",
      description: "Track due dates and never miss a payment."
    },
    {
      icon: FolderLock,
      title: "Evidence Vault",
      description: "Store move-in/out photos and case notes."
    }
  ];

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #F3F6F5 0%, #E8EDEC 100%)'
      }}
    >
      <Card className="w-full max-w-md border-none shadow-2xl">
        <CardContent className="p-6 sm:p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/8a29b56f1_LeaseShieldmainlogowobkg.png"
              alt="Lease Shield"
              className="h-16 w-auto"
            />
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-3" style={{ color: '#0C3B2E' }}>
            Welcome to Lease Shield
          </h1>

          {/* Subheading */}
          <p className="text-center text-gray-600 mb-8 text-sm sm:text-base leading-relaxed">
            Protect your rental deposit, track payments, and manage disputes in one secure app.
          </p>

          {/* Feature Bullets */}
          <div className="space-y-4 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#0C3B2E' }}
                >
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Primary Button */}
          <Button
            onClick={handleContinue}
            className="w-full mb-4"
            style={{
              backgroundColor: '#0C3B2E',
              color: '#FFFFFF',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              borderRadius: '12px',
              border: '2px solid #C7A338',
              boxShadow: '0 4px 12px rgba(12, 59, 46, 0.25)'
            }}
          >
            Continue to app
          </Button>

          {/* Secondary Link */}
          <button
            onClick={() => setShowInstallModal(true)}
            className="w-full text-center text-sm font-medium flex items-center justify-center gap-2"
            style={{ 
              color: '#0C3B2E', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            <Smartphone className="w-4 h-4" />
            How to install on your phone
          </button>
        </CardContent>
      </Card>

      {/* Install Instructions Modal */}
      {showInstallModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowInstallModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative modal-enter"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="p-6 sm:p-8">
              {/* Modal Title */}
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: '#0C3B2E' }}
                >
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold" style={{ color: '#0C3B2E' }}>
                  Install Lease Shield on your phone
                </h2>
              </div>

              {/* Instructions */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-gray-700">
                    1
                  </div>
                  <p className="text-gray-700">
                    Open <strong>app.leaseshield.asia</strong> in your mobile browser.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-gray-700">
                    2
                  </div>
                  <div className="text-gray-700">
                    <p className="mb-1">
                      <strong>iPhone:</strong> Tap <em>Share</em> → <em>Add to Home Screen</em>.
                    </p>
                    <p>
                      <strong>Android:</strong> Tap the menu (⋮) → <em>Install app</em> or <em>Add to Home Screen</em>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Open App Button */}
              <Button
                onClick={handleOpenApp}
                className="w-full"
                style={{
                  backgroundColor: '#0C3B2E',
                  color: '#FFFFFF',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '12px',
                  border: '2px solid #C7A338'
                }}
              >
                Open app
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}