
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Clock, 
  Wrench, 
  Home, 
  AlertCircle, 
  Loader2,
  Camera,
  Upload,
  X,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";

export default function AcknowledgeMaintenance() {
  const [newStatus, setNewStatus] = useState('acknowledged');
  const [landlordResponse, setLandlordResponse] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [actualCost, setActualCost] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCompletionPhotos, setUploadingCompletionPhotos] = useState(false);
  const [uploadingBillPhotos, setUploadingBillPhotos] = useState(false);
  const [completionPhotos, setCompletionPhotos] = useState([]);
  const [billPhotos, setBillPhotos] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [senderName, setSenderName] = useState('');

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  const { data: maintenanceRequests = [], isLoading } = useQuery({
    queryKey: ['maintenanceByToken', token],
    queryFn: async () => {
      const requests = await base44.entities.MaintenanceRequest.list();
      return requests.filter(r => r.acknowledgment_token === token);
    },
    enabled: !!token,
  });

  const request = maintenanceRequests[0];

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MaintenanceRequest.update(id, data),
  });

  const handleCompletionPhotosUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingCompletionPhotos(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      
      const uploadResults = await Promise.all(uploadPromises);
      const photoUrls = uploadResults.map(result => result.file_url);
      
      setCompletionPhotos(prev => [...prev, ...photoUrls]);
    } catch (error) {
      console.error('Photo upload failed:', error);
      alert('Failed to upload photos. Please try again.');
    } finally {
      setUploadingCompletionPhotos(false);
      e.target.value = '';
    }
  };

  const handleBillPhotosUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingBillPhotos(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      
      const uploadResults = await Promise.all(uploadPromises);
      const photoUrls = uploadResults.map(result => result.file_url);
      
      setBillPhotos(prev => [...prev, ...photoUrls]);
    } catch (error) {
      console.error('Bill upload failed:', error);
      alert('Failed to upload bills. Please try again.');
    } finally {
      setUploadingBillPhotos(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!request) return;

    setSubmitting(true);
    try {
      const updateData = {
        status: newStatus,
        estimated_cost: estimatedCost ? parseFloat(estimatedCost) : undefined,
        actual_cost: actualCost ? parseFloat(actualCost) : undefined,
        acknowledged_date: new Date().toISOString()
      };

      if (newStatus === 'completed') {
        updateData.resolved_date = new Date().toISOString().split('T')[0];
      }

      if (completionPhotos.length > 0) {
        updateData.completion_photo_urls = [...(request.completion_photo_urls || []), ...completionPhotos];
      }

      if (billPhotos.length > 0) {
        updateData.bill_photo_urls = [...(request.bill_photo_urls || []), ...billPhotos];
      }

      // Add message to communication log instead of overwriting landlord_response
      if (landlordResponse.trim()) {
        const communicationLog = request.communication_log ? [...request.communication_log] : [];
        communicationLog.push({
          date: new Date().toISOString(),
          message: landlordResponse.trim(),
          sender: senderName.trim() || 'Landlord/Juristic'
        });
        updateData.communication_log = communicationLog;
      }

      await updateRequestMutation.mutateAsync({
        id: request.id,
        data: updateData
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Failed to update:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading maintenance request...</p>
        </div>
      </div>
    );
  }

  if (!token || !request) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-gray-900">Invalid Link</h2>
            <p className="text-gray-600">
              This maintenance request link is invalid or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50 p-4">
        <Card className="max-w-md w-full border-none shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">
              {newStatus === 'completed' ? 'Work Completed!' : 'Status Updated!'}
            </h2>
            <p className="text-gray-600 mb-4">
              The tenant has been notified of the update.
            </p>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Status:</strong> {newStatus === 'acknowledged' ? 'Acknowledged' : newStatus === 'in_progress' ? 'In Progress' : 'Completed'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-amber-100 text-amber-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-3xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Maintenance Request</h1>
          <p className="text-gray-600">Review and update the status</p>
        </div>

        {/* Request Details Card */}
        <Card className="mb-6 border-none shadow-xl">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white">
            <CardTitle className="flex items-center justify-between">
              <span>{request.issue_title}</span>
              <Badge className={`${getPriorityColor(request.priority)} border-white`}>
                {request.priority.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Description</p>
                <p className="text-gray-900">{request.description}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Category</p>
                  <p className="text-gray-900 capitalize">{request.category.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Reported Date</p>
                  <p className="text-gray-900">{format(new Date(request.reported_date), 'MMM d, yyyy')}</p>
                </div>
              </div>

              {request.property_address && (
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Property Address
                  </p>
                  <p className="text-gray-900">{request.property_address}</p>
                </div>
              )}

              {request.photo_urls && request.photo_urls.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Photos of Issue</p>
                  <div className="grid grid-cols-3 gap-2">
                    {request.photo_urls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Issue ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(url, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Show Communication Log */}
              {request.communication_log && request.communication_log.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-600 mb-3">Communication History</p>
                  <div className="space-y-3">
                    {request.communication_log.map((msg, index) => (
                      <div key={index} className="p-3 rounded-lg bg-blue-50 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-blue-900">{msg.sender}</p>
                          <p className="text-xs text-blue-600">
                            {format(new Date(msg.date), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                        <p className="text-sm text-gray-700">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Update Form */}
        <Card className="border-none shadow-xl">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Update Request Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sender Name Input */}
              <div>
                <Label htmlFor="senderName">Your Name</Label>
                <input
                  id="senderName"
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g., Landlord, Juristic Office, Property Manager..."
                  className="mt-2 w-full p-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">This will identify you in the communication history</p>
              </div>

              {/* Status Selection */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Select Status</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewStatus('acknowledged')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      newStatus === 'acknowledged'
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <CheckCircle2 className={`w-8 h-8 mx-auto mb-2 ${
                      newStatus === 'acknowledged' ? 'text-purple-600' : 'text-gray-400'
                    }`} />
                    <p className={`font-semibold text-sm ${
                      newStatus === 'acknowledged' ? 'text-purple-900' : 'text-gray-700'
                    }`}>
                      Acknowledged
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Received the request</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStatus('in_progress')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      newStatus === 'in_progress'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <Clock className={`w-8 h-8 mx-auto mb-2 ${
                      newStatus === 'in_progress' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <p className={`font-semibold text-sm ${
                      newStatus === 'in_progress' ? 'text-blue-900' : 'text-gray-700'
                    }`}>
                      In Progress
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Working on repair</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStatus('completed')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      newStatus === 'completed'
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <Wrench className={`w-8 h-8 mx-auto mb-2 ${
                      newStatus === 'completed' ? 'text-emerald-600' : 'text-gray-400'
                    }`} />
                    <p className={`font-semibold text-sm ${
                      newStatus === 'completed' ? 'text-emerald-900' : 'text-gray-700'
                    }`}>
                      Completed
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Repair finished</p>
                  </button>
                </div>
              </div>

              {/* Response Message */}
              <div>
                <Label htmlFor="response">Your Message (Optional)</Label>
                <Textarea
                  id="response"
                  value={landlordResponse}
                  onChange={(e) => setLandlordResponse(e.target.value)}
                  placeholder="Add notes, timeline, or updates for the tenant..."
                  rows={4}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">This message will be added to the communication log</p>
              </div>

              {/* Cost Estimates */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estCost" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                    Estimated Cost (฿)
                  </Label>
                  <input
                    id="estCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    placeholder="0.00"
                    className="mt-2 w-full p-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <Label htmlFor="actualCost" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Actual Cost (฿)
                  </Label>
                  <input
                    id="actualCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={actualCost}
                    onChange={(e) => setActualCost(e.target.value)}
                    placeholder="0.00"
                    className="mt-2 w-full p-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Completion Photos Upload */}
              {newStatus === 'completed' && (
                <div>
                  <Label className="mb-3 block">Completion Photos (Optional)</Label>
                  <p className="text-xs text-gray-600 mb-3">Upload photos showing the completed repair work</p>
                  
                  {completionPhotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {completionPhotos.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Completion ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border-2 border-emerald-200"
                          />
                          <button
                            type="button"
                            onClick={() => setCompletionPhotos(prev => prev.filter((_, i) => i !== index))}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        onChange={handleCompletionPhotosUpload}
                        className="hidden"
                        disabled={uploadingCompletionPhotos}
                      />
                      {uploadingCompletionPhotos ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm font-medium">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          <span className="text-sm font-medium">Take Photo</span>
                        </>
                      )}
                    </label>
                    <label className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleCompletionPhotosUpload}
                        className="hidden"
                        disabled={uploadingCompletionPhotos}
                      />
                      {uploadingCompletionPhotos ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm font-medium">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span className="text-sm font-medium">Upload</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {/* Bill Photos Upload */}
              {(newStatus === 'completed' || newStatus === 'in_progress') && (
                <div>
                  <Label className="mb-3 block">Bills/Receipts (Optional)</Label>
                  <p className="text-xs text-gray-600 mb-3">Upload photos of receipts or invoices</p>
                  
                  {billPhotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {billPhotos.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Bill ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border-2 border-amber-200"
                          />
                          <button
                            type="button"
                            onClick={() => setBillPhotos(prev => prev.filter((_, i) => i !== index))}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-amber-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        onChange={handleBillPhotosUpload}
                        className="hidden"
                        disabled={uploadingBillPhotos}
                      />
                      {uploadingBillPhotos ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm font-medium">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          <span className="text-sm font-medium">Take Photo</span>
                        </>
                      )}
                    </label>
                    <label className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-amber-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleBillPhotosUpload}
                        className="hidden"
                        disabled={uploadingBillPhotos}
                      />
                      {uploadingBillPhotos ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm font-medium">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span className="text-sm font-medium">Upload</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 py-6 text-lg font-bold shadow-lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Submit Update
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            Powered by <strong>Lease Shield</strong> - www.leaseshield.asia
          </p>
        </div>
      </div>
    </div>
  );
}
