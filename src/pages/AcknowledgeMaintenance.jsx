import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, AlertTriangle, Wrench, Clock, MessageSquare } from "lucide-react";

export default function AcknowledgeMaintenance() {
  const [loading, setLoading] = useState(true);
  const [maintenanceRequest, setMaintenanceRequest] = useState(null);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [newStatus, setNewStatus] = useState('acknowledged');
  const [landlordResponse, setLandlordResponse] = useState('');

  useEffect(() => {
    loadMaintenanceRequest();
  }, []);

  const loadMaintenanceRequest = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        setError('Invalid or missing token');
        setLoading(false);
        return;
      }

      const response = await base44.functions.invoke('acknowledgeMaintenance', {
        token: token,
        action: 'get'
      });

      if (response.data?.maintenanceRequest) {
        setMaintenanceRequest(response.data.maintenanceRequest);
        // Set initial status based on current status
        if (response.data.maintenanceRequest.status === 'reported') {
          setNewStatus('acknowledged');
        } else {
          setNewStatus(response.data.maintenanceRequest.status);
        }
      } else {
        setError('Maintenance request not found');
      }
    } catch (err) {
      console.error('Failed to load maintenance request:', err);
      setError(err.message || 'Failed to load request');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      const response = await base44.functions.invoke('acknowledgeMaintenance', {
        token: token,
        action: 'update',
        status: newStatus,
        landlordResponse: landlordResponse
      });

      if (response.data?.success) {
        setSuccess(true);
      } else {
        setError('Failed to update status');
      }
    } catch (err) {
      console.error('Failed to update:', err);
      setError(err.message || 'Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  const colors = {
    bg: '#ECEFED',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-ls-forest" />
          <p className="text-lg" style={{ color: colors.textSecondary }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: colors.bg }}>
        <Card className="max-w-md w-full border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>Error</h2>
            <p style={{ color: colors.textSecondary }}>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: colors.bg }}>
        <Card className="max-w-md w-full border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              Update Successful!
            </h2>
            <p className="mb-6" style={{ color: colors.textSecondary }}>
              The tenant has been notified of the status change.
            </p>
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#F3F4F6' }}>
              <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                Status: <span className="text-ls-forest">{newStatus.toUpperCase()}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Wrench className="w-8 h-8 text-ls-forest" />
            <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
              Maintenance Request
            </h1>
          </div>
          <p style={{ color: colors.textSecondary }}>Update the status of this request</p>
        </div>

        <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle className="text-xl" style={{ color: colors.textPrimary }}>
              {maintenanceRequest?.issue_title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>Description:</p>
                <p style={{ color: colors.textPrimary }}>{maintenanceRequest?.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>Category:</p>
                  <p style={{ color: colors.textPrimary }}>{maintenanceRequest?.category}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>Priority:</p>
                  <p style={{ color: colors.textPrimary }} className="capitalize">{maintenanceRequest?.priority}</p>
                </div>
              </div>

              {maintenanceRequest?.property_address && (
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>Property:</p>
                  <p style={{ color: colors.textPrimary }}>{maintenanceRequest.property_address}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>Reported:</p>
                <p style={{ color: colors.textPrimary }}>
                  {maintenanceRequest?.reported_date && new Date(maintenanceRequest.reported_date).toLocaleDateString()}
                </p>
              </div>

              {maintenanceRequest?.photo_urls && maintenanceRequest.photo_urls.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>Photos:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {maintenanceRequest.photo_urls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                        style={{ border: `1px solid ${colors.borderColor}` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <Clock className="w-5 h-5 text-ls-gold" />
              Update Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                  New Status:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-3 border-2 rounded-lg"
                  style={{
                    backgroundColor: colors.cardBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                >
                  <option value="acknowledged">Acknowledged</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  Response (Optional):
                </label>
                <Textarea
                  value={landlordResponse}
                  onChange={(e) => setLandlordResponse(e.target.value)}
                  placeholder="Add a note or estimated completion time..."
                  rows={4}
                  className="w-full p-3 border-2 rounded-lg"
                  style={{
                    backgroundColor: colors.cardBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                />
              </div>

              <Button
                onClick={handleUpdate}
                disabled={updating}
                className="w-full bg-ls-forest hover:bg-ls-forest/90 text-white py-3 text-lg font-bold"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Update Status
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}