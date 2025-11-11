
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, AlertTriangle, Wrench, Clock, MessageSquare, Camera, Receipt, X, ImageIcon, User, Send, Image } from "lucide-react";
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
  const [chatMessage, setChatMessage] = useState('');
  const [chatPhotos, setChatPhotos] = useState([]);
  const [sendingChat, setSendingChat] = useState(false);

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
      console.error('Photo/video upload failed:', error);
      alert('Failed to upload files. Please try again.');
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

  const handleChatPhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingPhotos(true); // Reusing this state for both types of uploads
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      
      const uploadResults = await Promise.all(uploadPromises);
      const photoUrls = uploadResults.map(result => result.file_url);
      
      setChatPhotos(prev => [...prev, ...photoUrls]);
    } catch (error) {
      console.error('Chat media upload failed:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploadingPhotos(false);
      e.target.value = ''; // Clear input field
    }
  };

  const handleRemoveChatPhoto = (index) => {
    setChatPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendChatMessage = async () => {
    if (!chatMessage.trim() && chatPhotos.length === 0) return;

    setSendingChat(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      const response = await base44.functions.invoke('addMaintenanceComment', {
        maintenanceId: maintenanceRequest.id,
        message: chatMessage.trim() || '[Photo sent]',
        photoUrls: chatPhotos,
        senderType: 'Landlord/Juristic',
        token: token
      });

      if (response.data?.success) {
        // Reload maintenance request to show new message
        await loadMaintenanceRequest();
        setChatMessage('');
        setChatPhotos([]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingChat(false);
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

        {/* Communication History Card */}
        {maintenanceRequest?.communication_log && (
          <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
            <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
              <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <MessageSquare className="w-5 h-5 text-ls-forest" />
                Communication History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {maintenanceRequest.communication_log.length > 0 && (
                <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                  {maintenanceRequest.communication_log.map((entry, index) => {
                    const isTenant = entry.sender?.toLowerCase().includes('tenant');
                    
                    return (
                      <div
                        key={index}
                        className="p-4 rounded-lg border-l-4"
                        style={{
                          backgroundColor: isTenant ? '#EFF6FF' : '#FEF3C7',
                          borderLeftColor: isTenant ? '#3B82F6' : '#F59E0B'
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" style={{ color: isTenant ? '#3B82F6' : '#F59E0B' }} />
                            <span className="font-bold text-sm" style={{ color: colors.textPrimary }}>
                              {entry.sender}
                            </span>
                          </div>
                          <span className="text-xs" style={{ color: colors.textSecondary }}>
                            {new Date(entry.date).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: colors.textPrimary }}>
                          {entry.message}
                        </p>
                        {entry.photo_urls && entry.photo_urls.length > 0 && (
                          <div className="grid grid-cols-3 gap-1 mt-2">
                            {entry.photo_urls.map((url, photoIndex) => {
                              const isVideo = url.match(/\.(mp4|mov|avi|webm)$/i);
                              return isVideo ? (
                                <video
                                  key={photoIndex}
                                  src={url}
                                  className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-80"
                                  onClick={() => window.open(url, '_blank')}
                                  controls
                                />
                              ) : (
                                <img
                                  key={photoIndex}
                                  src={url}
                                  alt={`Media ${photoIndex + 1}`}
                                  className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-80"
                                  onClick={() => window.open(url, '_blank')}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Chat Input Area with Working Camera */}
              <div className="border-t pt-4" style={{ borderColor: colors.borderColor }}>
                {/* Photo/Video Preview */}
                {chatPhotos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {chatPhotos.map((url, index) => {
                      const isVideo = url.match(/\.(mp4|mov|avi|webm)$/i);
                      return (
                        <div key={index} className="relative group">
                          {isVideo ? (
                            <video
                              src={url}
                              className="w-full h-16 object-cover rounded"
                              controls={false}
                            />
                          ) : (
                            <img
                              src={url}
                              alt={`Attachment ${index + 1}`}
                              className="w-full h-16 object-cover rounded"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveChatPhoto(index)}
                            className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ transform: 'translate(25%, -25%)' }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex gap-2 items-center">
                  {/* Take Photo/Video Button - capture="user" */}
                  <label
                    className="flex-shrink-0 cursor-pointer"
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      backgroundColor: uploadingPhotos ? colors.borderColor : colors.cardBg,
                      border: `2px solid ${colors.borderColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*,video/*"
                      capture="user"
                      multiple
                      onChange={handleChatPhotoUpload}
                      className="hidden"
                      disabled={uploadingPhotos}
                    />
                    {uploadingPhotos ? (
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: colors.textSecondary }} />
                    ) : (
                      <Camera className="w-5 h-5" style={{ color: colors.textPrimary }} />
                    )}
                  </label>

                  {/* Upload from Gallery Button - NO capture */}
                  <label
                    className="flex-shrink-0 cursor-pointer"
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      backgroundColor: uploadingPhotos ? colors.borderColor : colors.cardBg,
                      border: `2px solid ${colors.borderColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleChatPhotoUpload}
                      className="hidden"
                      disabled={uploadingPhotos}
                    />
                    {uploadingPhotos ? (
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: colors.textSecondary }} />
                    ) : (
                      <Image className="w-5 h-5" style={{ color: colors.textPrimary }} />
                    )}
                  </label>

                  {/* Message Input */}
                  <Input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChatMessage();
                      }
                    }}
                    className="flex-1 p-3 border-2 rounded-lg"
                    style={{
                      backgroundColor: colors.cardBg,
                      borderColor: colors.borderColor,
                      color: colors.textPrimary
                    }}
                  />

                  {/* Send Button */}
                  <Button
                    onClick={handleSendChatMessage}
                    disabled={sendingChat || (!chatMessage.trim() && chatPhotos.length === 0)}
                    className="bg-ls-forest hover:bg-ls-forest/90 text-white p-3 h-auto"
                    style={{
                      opacity: (sendingChat || (!chatMessage.trim() && chatPhotos.length === 0)) ? 0.5 : 1
                    }}
                  >
                    {sendingChat ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Update Status Card */}
        <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
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

              {/* Completion Photos/Videos with Working Camera */}
              <div>
                <Label className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                  <Camera className="w-4 h-4 inline mr-1" />
                  Completion Photos/Videos (Optional):
                </Label>
                <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>
                  Upload photos or videos showing the completed repair
                </p>

                {completionPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {completionPhotos.map((url, index) => {
                      const isVideo = url.match(/\.(mp4|mov|avi|webm)$/i);
                      return (
                        <div key={index} className="relative group">
                          {isVideo ? (
                            <video
                              src={url}
                              className="w-full h-24 object-cover rounded-lg"
                              style={{ border: `1px solid ${colors.borderColor}` }}
                              controls
                            />
                          ) : (
                            <img
                              src={url}
                              alt={`Completion ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                              style={{ border: `1px solid ${colors.borderColor}` }}
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index, 'completion')}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {/* Take Photo/Video - capture="user" */}
                  <label
                    className="flex items-center justify-center gap-2 p-3 rounded-lg cursor-pointer transition-all border-2"
                    style={{
                      backgroundColor: '#F3F4F6',
                      borderColor: colors.borderColor,
                      color: colors.textPrimary
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*,video/*"
                      capture="user"
                      multiple
                      onChange={(e) => handlePhotoUpload(e, 'completion')}
                      className="hidden"
                      disabled={uploadingPhotos}
                    />
                    {uploadingPhotos ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="font-medium text-sm">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-5 h-5" />
                        <span className="font-medium text-sm">Take Photo/Video</span>
                      </>
                    )}
                  </label>

                  {/* Upload from Gallery - NO capture */}
                  <label
                    className="flex items-center justify-center gap-2 p-3 rounded-lg cursor-pointer transition-all border-2"
                    style={{
                      backgroundColor: '#F3F4F6',
                      borderColor: colors.borderColor,
                      color: colors.textPrimary
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={(e) => handlePhotoUpload(e, 'completion')}
                      className="hidden"
                      disabled={uploadingPhotos}
                    />
                    {uploadingPhotos ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="font-medium text-sm">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Image className="w-5 h-5" />
                        <span className="font-medium text-sm">From Gallery</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Bill Photos/Videos with Working Camera */}
              <div>
                <Label className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                  <Receipt className="w-4 h-4 inline mr-1" />
                  Bill/Receipt Photos/Videos (Optional):
                </Label>
                <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>
                  Upload photos or videos of repair bills or receipts
                </p>

                {billPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {billPhotos.map((url, index) => {
                      const isVideo = url.match(/\.(mp4|mov|avi|webm)$/i);
                      return (
                        <div key={index} className="relative group">
                          {isVideo ? (
                            <video
                              src={url}
                              className="w-full h-24 object-cover rounded-lg"
                              style={{ border: `1px solid ${colors.borderColor}` }}
                              controls
                            />
                          ) : (
                            <img
                              src={url}
                              alt={`Bill ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                              style={{ border: `1px solid ${colors.borderColor}` }}
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index, 'bill')}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {/* Take Photo/Video - capture="user" */}
                  <label
                    className="flex items-center justify-center gap-2 p-3 rounded-lg cursor-pointer transition-all border-2"
                    style={{
                      backgroundColor: '#F3F4F6',
                      borderColor: colors.borderColor,
                      color: colors.textPrimary
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*,video/*"
                      capture="user"
                      multiple
                      onChange={(e) => handlePhotoUpload(e, 'bill')}
                      className="hidden"
                      disabled={uploadingPhotos}
                    />
                    {uploadingPhotos ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="font-medium text-sm">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-5 h-5" />
                        <span className="font-medium text-sm">Take Photo/Video</span>
                      </>
                    )}
                  </label>

                  {/* Upload from Gallery - NO capture */}
                  <label
                    className="flex items-center justify-center gap-2 p-3 rounded-lg cursor-pointer transition-all border-2"
                    style={{
                      backgroundColor: '#F3F4F6',
                      borderColor: colors.borderColor,
                      color: colors.textPrimary
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={(e) => handlePhotoUpload(e, 'bill')}
                      className="hidden"
                      disabled={uploadingPhotos}
                    />
                    {uploadingPhotos ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="font-medium text-sm">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Image className="w-5 h-5" />
                        <span className="font-medium text-sm">From Gallery</span>
                      </>
                    )}
                  </label>
                </div>
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
