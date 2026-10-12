import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/client';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  Send,
  MessageSquare,
  FileText,
  DollarSign,
  Star,
  Download,
  AlertCircle,
  HelpCircle,
  CornerDownRight,
  ArrowRight
} from 'lucide-react';

export default function ContractDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { stompClient, connected } = useSocket();

  const [contract, setContract] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [submitDeliverableModal, setSubmitDeliverableModal] = useState(null);
  const [deliverableFile, setDeliverableFile] = useState(null);
  const [deliverableUrl, setDeliverableUrl] = useState('');
  const [deliverableName, setDeliverableName] = useState('');

  const [revisionModal, setRevisionModal] = useState(null);
  const [revisionNote, setRevisionNote] = useState('');

  const [disputeModal, setDisputeModal] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');

  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const chatEndRef = useRef(null);

  const fetchContract = async () => {
    try {
      const res = await api.get(`/contracts/${id}`);
      setContract(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load contract');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/contracts/${id}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.warn('Could not load chat history:', err);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/contracts/${id}/reviews`);
      setReviews(res.data);
    } catch (err) {
      console.warn('Could not load reviews:', err);
    }
  };

  useEffect(() => {
    fetchContract();
    fetchMessages();
    fetchReviews();
  }, [id]);

  // STOMP WebSocket Live Chat subscription
  useEffect(() => {
    if (!stompClient || !connected || !id) return;

    const subscription = stompClient.subscribe(`/topic/contract/${id}`, (msg) => {
      try {
        const parsed = JSON.parse(msg.body);
        setMessages((prev) => [...prev, parsed]);
        // Also refresh contract status in case a milestone changed
        fetchContract();
      } catch (e) {
        console.error('Error parsing live message', e);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [stompClient, connected, id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await api.post(`/contracts/${id}/messages`, { content: newMessage.trim() });
      setNewMessage('');
    } catch (err) {
      setError('Failed to send message');
    }
  };

  // State Machine Actions
  const handleFundMilestone = async (milestoneId) => {
    setError('');
    setSuccess('');
    setActionLoading(true);
    try {
      await api.post(`/milestones/${milestoneId}/fund`);
      setSuccess('Milestone funded! Amount held securely in escrow.');
      fetchContract();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fund milestone');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartMilestone = async (milestoneId) => {
    setError('');
    setSuccess('');
    setActionLoading(true);
    try {
      await api.post(`/milestones/${milestoneId}/start`);
      setSuccess('Milestone status marked as In Progress.');
      fetchContract();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start milestone');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenSubmitModal = (m) => {
    setSubmitDeliverableModal(m);
    setDeliverableFile(null);
    setDeliverableUrl('');
    setDeliverableName('');
  };

  const handleSubmitDeliverable = async (e) => {
    e.preventDefault();
    if (!submitDeliverableModal) return;
    setError('');
    setSuccess('');
    setActionLoading(true);

    try {
      let finalUrl = deliverableUrl;
      let finalName = deliverableName || 'Deliverable File';

      if (deliverableFile) {
        const formData = new FormData();
        formData.append('file', deliverableFile);
        const uploadRes = await api.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        finalUrl = uploadRes.data.url;
        finalName = uploadRes.data.fileName;
      }

      if (!finalUrl) {
        setError('Please select a file to upload or enter a deliverable URL');
        setActionLoading(false);
        return;
      }

      await api.post(`/milestones/${submitDeliverableModal.id}/submit`, {
        fileName: finalName,
        url: finalUrl,
      });

      setSuccess('Deliverable submitted successfully for client review!');
      setSubmitDeliverableModal(null);
      fetchContract();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit deliverable');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveMilestone = async (milestoneId) => {
    if (!window.confirm('Are you sure you want to approve this milestone and release escrow funds to the freelancer?')) return;
    setError('');
    setSuccess('');
    setActionLoading(true);
    try {
      await api.post(`/milestones/${milestoneId}/approve`);
      setSuccess('Milestone approved! Escrow funds released to freelancer wallet.');
      fetchContract();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve milestone');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmRevision = async () => {
    if (!revisionModal || !revisionNote.trim()) return;
    setError('');
    setSuccess('');
    setActionLoading(true);
    try {
      await api.post(`/milestones/${revisionModal.id}/revision`, { note: revisionNote.trim() });
      setSuccess('Revision requested. The freelancer has been notified with your feedback.');
      setRevisionModal(null);
      setRevisionNote('');
      fetchContract();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request revision');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDispute = async () => {
    if (!disputeModal || !disputeReason.trim()) return;
    setError('');
    setSuccess('');
    setActionLoading(true);
    try {
      await api.post(`/milestones/${disputeModal.id}/disputes`, { reason: disputeReason.trim() });
      setSuccess('Dispute raised. Platform administrators have been notified to review and resolve.');
      setDisputeModal(null);
      setDisputeReason('');
      fetchContract();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to raise dispute');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    setError('');
    try {
      await api.post(`/contracts/${id}/reviews`, {
        rating: Number(rating),
        comment: reviewComment,
      });
      setSuccess('Thank you! Your review has been published.');
      setReviewComment('');
      fetchReviews();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Contract Not Found</h2>
        <Link to="/contracts" className="text-sm font-semibold text-brand-600 hover:underline">
          Return to Contracts
        </Link>
      </div>
    );
  }

  const isClient = user && user.id === contract.clientId;
  const isFreelancer = user && user.id === contract.freelancerId;
  const isAdmin = user && user.role === 'ADMIN';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Alerts */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Contract Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase ${
                contract.status === 'ACTIVE' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                contract.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                contract.status === 'DISPUTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                'bg-slate-100 text-slate-700'
              }`}>
                {contract.status}
              </span>
              <span className="text-xs text-slate-400">
                Created {new Date(contract.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {contract.jobTitle}
            </h1>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 pt-1">
              <span>Client: <strong className="text-slate-900">{contract.clientName}</strong></span>
              <span>Freelancer: <strong className="text-slate-900">{contract.freelancerName}</strong></span>
            </div>
          </div>

          <div className="bg-gradient-to-tr from-slate-900 to-brand-950 p-6 rounded-2xl text-white text-right shrink-0 shadow-lg">
            <span className="text-xs text-brand-300 font-semibold block uppercase tracking-wider">Total Contract Value</span>
            <span className="text-3xl font-black">${Number(contract.totalAmount || 0).toFixed(2)}</span>
            <span className="block text-[10px] text-slate-400 mt-0.5">Escrow protected</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Milestones Timeline + Live Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Milestone State Machine Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
              <span>Milestones & Escrow State Machine</span>
            </h2>
            <span className="text-xs text-slate-400">
              {contract.milestones?.length || 0} Milestones Total
            </span>
          </div>

          <div className="space-y-4">
            {contract.milestones?.map((m, index) => {
              const isFunded = m.status !== 'PENDING_FUNDING';
              const isFinished = m.status === 'RELEASED';
              const isDisputed = m.status === 'DISPUTED';

              return (
                <div
                  key={m.id}
                  className={`bg-white rounded-2xl border p-6 shadow-sm space-y-4 transition-all ${
                    m.status === 'RELEASED' ? 'border-emerald-200 bg-emerald-50/20' :
                    m.status === 'DISPUTED' ? 'border-rose-200 bg-rose-50/20' :
                    m.status === 'SUBMITTED' ? 'border-indigo-300 ring-2 ring-indigo-500/10' :
                    'border-slate-200/80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-base text-slate-900">{m.title}</h4>
                        {m.dueDate && (
                          <span className="text-[11px] text-slate-400">
                            Due: {new Date(m.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <span className="text-lg font-black text-slate-900">
                        ${Number(m.amount).toFixed(2)}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        m.status === 'RELEASED' ? 'bg-emerald-100 text-emerald-800' :
                        m.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                        m.status === 'SUBMITTED' ? 'bg-indigo-100 text-indigo-800' :
                        m.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        m.status === 'FUNDED' ? 'bg-amber-100 text-amber-800' :
                        m.status === 'REVISION_REQUESTED' ? 'bg-orange-100 text-orange-800' :
                        m.status === 'DISPUTED' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {m.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {m.description && (
                    <p className="text-xs text-slate-600 pl-10 leading-relaxed">
                      {m.description}
                    </p>
                  )}

                  {/* Revision note banner */}
                  {m.revisionNote && (
                    <div className="ml-10 p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-800 space-y-1">
                      <span className="font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                        Client Revision Feedback:
                      </span>
                      <p>{m.revisionNote}</p>
                    </div>
                  )}

                  {/* Deliverables list */}
                  {m.deliverables && m.deliverables.length > 0 && (
                    <div className="ml-10 space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        Submitted Deliverables:
                      </span>
                      <div className="space-y-1.5">
                        {m.deliverables.map((del, dIdx) => (
                          <div
                            key={dIdx}
                            className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs"
                          >
                            <span className="font-semibold text-slate-800 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-brand-600" />
                              {del.fileName}
                            </span>
                            <a
                              href={del.url}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons based on Role & State Machine */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 flex-wrap">
                    {/* CLIENT ACTIONS */}
                    {isClient && (
                      <>
                        {m.status === 'PENDING_FUNDING' && (
                          <button
                            onClick={() => handleFundMilestone(m.id)}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <DollarSign className="w-4 h-4" />
                            Fund Milestone (${Number(m.amount).toFixed(2)})
                          </button>
                        )}

                        {m.status === 'SUBMITTED' && (
                          <>
                            <button
                              onClick={() => { setRevisionModal(m); setRevisionNote(''); }}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs rounded-xl border border-orange-200 transition-colors flex items-center gap-1.5"
                            >
                              <CornerDownRight className="w-3.5 h-3.5" />
                              Request Revision
                            </button>

                            <button
                              onClick={() => handleApproveMilestone(m.id)}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Approve & Release Funds
                            </button>
                          </>
                        )}
                      </>
                    )}

                    {/* FREELANCER ACTIONS */}
                    {isFreelancer && (
                      <>
                        {(m.status === 'FUNDED' || m.status === 'REVISION_REQUESTED') && (
                          <button
                            onClick={() => handleStartMilestone(m.id)}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
                          >
                            <Clock className="w-4 h-4" />
                            Start Working
                          </button>
                        )}

                        {(m.status === 'IN_PROGRESS' || m.status === 'REVISION_REQUESTED' || m.status === 'FUNDED') && (
                          <button
                            onClick={() => handleOpenSubmitModal(m)}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5"
                          >
                            <Upload className="w-4 h-4" />
                            Submit Deliverables
                          </button>
                        )}
                      </>
                    )}

                    {/* DISPUTE ACTION (Either party for any funded milestone) */}
                    {(isClient || isFreelancer) && isFunded && !isFinished && !isDisputed && (
                      <button
                        onClick={() => { setDisputeModal(m); setDisputeReason(''); }}
                        disabled={actionLoading}
                        className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Raise Dispute
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Post-Completion Reviews Section */}
          {contract.status === 'COMPLETED' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="font-extrabold text-lg text-slate-900">Contract Reviews & Ratings</h3>
              </div>

              {/* Submit Review Form if not already reviewed */}
              {!reviews.some((r) => r.reviewerId === user.id) ? (
                <form onSubmit={handleSubmitReview} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <span className="text-xs font-bold text-slate-700 block">
                    Leave a review for your {isClient ? 'freelancer' : 'client'}
                  </span>

                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 focus:outline-none"
                      >
                        <Star className={`w-6 h-6 ${rating >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-2">{rating} Stars</span>
                  </div>

                  <textarea
                    required
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share feedback on communication, quality of delivery, and professional collaboration..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-brand-500"
                  />

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              ) : (
                <p className="text-xs text-emerald-600 font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  ✓ You have submitted your review for this contract.
                </p>
              )}

              {/* Reviews List */}
              {reviews.length > 0 && (
                <div className="divide-y divide-slate-100 pt-2">
                  {reviews.map((r) => (
                    <div key={r.id} className="py-3.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{r.reviewerName}</span>
                        <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{r.rating}.0</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Real-Time Contract Chat Panel */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col h-[750px] overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-600" />
              <h3 className="font-bold text-sm text-slate-900">Contract Live Chat</h3>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <span>{connected ? 'Live' : 'Connecting'}</span>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/20">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center p-6 text-xs text-slate-400">
                No chat messages yet. Use this channel for milestone communication.
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === user.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-slate-400 font-semibold mb-0.5 px-1">
                      {isMe ? 'You' : msg.senderName}
                    </span>
                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-brand-600 text-white rounded-br-none shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Message Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type message..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-md transition-colors disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Deliverable Upload Modal */}
      {submitDeliverableModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-lg text-slate-900">
                Submit Deliverable: {submitDeliverableModal.title}
              </h3>
              <button onClick={() => setSubmitDeliverableModal(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmitDeliverable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  Upload Deliverable File
                </label>
                <input
                  type="file"
                  onChange={(e) => setDeliverableFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                />
              </div>

              <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider">or</div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  Deliverable Web URL (GitHub / Figma / Preview)
                </label>
                <input
                  type="url"
                  value={deliverableUrl}
                  onChange={(e) => setDeliverableUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  Deliverable Label
                </label>
                <input
                  type="text"
                  value={deliverableName}
                  onChange={(e) => setDeliverableName(e.target.value)}
                  placeholder="e.g. Final Source Code v1.0"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubmitDeliverableModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Uploading...' : 'Submit Deliverable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {revisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-lg text-slate-900">Request Revisions</h3>
            <p className="text-xs text-slate-500">
              Provide feedback for milestone "{revisionModal.title}". The freelancer will make changes and resubmit.
            </p>

            <textarea
              required
              rows={4}
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="Explain required changes or adjustments..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRevisionModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!revisionNote.trim() || actionLoading}
                onClick={handleConfirmRevision}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
              >
                Submit Revision Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {disputeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-600 font-extrabold text-lg">
              <AlertTriangle className="w-5 h-5" />
              <span>Raise Milestone Dispute</span>
            </div>
            <p className="text-xs text-slate-600">
              This will pause payments on "{disputeModal.title}" and escalate the case to platform administration for review.
            </p>

            <textarea
              required
              rows={4}
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="State the reason for this dispute (e.g. unmet requirements, lack of communication)..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDisputeModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!disputeReason.trim() || actionLoading}
                onClick={handleConfirmDispute}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
              >
                Raise Formal Dispute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
