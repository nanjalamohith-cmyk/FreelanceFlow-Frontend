import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  Briefcase,
  DollarSign,
  Calendar,
  Clock,
  User,
  Star,
  CheckCircle2,
  Send,
  AlertCircle,
  ShieldCheck,
  Plus,
  Trash2,
  ArrowRight
} from 'lucide-react';

export default function JobDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Freelancer bid submission state
  const [bidAmount, setBidAmount] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('7');
  const [proposal, setProposal] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);

  // Client accept bid modal state
  const [selectedBidForAccept, setSelectedBidForAccept] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [acceptingBid, setAcceptingBid] = useState(false);

  const fetchJobData = async () => {
    try {
      const res = await api.get(`/jobs/${id}`);
      setJob(res.data);
      if (!bidAmount && res.data.budget) {
        setBidAmount(res.data.budget);
      }

      // If user is client and owner of job, fetch bids
      if (user && (user.id === res.data.clientId || user.role === 'ADMIN')) {
        const bidsRes = await api.get(`/jobs/${id}/bids`);
        setBids(bidsRes.data);
      }
    } catch (err) {
      setError('Could not load job details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobData();
  }, [id, user]);

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmittingBid(true);

    try {
      await api.post(`/jobs/${id}/bids`, {
        amount: Number(bidAmount),
        deliveryDays: Number(deliveryDays),
        proposal,
      });
      setSuccess('Bid submitted successfully! The client has been notified.');
      setProposal('');
      fetchJobData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit bid');
    } finally {
      setSubmittingBid(false);
    }
  };

  const openAcceptModal = (bid) => {
    setSelectedBidForAccept(bid);
    // Initialize default milestone with full bid amount
    setMilestones([
      {
        title: 'Milestone 1: Project Delivery & Acceptance',
        description: 'Complete all requirements according to proposal specifications',
        amount: Number(bid.amount),
        dueDate: new Date(Date.now() + (bid.deliveryDays || 7) * 86400000).toISOString().split('T')[0],
        order: 1,
      },
    ]);
  };

  const handleAddMilestone = () => {
    setMilestones([
      ...milestones,
      {
        title: `Milestone ${milestones.length + 1}`,
        description: '',
        amount: 0,
        dueDate: '',
        order: milestones.length + 1,
      },
    ]);
  };

  const handleRemoveMilestone = (index) => {
    if (milestones.length <= 1) return;
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index, field, value) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const handleConfirmAcceptBid = async () => {
    if (!selectedBidForAccept) return;
    setError('');

    // Check sum
    const totalMilestoneSum = milestones.reduce((sum, m) => sum + Number(m.amount || 0), 0);
    if (Math.abs(totalMilestoneSum - Number(selectedBidForAccept.amount)) > 0.01) {
      setError(`Milestones sum ($${totalMilestoneSum.toFixed(2)}) must exactly equal the bid amount ($${Number(selectedBidForAccept.amount).toFixed(2)})`);
      return;
    }

    setAcceptingBid(true);
    try {
      const payload = {
        milestones: milestones.map((m, idx) => ({
          title: m.title,
          description: m.description,
          amount: Number(m.amount),
          dueDate: m.dueDate ? new Date(m.dueDate).toISOString() : null,
          order: idx + 1,
        })),
      };

      const res = await api.post(`/contracts/accept-bid/${id}/${selectedBidForAccept.id}`, payload);
      navigate(`/contracts/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept bid');
      setAcceptingBid(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Job Not Found</h2>
        <Link to="/jobs" className="text-sm font-semibold text-brand-600 hover:underline">
          Return to Browse Jobs
        </Link>
      </div>
    );
  }

  const isOwner = user && user.id === job.clientId;
  const isFreelancer = user && user.role === 'FREELANCER';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Messages */}
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

      {/* Job Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase ${
                job.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                job.status === 'IN_CONTRACT' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
                {job.status}
              </span>
              <span className="text-xs text-slate-500">
                Posted {new Date(job.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {job.title}
            </h1>
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Client: <span className="text-slate-800">{job.clientName}</span>
            </p>
          </div>

          <div className="bg-gradient-to-tr from-slate-900 to-brand-950 p-6 rounded-2xl text-white text-right shrink-0 shadow-lg">
            <span className="text-xs text-brand-300 font-semibold block uppercase tracking-wider">Fixed Budget</span>
            <span className="text-3xl font-black">${Number(job.budget || 0).toFixed(2)}</span>
            <span className="block text-[10px] text-slate-400 mt-0.5">Escrow protected</span>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Project Description</h3>
          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
            {job.description}
          </p>
        </div>

        {/* Required Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-brand-50 text-brand-700 border border-brand-100 rounded-lg text-xs font-bold"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Freelancer Bid Form Section */}
      {isFreelancer && job.status === 'OPEN' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Place Your Bid & Proposal</h2>
              <p className="text-xs text-slate-500">Provide your price, timeline, and delivery approach</p>
            </div>
          </div>

          <form onSubmit={handlePlaceBid} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Bid Amount ($)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="500.00"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Estimated Delivery (Days)
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    required
                    min="1"
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(e.target.value)}
                    placeholder="7"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Proposal & Pitch
              </label>
              <textarea
                required
                rows={4}
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
                placeholder="Explain why you're a great fit for this job, relevant experience, and deliverables breakdown..."
                className="w-full p-4 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={submittingBid}
              className="py-3 px-6 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 text-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submittingBid ? 'Submitting Proposal...' : 'Submit Proposal'}
            </button>
          </form>
        </div>
      )}

      {/* Client View of Bids Received */}
      {isOwner && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Received Proposals ({bids.length})</h2>
              <p className="text-xs text-slate-500">Compare freelancer proposals and accept the winner to create an escrow contract</p>
            </div>
          </div>

          {bids.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No bids received yet. Interested freelancers will submit proposals soon.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {bids.map((bid) => (
                <div key={bid.id} className="py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-slate-900 text-base">{bid.freelancerName}</h4>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{bid.freelancerRatingAvg ? bid.freelancerRatingAvg.toFixed(1) : '5.0'}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        bid.status === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                        bid.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {bid.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {bid.proposal}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold pt-1">
                      <span>Delivery: <strong className="text-slate-800">{bid.deliveryDays} days</strong></span>
                      <span>Submitted: {new Date(bid.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <span className="text-2xl font-black text-slate-900">${Number(bid.amount || 0).toFixed(2)}</span>
                    {job.status === 'OPEN' && bid.status === 'PENDING' && (
                      <button
                        onClick={() => openAcceptModal(bid)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Accept Bid & Create Milestones
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Accept Bid & Define Milestones Modal */}
      {selectedBidForAccept && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Define Escrow Milestones</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Contract Total: <strong className="text-slate-900 font-bold">${Number(selectedBidForAccept.amount).toFixed(2)}</strong> for {selectedBidForAccept.freelancerName}
                </p>
              </div>
              <button
                onClick={() => setSelectedBidForAccept(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {milestones.map((m, index) => (
                <div key={index} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-brand-700">
                      Milestone #{index + 1}
                    </span>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(index)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Title</label>
                      <input
                        type="text"
                        value={m.title}
                        onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                        placeholder="e.g. Design Wireframes"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Amount ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={m.amount}
                        onChange={(e) => updateMilestone(index, 'amount', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={m.dueDate}
                      onChange={(e) => updateMilestone(index, 'dueDate', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddMilestone}
                className="w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-brand-500 rounded-xl text-xs font-bold text-slate-600 hover:text-brand-600 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Another Milestone
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">Total Defined: </span>
                <strong className={`text-sm font-extrabold ${
                  Math.abs(milestones.reduce((s, m) => s + Number(m.amount || 0), 0) - Number(selectedBidForAccept.amount)) < 0.01
                    ? 'text-emerald-600'
                    : 'text-rose-600'
                }`}>
                  ${milestones.reduce((s, m) => s + Number(m.amount || 0), 0).toFixed(2)}
                </strong>
                <span className="text-xs text-slate-400"> / ${Number(selectedBidForAccept.amount).toFixed(2)}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBidForAccept(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={acceptingBid}
                  onClick={handleConfirmAcceptBid}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/25 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {acceptingBid ? 'Activating Contract...' : 'Confirm & Create Contract'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
