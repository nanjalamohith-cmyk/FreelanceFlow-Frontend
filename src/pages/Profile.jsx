import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  User,
  Building,
  Code2,
  Globe,
  Star,
  CheckCircle2,
  AlertCircle,
  Save,
  Link as LinkIcon
} from 'lucide-react';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [portfolioInput, setPortfolioInput] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setCompanyName(user.companyName || '');
      setSkillsInput(user.skills ? user.skills.join(', ') : '');
      setPortfolioInput(user.portfolioLinks ? user.portfolioLinks.join(', ') : '');

      api.get(`/users/${user.id}/reviews`)
        .then((res) => setReviews(res.data))
        .catch((err) => console.warn('Could not load user reviews', err));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const skills = skillsInput
      ? skillsInput.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const portfolioLinks = portfolioInput
      ? portfolioInput.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    try {
      await api.put('/users/profile', {
        name,
        bio,
        companyName: user.role === 'CLIENT' ? companyName : undefined,
        skills: user.role === 'FREELANCER' ? skills : [],
        portfolioLinks,
      });
      setSuccess('Profile updated successfully!');
      refreshUser();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Profile Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Update your public profile, professional credentials, and client-facing showcase
        </p>
      </div>

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

      {/* Header Profile Badge */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-md uppercase">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-brand-50 text-brand-700 border border-brand-200/60">
              {user?.role}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-amber-50 px-4 py-3 rounded-2xl border border-amber-200/60">
          <Star className="w-6 h-6 text-amber-500 fill-amber-400" />
          <div>
            <span className="text-lg font-black text-slate-900">
              {user?.ratingAvg ? user.ratingAvg.toFixed(1) : '5.0'}
            </span>
            <span className="block text-[10px] text-slate-500 font-semibold">
              {user?.ratingCount || 0} reviews
            </span>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {user?.role === 'CLIENT' ? (
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Cloud Corp"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Skills (comma separated)
            </label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="React, Spring Boot, MongoDB, Tailwind CSS, TypeScript"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
            Portfolio / Web Links (comma separated)
          </label>
          <input
            type="text"
            value={portfolioInput}
            onChange={(e) => setPortfolioInput(e.target.value)}
            placeholder="https://github.com/alex, https://alexrivera.dev"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
            Bio / About Me
          </label>
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Summarize your expertise, past achievements, and working philosophy..."
            className="w-full p-4 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Profile Changes'}
        </button>
      </form>

      {/* Reviews Received List */}
      {reviews.length > 0 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-slate-900">Client & Peer Reviews ({reviews.length})</h3>
          <div className="divide-y divide-slate-100">
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
        </div>
      )}
    </div>
  );
}
