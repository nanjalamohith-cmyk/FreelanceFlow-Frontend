import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  Briefcase,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ArrowRight,
  PlusCircle,
  Coins
} from 'lucide-react';

export default function MyJobs() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      if (user.role === 'CLIENT') {
        const res = await api.get('/jobs/my');
        setItems(res.data);
      } else {
        const res = await api.get('/bids/my');
        setItems(res.data);
      }
    } catch (err) {
      setError('Could not load listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [user]);

  const handleWithdrawBid = async (bidId) => {
    if (!window.confirm('Are you sure you want to withdraw this bid?')) return;
    try {
      await api.delete(`/bids/${bidId}`);
      setMessage('Bid withdrawn successfully.');
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not withdraw bid');
    }
  };

  const handleCancelJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to cancel this job?')) return;
    try {
      await api.delete(`/jobs/${jobId}`);
      setMessage('Job cancelled.');
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel job');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  const isClient = user.role === 'CLIENT';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isClient ? 'My Posted Jobs' : 'My Submitted Proposals'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isClient ? 'Track bid proposals, open jobs, and active contracts' : 'Monitor proposal statuses and active jobs'}
          </p>
        </div>

        {isClient ? (
          <Link
            to="/post-job"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            Post New Job
          </Link>
        ) : (
          <Link
            to="/jobs"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5"
          >
            <Briefcase className="w-4 h-4" />
            Find More Jobs
          </Link>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Layers className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            {isClient ? 'You haven’t posted any jobs yet' : 'You haven’t submitted any bids yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isClient
              ? 'Post a job today to connect with skilled freelance professionals.'
              : 'Browse open projects in our escrow marketplace and submit your proposals.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {items.map((item) => (
            <div key={item.id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    (item.status === 'OPEN' || item.status === 'ACCEPTED') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    (item.status === 'IN_CONTRACT' || item.status === 'PENDING') ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {item.status}
                  </span>
                  <span className="text-xs text-slate-400">
                    Created {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900">
                  {isClient ? (
                    <Link to={`/jobs/${item.id}`} className="hover:text-brand-600 transition-colors">
                      {item.title}
                    </Link>
                  ) : (
                    <span>{item.jobTitle || 'Job Proposal'}</span>
                  )}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2">
                  {isClient ? item.description : item.proposal}
                </p>

                {isClient && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold pt-1">
                    <span className="bg-slate-100 px-2.5 py-0.5 rounded-lg text-slate-700">
                      {item.bidCount || 0} proposals received
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <div className="text-right">
                  <span className="text-xl font-extrabold text-slate-900">
                    ${Number(item.budget || item.amount || 0).toFixed(2)}
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    {isClient ? 'Budget' : `${item.deliveryDays} Days Timeline`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isClient ? (
                    <>
                      <Link
                        to={`/jobs/${item.id}`}
                        className="px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs rounded-xl transition-colors"
                      >
                        View & Compare Bids
                      </Link>
                      {item.status === 'OPEN' && (
                        <button
                          onClick={() => handleCancelJob(item.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Cancel Job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <Link
                        to={`/jobs/${item.jobId}`}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors"
                      >
                        View Job
                      </Link>
                      {item.status === 'PENDING' && (
                        <button
                          onClick={() => handleWithdrawBid(item.id)}
                          className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors"
                        >
                          Withdraw
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
