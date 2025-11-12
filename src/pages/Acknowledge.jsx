
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Wrench, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Camera, 
  Image as ImageIcon,
  X,
  Send,
  Home,
  Building2
} from "lucide-react";
import { format } from "date-fns";
import ChatLog from "../components/maintenance/ChatLog";

export default function AcknowledgePage() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [maintenanceRequest, setMaintenanceRequest] = useState(null);
  
  const [statusUpdate, setStatusUpdate] = useState('');
  const [message, setMessage] = useState('');
  const [completionPhotos, setCompletionPhotos] = useState([]);
  const [completionPreviews, setCompletionPreviews] = useState([]);
  const [billPhotos, setBillPhotos] = useState([]);
  const [billPreviews, setBillPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null); // NEW: Debug info display

  // Parse URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    const roleParam = urlParams.get('role');
    
    if (!tokenParam || !roleParam) {
      setError('Invalid link. Missing token or role.');
      setLoading(false);
      return;
    }
    
    setToken(tokenParam);
    setRole(roleParam);
    loadMaintenanceRequest(tokenParam);
  }, []);

  const loadMaintenanceRequest = async (tokenParam) => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('acknowledgeMaintenance', {
        token: tokenParam,
        action: 'view'
      });

      if (response.data?.success && response.data?.maintenanceRequest) {
        setMaintenanceRequest(response.data.maintenanceRequest);
        setStatusUpdate(response.data.maintenanceRequest.status);
      } else {
        setError('Invalid or expired link.');
      }
    } catch (err) {
      console.error('Failed to load maintenance request:', err);
      setError('Failed to load maintenance request. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelection = (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (type === 'completion') {
      setCompletionPhotos(prev => [...prev, ...files]);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCompletionPreviews(prev => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });
    } else if (type === 'bill') {
      setBillPhotos(prev => [...prev, ...files]);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setBillPreviews(prev => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemovePhoto = (index, type) => {
    if (type === 'completion') {
      setCompletionPhotos(prev => prev.filter((_, i) => i !== index));
      setCompletionPreviews(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'bill') {
      setBillPhotos(prev => prev.filter((_, i) => i !== index));
      setBillPreviews(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!token || !message.trim()) {
      alert('Please enter a message');
      return;
    }

    setSubmitting(true);
    setDebugInfo(null); // Clear previous debug info
    
    try {
      // Upload photos if any
      let completionUrls = [];
      let billUrls = [];

      if (completionPhotos.length > 0 || billPhotos.length > 0) {
        setUploading(true);
        
        if (completionPhotos.length > 0) {
          const completionPromises = completionPhotos.map(file => 
            base44.integrations.Core.UploadFile({ file })
          );
          const completionResults = await Promise.all(completionPromises);
          completionUrls = completionResults.map(r => r.file_url);
        }

        if (billPhotos.length > 0) {
          const billPromises = billPhotos.map(file => 
            base44.integrations.Core.UploadFile({ file })
          );
          const billResults = await Promise.all(billPromises);
          billUrls = billResults.map(r => r.file_url);
        }
        
        setUploading(false);
      }

      console.log('📤 Submitting acknowledgment with:', {
        token,
        action: 'update',
        status: statusUpdate,
        message: message.substring(0, 50) + (message.length > 50 ? '...' : ''), // Truncate for log
        role,
        completionPhotoCount: completionUrls.length,
        billPhotoCount: billUrls.length
      });

      // Submit acknowledgment
      const response = await base44.functions.invoke('acknowledgeMaintenance', {
        token: token,
        action: 'update',
        status: statusUpdate,
        message: message,
        role: role,
        completionPhotoUrls: completionUrls,
        billPhotoUrls: billUrls
      });

      console.log('📥 Acknowledgment response:', response.data);

      if (response.data?.success) {
        // Show debug info
        setDebugInfo({
          lineSent: response.data.lineSent,
          emailSent: response.data.emailSent
        });

        const debugMsg = `✅ Update sent successfully!\n\n` +
          `📧 Email: ${response.data.emailSent ? '✅ SENT' : '❌ NOT SENT'}\n` +
          `📱 LINE: ${response.data.lineSent ? '✅ SENT' : '❌ NOT SENT'}\n\n` +
          `The tenant will be notified.\n\n` +
          `⚠️ Check function logs (Dashboard → Code → Functions → acknowledgeMaintenance) for details.`;
        
        alert(debugMsg);
        
        // Reload the request to show updated chat log
        await loadMaintenanceRequest(token);
        // Reset form
        setMessage('');
        setCompletionPhotos([]);
        setCompletionPreviews([]);
        setBillPhotos([]);
        setBillPreviews([]);
      } else {
        alert('❌ Failed to send update. Please try again.');
      }
    } catch (err) {
      console.error('Failed to submit:', err);
      alert('❌ An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'reported': return 'bg-blue-100 text-blue-800';
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const colors = {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
    inputBg: '#FFFFFF',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-lg" style={{ color: colors.textPrimary }}>Loading maintenance request...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <Card className="max-w-md w-full border-2 border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              Invalid Link
            </h2>
            <p style={{ color: colors.textSecondary }}>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!maintenanceRequest) {
    return null;
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 p-6 rounded-xl" style={{
          background: 'linear-gradient(to right, #0C3B2E, #047857)',
          color: 'white'
        }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {role === 'landlord' ? (
                <Home className="w-8 h-8 flex-shrink-0" />
              ) : (
                <Building2 className="w-8 h-8 flex-shrink-0" />
              )}
              <div>
                <h1 className="text-2xl font-bold mb-1">
                  🔧 Maintenance Request
                </h1>
                <p className="text-white/80 text-sm">
                  {role === 'landlord' ? 'Landlord Portal' : 'Juristic Portal'} - No login required
                </p>
              </div>
            </div>
            <Badge className={getStatusColor(maintenanceRequest.status)}>
              {maintenanceRequest.status}
            </Badge>
          </div>
        </div>

        {/* NEW: Debug Info Banner */}
        {debugInfo && (
          <div className="mb-4 p-4 rounded-lg border-2" style={{
            backgroundColor: debugInfo.lineSent ? '#D1FAE5' : '#FEF2F2',
            borderColor: debugInfo.lineSent ? '#10B981' : '#EF4444'
          }}>
            <div className="flex items-start gap-3">
              {debugInfo.lineSent ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1" style={{ 
                  color: debugInfo.lineSent ? '#065F46' : '#991B1B' 
                }}>
                  {debugInfo.lineSent ? '✅ Update Sent' : '⚠️ Partial Send (LINE failed)'}
                </p>
                <div className="text-xs space-y-1" style={{ 
                  color: debugInfo.lineSent ? '#047857' : '#DC2626' 
                }}>
                  <p>📧 Email: {debugInfo.emailSent ? '✅ Sent' : '❌ Failed'}</p>
                  <p>📱 LINE: {debugInfo.lineSent ? '✅ Sent' : '❌ Failed'}</p>
                  {!debugInfo.lineSent && (
                    <p className="mt-2 font-semibold">
                      ⚠️ Check function logs for details (Dashboard → Code → Functions → acknowledgeMaintenance)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Request Details */}
        <Card className="mb-6 border-none shadow-xl">
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle className="text-xl" style={{ color: colors.textPrimary }}>
              {maintenanceRequest.issue_title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>
                Description
              </p>
              <p style={{ color: colors.textPrimary }}>
                {maintenanceRequest.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>
                  Category
                </p>
                <p style={{ color: colors.textPrimary }}>
                  {maintenanceRequest.category}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>
                  Priority
                </p>
                <Badge className={
                  maintenanceRequest.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                  maintenanceRequest.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }>
                  {maintenanceRequest.priority}
                </Badge>
              </div>
            </div>

            {maintenanceRequest.property_address && (
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>
                  Property Address
                </p>
                <p style={{ color: colors.textPrimary }}>
                  {maintenanceRequest.property_address}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>
                Reported Date
              </p>
              <p style={{ color: colors.textPrimary }}>
                {format(new Date(maintenanceRequest.reported_date), 'MMMM d, yyyy')}
              </p>
            </div>

            {/* Tenant Photos */}
            {maintenanceRequest.photo_urls && maintenanceRequest.photo_urls.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                  Photos from Tenant
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {maintenanceRequest.photo_urls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Issue ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border-2 cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ borderColor: colors.borderColor }}
                      onClick={() => window.open(url, '_blank')}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Communication Log */}
            {maintenanceRequest.communication_log && maintenanceRequest.communication_log.length > 0 && (
              <div className="pt-4 border-t" style={{ borderColor: colors.borderColor }}>
                <ChatLog 
                  communicationLog={maintenanceRequest.communication_log}
                  language="en"
                  colors={colors}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Response Form */}
        <Card className="border-none shadow-xl">
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <Send className="w-5 h-5 text-orange-600" />
              Update & Respond
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Status Update */}
            <div>
              <Label className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                Update Status
              </Label>
              <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                <SelectTrigger style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reported">Reported</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Message */}
            <div>
              <Label className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                Message to Tenant *
              </Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="e.g., I've acknowledged your request. A repair technician will visit tomorrow at 2 PM."
                style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor }}
              />
            </div>

            {/* Completion Photos */}
            <div>
              <Label className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                Completion Photos (optional)
              </Label>
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handlePhotoSelection(e, 'completion')}
                      className="hidden"
                    />
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all hover:border-orange-600"
                      style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor }}
                    >
                      <Camera className="w-4 h-4" />
                      <span className="text-sm font-semibold">Add Photos</span>
                    </div>
                  </label>
                </div>

                {completionPreviews.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {completionPreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Completion ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg border-2"
                          style={{ borderColor: colors.borderColor }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index, 'completion')}
                          className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bill Photos */}
            <div>
              <Label className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                Bills/Receipts (optional)
              </Label>
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handlePhotoSelection(e, 'bill')}
                      className="hidden"
                    />
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all hover:border-orange-600"
                      style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor }}
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span className="text-sm font-semibold">Add Bills</span>
                    </div>
                  </label>
                </div>

                {billPreviews.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {billPreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Bill ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg border-2"
                          style={{ borderColor: colors.borderColor }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index, 'bill')}
                          className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={submitting || uploading || !message.trim()}
              className="w-full bg-orange-600 hover:bg-orange-700 py-6 text-lg font-bold"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Uploading photos...
                </>
              ) : submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending update...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Send Update to Tenant
                </>
              )}
            </Button>

            <p className="text-xs text-center" style={{ color: colors.textSecondary }}>
              The tenant will receive email {debugInfo?.lineSent !== false ? '+ LINE' : ''} notification with your update
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-xs" style={{ color: colors.textSecondary }}>
          <p>Powered by <strong>Lease Shield</strong> - www.leaseshield.asia</p>
        </div>
      </div>
    </div>
  );
}
