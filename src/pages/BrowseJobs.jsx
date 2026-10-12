import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import {
  Search,
  Filter,
  DollarSign,
  Calendar,
  Briefcase,
  Layers,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Sparkles
} from 'lucide-react';

const COMMON_SKILLS = ['React', 'Spring Boot', 'MongoDB', 'Node.js', 'Tailwind CSS', 'TypeScript', 'Java', 'Python', 'AWS', 'Docker'];

export default function BrowseJobs() {
  const [jobs, setJobs] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [status, setStatus] = useState('OPEN');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword.trim()) params.append('keyword', keyword.trim());
      if (selectedSkill) params.append('skill', selectedSkill);
      if (minBudget) params.append('minBudget', minBudget);
      if (maxBudget) params.append('maxBudget', maxBudget);
      if (status) params.append('status', status);
      params.append('page', page);
      params.append('size', 9);

      const res = await api.get(`/jobs?${params.toString()}`);
      setJobs(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      console.warn('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, selectedSkill, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchJobs();
  };

  const handleClearFilters = () => {
    setKeyword('');
    setSelectedSkill('');
    setMinBudget('');
    setMaxBudget('');
    setStatus('OPEN');
    setPage(0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-indigo-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/30 inline-flex items-center gap-1.5 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            Verified Escrow Marketplace
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Explore Freelance Projects
          </h1>
          <p className="mt-2 text-slate-300 text-sm">
            Discover verified jobs funded in milestone escrow. Guaranteed payment upon client approval.
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search by job title, deliverables or description..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="number"
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
              placeholder="Min $"
              className="w-24 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              type="number"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              placeholder="Max $"
              className="w-24 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="OPEN">Open Only</option>
              <option value="IN_CONTRACT">In Contract</option>
              <option value="COMPLETED">Completed</option>
              <option value="">All Statuses</option>
            </select>

            <button
              type="submit"
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md shadow-brand-500/20 transition-all shrink-0"
            >
              Filter
            </button>
          </div>
        </form>

        {/* Skill filter pills */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Skills:
          </span>
          <button
            type="button"
            onClick={() => { setSelectedSkill(''); setPage(0); }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              selectedSkill === ''
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Skills
          </button>
          {COMMON_SKILLS.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => { setSelectedSkill(skill); setPage(0); }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                selectedSkill === skill
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {skill}
            </button>
          ))}
          {(keyword || selectedSkill || minBudget || maxBudget || status !== 'OPEN') && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="ml-auto text-xs font-bold text-rose-600 hover:text-rose-700 underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
        <span>Found {totalElements} available project{totalElements === 1 ? '' : 's'}</span>
        <span>Page {page + 1} of {Math.max(1, totalPages)}</span>
      </div>

      {/* Job Cards Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No jobs match your criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search terms or clearing the skill and budget filters to view more listings.
          </p>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-slate-200/80 hover:border-brand-300 shadow-sm hover:shadow-xl hover:shadow-brand-500/5 transition-all p-6 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    job.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    job.status === 'IN_CONTRACT' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                    'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {job.status}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                    <Layers className="w-3 h-3 text-slate-400" />
                    <span>{job.bidCount || 0} bids</span>
                  </div>
                </div>

                <Link to={`/jobs/${job.id}`}>
                  <h3 className="font-extrabold text-base text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2">
                    {job.title}
                  </h3>
                </Link>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {job.description}
                </p>

                {/* Skills Chips */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {job.skills?.slice(0, 4).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                  {job.skills?.length > 4 && (
                    <span className="text-[10px] text-slate-400 font-semibold self-center">
                      +{job.skills.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Escrow Budget</span>
                  <span className="text-lg font-black text-slate-900">
                    ${Number(job.budget || 0).toFixed(2)}
                  </span>
                </div>

                <Link
                  to={`/jobs/${job.id}`}
                  className="px-4 py-2 bg-brand-50 group-hover:bg-brand-600 text-brand-700 group-hover:text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                >
                  View Details & Bid
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="px-4 py-2 text-xs font-bold text-slate-700 bg-white rounded-xl border border-slate-200">
            {page + 1} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
