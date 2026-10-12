import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  Briefcase,
  Layers,
  Wallet,
  ShieldCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Coins,
  Star
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeJobs: 0,
    activeContracts: 0,
    completedContracts: 0,
    myBidsCount: 0,
    openDisputes: 0,
  });
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (user.role === 'CLIENT') {
          const [jobsRes, contractsRes] = await Promise.all([
            api.get('/jobs/my'),
            api.get('/contracts'),
          ]);
          const jobs = jobsRes.data;
          const contracts = contractsRes.data;

          setStats({
            activeJobs: jobs.filter((j) => j.status === 'OPEN').length,
            activeContracts: contracts.filter((c) => c.status === 'ACTIVE').length,
            completedContracts: contracts.filter((c) => c.status === 'COMPLETED').length,
          });
          setRecentItems(jobs.slice(0, 5));
        } else if (user.role === 'FREELANCER') {
          const [bidsRes, contractsRes, jobsRes] = await Promise.all([
            api.get('/bids/my'),
            api.get('/contracts'),
            api.get('/jobs?size=5'),
          ]);
          const bids = bidsRes.data;
          const contracts = contractsRes.data;

          setStats({
            myBidsCount: bids.length,
            activeContracts: contracts.filter((c) => c.status === 'ACTIVE').length,
            completedContracts: contracts.filter((c) => c.status === 'COMPLETED').length,
          });
          setRecentItems(jobsRes.data.content || []);
        } else if (user.role === 'ADMIN') {
          const statsRes = await api.get('/admin/stats');
          setStats(statsRes.data);
        }
      } catch (err) {
        console.warn('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-gradient from-brand-500/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-brand-500/30 text-brand-200 border border-brand-400/30">
                {user.role} Workspace
              </span>
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Escrow Protected
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {user.name} 👋
            </h1>
            <p className="mt-1 text-slate-300 text-sm max-w-xl">
              {user.role === 'CLIENT' && "Manage your job listings, accept bids, fund milestones, and review submitted deliverables safely in escrow."}
              {user.role === 'FREELANCER' && "Explore open projects, submit proposals, complete milestones, and receive instant payouts to your escrow wallet."}
              {user.role === 'ADMIN' && "Review platform health metrics, monitor escrow transaction volume, and resolve disputed milestones."}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {user.role === 'CLIENT' && (
              <Link
                to="/post-job"
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-500/25 transition-all flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Post a Job
              </Link>
            )}
            {user.role === 'FREELANCER' && (
              <Link
                to="/jobs"
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-500/25 transition-all flex items-center gap-2"
              >
                <Briefcase className="w-4 h-4" />
                Find Projects
              </Link>
            )}
            {user.role === 'ADMIN' && (
              <Link
                to="/admin"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Admin Console
              </Link>
            )}
            <Link
              to="/wallet"
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm backdrop-blur transition-all flex items-center gap-2 border border-white/10"
            >
              <Wallet className="w-4 h-4" />
              Wallet (${Number(user.walletBalance || 0).toFixed(2)})
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Wallet Balance
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              ${Number(user.walletBalance || 0).toFixed(2)}
            </h3>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
              Available for escrow & payout
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {user.role === 'CLIENT' ? (
          <>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Open Jobs
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                  {stats.activeJobs}
                </h3>
                <span className="text-[11px] text-slate-500 font-semibold mt-1 inline-block">
                  Awaiting or receiving bids
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Active Contracts
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                  {stats.activeContracts}
                </h3>
                <span className="text-[11px] text-brand-600 font-semibold mt-1 inline-block">
                  Milestones in progress
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Completed
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                  {stats.completedContracts}
                </h3>
                <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
                  Fully settled contracts
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </>
        ) : user.role === 'FREELANCER' ? (
          <>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Active Bids
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                  {stats.myBidsCount}
                </h3>
                <span className="text-[11px] text-slate-500 font-semibold mt-1 inline-block">
                  Proposals submitted
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Active Contracts
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                  {stats.activeContracts}
                </h3>
                <span className="text-[11px] text-brand-600 font-semibold mt-1 inline-block">
                  Working on deliverables
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Client Rating
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  {user.ratingAvg ? user.ratingAvg.toFixed(1) : '5.0'}
                </h3>
                <span className="text-[11px] text-slate-500 font-semibold mt-1 inline-block">
                  ({user.ratingCount || 0} reviews)
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Star className="w-6 h-6" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Platform Users
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                  {stats.totalUsers || 0}
                </h3>
                <span className="text-[11px] text-slate-500 font-semibold mt-1 inline-block">
                  Clients & Freelancers
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Escrow Volume
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                  ${Number(stats.totalEscrowVolume || 0).toFixed(2)}
                </h3>
                <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
                  Lifetime escrow secured
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Open Disputes
                </p>
                <h3 className="text-2xl font-extrabold text-rose-600 mt-1">
                  {stats.openDisputes || 0}
                </h3>
                <span className="text-[11px] text-rose-500 font-semibold mt-1 inline-block">
                  Require admin resolution
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Section: Recent Jobs / Opportunities */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {user.role === 'CLIENT' ? 'My Posted Jobs' : 'Recommended Open Projects'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {user.role === 'CLIENT' ? 'Overview of your latest openings and bid counts' : 'Browse verified high-budget opportunities'}
            </p>
          </div>
          <Link
            to={user.role === 'CLIENT' ? '/my-jobs' : '/jobs'}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentItems.length === 0 ? (
          <div className="py-12 text-center">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">No projects to display yet</p>
            {user.role === 'CLIENT' ? (
              <Link
                to="/post-job"
                className="inline-block mt-3 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700"
              >
                Post Your First Job
              </Link>
            ) : (
              <Link
                to="/jobs"
                className="inline-block mt-3 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700"
              >
                Explore Open Jobs
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentItems.map((item) => (
              <div key={item.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 -mx-4 px-4 rounded-xl transition-colors">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <Link to={`/jobs/${item.id}`} className="font-bold text-sm text-slate-900 hover:text-brand-600 transition-colors">
                      {item.title}
                    </Link>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      item.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700' :
                      item.status === 'IN_CONTRACT' ? 'bg-indigo-50 text-indigo-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {item.skills?.slice(0, 4).map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-base font-extrabold text-slate-900">${Number(item.budget || 0).toFixed(2)}</span>
                    <span className="block text-[10px] text-slate-400">Fixed Budget</span>
                  </div>
                  <Link
                    to={`/jobs/${item.id}`}
                    className="px-3.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs rounded-lg transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
