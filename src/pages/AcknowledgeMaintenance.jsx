import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, AlertTriangle, Wrench, Clock, MessageSquare, Camera, Receipt, X, ImageIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function AcknowledgeMaintenance() {
  const [loading, setLoading] = useState(true);
  const [maintenanceRequest, setMaintenanceRequest] = useState(null);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [newStatus, setNewStatus] = useState('acknowledged');
  const [landlordResponse, setLandlordResponse] = useState('');
  const [actualCost, setActualCost] = useState('');
  const [completionPhotos, setCompletionPhotos] = useState([]);
  const [billPhotos, setBillPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

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
        if (response.data.maintenanceRequest.status === 'reported') {
          setNewStatus('acknowledged');
        } else {
          setNewStatus(response.data.maintenanceRequest.status);
        }
        // Load existing photos if any
        setCompletionPhotos(response.data.maintenanceRequest.completion_photo_urls || []);
        setBillPhotos(response.data.maintenanceRequest.bill_photo_urls || []);
        setActualCost(response.data.maintenanceRequest.actual_cost?.toString() || '');
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

  const handlePhotoUpload = async (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingPhotos(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      
      const uploadResults = await Promise.all(uploadPromises);
      const photoUrls = uploadResults.map(result => result.file_url);
      
      if (type === 'completion') {
        setCompletionPhotos(prev => [...prev, ...photoUrls]);
      } else if (type === 'bill') {
        setBillPhotos(prev => [...prev, ...photoUrls]);
      }
    } catch (error) {
      console.error('Photo upload failed:', error);
      alert('Failed to upload photos. Please try again.');
    } finally {
      setUploadingPhotos(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (index, type) => {
    if (type === 'completion') {
      setCompletionPhotos(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'bill') {
      setBillPhotos(prev => prev.filter((_, i) => i !== index));
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
        landlordResponse: landlordResponse,
        actualCost: actualCost ? parseFloat(actualCost) : undefined,
        completionPhotoUrls: completionPhotos,
        billPhotoUrls: billPhotos
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
              {completionPhotos.length > 0 && (
                <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                  {completionPhotos.length} completion photo(s) uploaded
                </p>
              )}
              {billPhotos.length > 0 && (
                <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                  {billPhotos.length} bill photo(s) uploaded
                </p>
              )}
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
                  <p className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>Tenant Photos:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {maintenanceRequest.photo_urls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80"
                        style={{ border: `1px solid ${colors.borderColor}` }}
                        onClick={() => window.open(url, '_blank')}
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
              Update Status & Documentation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                  New Status:
                </Label>
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
                <Label className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  Response (Optional):
                </Label>
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

              <div>
                <Label className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                  <Receipt className="w-4 h-4 inline mr-1" />
                  Actual Cost (฿) (Optional):
                </Label>
                <Input
                  type="number"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                  placeholder="e.g., 500"
                  className="w-full p-3 border-2 rounded-lg"
                  style={{
                    backgroundColor: colors.cardBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                />
              </div>

              {/* Completion Photos */}
              <div>
                <Label className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                  <Camera className="w-4 h-4 inline mr-1" />
                  Completion Photos (Optional):
                </Label>
                <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>
                  Upload photos showing the completed repair
                </p>

                {completionPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {completionPhotos.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Completion ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                          style={{ border: `1px solid ${colors.borderColor}` }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index, 'completion')}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label
                  className="flex items-center justify-center gap-2 p-4 rounded-lg cursor-pointer transition-all border-2 border-dashed"
                  style={{
                    backgroundColor: '#F3F4F6',
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#0C3B2E';
                    e.currentTarget.style.backgroundColor = '#ECEFED';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.borderColor;
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handlePhotoUpload(e, 'completion')}
                    className="hidden"
                    disabled={uploadingPhotos}
                  />
                  {uploadingPhotos ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="font-medium">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5" />
                      <span className="font-medium">Add Completion Photos</span>
                    </>
                  )}
                </label>
              </div>

              {/* Bill Photos */}
              <div>
                <Label className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                  <Receipt className="w-4 h-4 inline mr-1" />
                  Bill/Receipt Photos (Optional):
                </Label>
                <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>
                  Upload photos of repair bills or receipts
                </p>

                {billPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {billPhotos.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Bill ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                          style={{ border: `1px solid ${colors.borderColor}` }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index, 'bill')}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label
                  className="flex items-center justify-center gap-2 p-4 rounded-lg cursor-pointer transition-all border-2 border-dashed"
                  style={{
                    backgroundColor: '#F3F4F6',
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#C7A338';
                    e.currentTarget.style.backgroundColor = '#ECEFED';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.borderColor;
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handlePhotoUpload(e, 'bill')}
                    className="hidden"
                    disabled={uploadingPhotos}
                  />
                  {uploadingPhotos ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="font-medium">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="w-5 h-5" />
                      <span className="font-medium">Add Bill Photos</span>
                    </>
                  )}
                </label>
              </div>

              <Button
                onClick={handleUpdate}
                disabled={updating || uploadingPhotos}
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
                    Update Status & Notify Tenant
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