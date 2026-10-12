import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  ShieldAlert,
  Users,
  Briefcase,
  Layers,
  Coins,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Check,
  Ban,
  ArrowRight
} from 'lucide-react';

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' | 'users' | 'disputes'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dispute resolution modal
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolutionType, setResolutionType] = useState('SPLIT');
  const [splitPercent, setSplitPercent] = useState(50);
  const [adminNote, setAdminNote] = useState('');
  const [resolvingLoading, setResolvingLoading] = useState(false);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, disputesRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/disputes'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setDisputes(disputesRes.data);
    } catch (err) {
      setError('Failed to fetch administrator records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleBanToggle = async (userId, currentBanned) => {
    const action = currentBanned ? 'unban' : 'ban';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      await api.patch(`/admin/users/${userId}/ban`, { isBanned: !currentBanned });
      setSuccess(`User status updated.`);
      fetchAdminData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user ban state');
    }
  };

  const handleResolveDispute = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;
    setError('');
    setSuccess('');
    setResolvingLoading(true);

    try {
      await api.post(`/admin/disputes/${selectedDispute.id}/resolve`, {
        resolution: resolutionType,
        splitPercentToFreelancer: resolutionType === 'SPLIT' ? Number(splitPercent) : null,
        adminNote,
      });

      setSuccess('Dispute resolved and escrow funds settled according to judgment.');
      setSelectedDispute(null);
      fetchAdminData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resolve dispute');
    } finally {
      setResolvingLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-6 h-6 text-amber-500" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Platform Administration
          </h1>
        </div>
        <p className="text-xs text-slate-500">
          Escrow transaction auditing, user governance, and milestone dispute arbitration
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'stats'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Platform Metrics
        </button>
        <button
          onClick={() => setActiveTab('disputes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === 'disputes'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Dispute Queue
          {disputes.filter((d) => d.status === 'OPEN').length > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px]">
              {disputes.filter((d) => d.status === 'OPEN').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'users'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          User Moderation ({users.length})
        </button>
      </div>

      {/* TAB 1: Platform Stats */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold uppercase text-slate-400 block">Total Users</span>
              <span className="text-3xl font-black text-slate-900 mt-1 block">{stats.totalUsers}</span>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {stats.totalClients} Clients • {stats.totalFreelancers} Freelancers
              </span>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold uppercase text-slate-400 block">Escrow Volume</span>
              <span className="text-3xl font-black text-emerald-600 mt-1 block">
                ${Number(stats.totalEscrowVolume || 0).toFixed(2)}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">Total escrow funds secured</span>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold uppercase text-slate-400 block">Contracts</span>
              <span className="text-3xl font-black text-slate-900 mt-1 block">
                {stats.activeContracts + stats.completedContracts}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {stats.activeContracts} Active • {stats.completedContracts} Completed
              </span>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold uppercase text-slate-400 block">Open Disputes</span>
              <span className="text-3xl font-black text-rose-600 mt-1 block">
                {stats.openDisputes}
              </span>
              <span className="text-[11px] text-rose-500 font-semibold mt-1 block">Requires arbitration</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Dispute Queue */}
      {activeTab === 'disputes' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Dispute Arbitration Queue</h2>
            <span className="text-xs text-slate-400">{disputes.length} Total Disputes</span>
          </div>

          {disputes.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No disputes in queue. All contracts proceeding normally.
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((d) => (
                <div
                  key={d.id}
                  className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        d.status === 'OPEN' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {d.status}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900">
                        Milestone: {d.milestoneTitle || d.milestoneId}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3">
                      {d.milestoneAmount && (
                        <span className="text-xs font-extrabold text-slate-900">
                          Hold: ${Number(d.milestoneAmount).toFixed(2)}
                        </span>
                      )}
                      {d.status === 'OPEN' && (
                        <button
                          onClick={() => {
                            setSelectedDispute(d);
                            setResolutionType('SPLIT');
                            setSplitPercent(50);
                            setAdminNote('');
                          }}
                          className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                        >
                          Arbitrate & Resolve
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-100">
                    <strong>Reason (by {d.raisedByName || 'User'}):</strong> {d.reason}
                  </p>

                  {d.status === 'RESOLVED' && (
                    <div className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200 font-semibold">
                      Resolved via {d.resolution?.replace(/_/g, ' ')}
                      {d.resolution === 'SPLIT' && ` (${d.splitPercentToFreelancer}% to Freelancer)`}
                      {d.adminNote && ` — Note: ${d.adminNote}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: User Moderation */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900">User Moderation & Governance</h2>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Wallet Balance</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{u.name}</span>
                      <span className="text-slate-400 text-[11px]">{u.email}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{u.role}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ${Number(u.walletBalance || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      ★ {u.ratingAvg ? u.ratingAvg.toFixed(1) : '5.0'} ({u.ratingCount || 0})
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        u.isBanned ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {u.isBanned ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleBanToggle(u.id, u.isBanned)}
                          className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                            u.isBanned
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          {u.isBanned ? 'Unban User' : 'Suspend User'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dispute Resolution Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <span>Arbitrate Dispute</span>
              </h3>
              <button onClick={() => setSelectedDispute(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleResolveDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-2">
                  Resolution Judgment
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="res"
                      value="SPLIT"
                      checked={resolutionType === 'SPLIT'}
                      onChange={(e) => setResolutionType(e.target.value)}
                    />
                    <span>Split Escrow Funds between Freelancer & Client</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="res"
                      value="RELEASE_TO_FREELANCER"
                      checked={resolutionType === 'RELEASE_TO_FREELANCER'}
                      onChange={(e) => setResolutionType(e.target.value)}
                    />
                    <span>Release 100% of Milestone Funds to Freelancer</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="res"
                      value="REFUND_TO_CLIENT"
                      checked={resolutionType === 'REFUND_TO_CLIENT'}
                      onChange={(e) => setResolutionType(e.target.value)}
                    />
                    <span>Refund 100% of Milestone Funds to Client</span>
                  </label>
                </div>
              </div>

              {resolutionType === 'SPLIT' && (
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Freelancer Portion: {splitPercent}%</span>
                    <span>Client Refund: {100 - splitPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={splitPercent}
                    onChange={(e) => setSplitPercent(e.target.value)}
                    className="w-full accent-brand-600 cursor-pointer"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  Administrative Note / Findings
                </label>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Explain judgment findings to both parties..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolvingLoading}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {resolvingLoading ? 'Executing Transfer...' : 'Execute Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
