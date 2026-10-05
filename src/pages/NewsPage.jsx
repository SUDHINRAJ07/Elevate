import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Newspaper,
  RefreshCw,
  Clock,
  ExternalLink,
  Globe,
  Share2,
  AlertCircle,
  BookOpen,
  Check,
  ChevronRight,
  ChevronDown,
  Trophy,
  Cpu,
  Briefcase,
  FlaskConical,
  Film,
  Layers,
  Sparkles
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import DOMPurify from 'dompurify';
import { API_BASE } from '../config/api.js';

const sanitizeArticleHtml = (raw) => {
  if (!raw) return '';
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: [
      'p', 'h2', 'h3', 'h4', 'blockquote', 'ul', 'ol', 'li',
      'figure', 'figcaption', 'img', 'b', 'i', 'strong', 'em', 'a', 'span'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'loading', 'target', 'rel']
  });
};

const formatDate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(value);
  }
};

function timeAgo(value, now) {
  if (!value) return '';
  const diffMs = now - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} d ago`;
}

const DEFAULT_DEPARTMENTS = [
  {
    id: 'world',
    name: 'World',
    description: 'Global and international breaking news from across the globe.',
    subcategories: [
      { id: 'international', name: 'International' },
      { id: 'europe', name: 'Europe' },
      { id: 'asia', name: 'Asia' },
      { id: 'middle-east', name: 'Middle East' },
      { id: 'africa', name: 'Africa' }
    ]
  },
  {
    id: 'sports',
    name: 'Sports',
    description: 'Live coverage, scores, and updates across major world sports.',
    subcategories: [
      { id: 'cricket', name: 'Cricket' },
      { id: 'football', name: 'Football' },
      { id: 'tennis', name: 'Tennis' },
      { id: 'basketball', name: 'Basketball' },
      { id: 'formula-1', name: 'Formula 1' },
      { id: 'badminton', name: 'Badminton' },
      { id: 'other-sports', name: 'Other Sports' }
    ]
  },
  {
    id: 'technology',
    name: 'Technology',
    description: 'Tech breakthroughs, artificial intelligence, gadgets, and cybersecurity.',
    subcategories: [
      { id: 'ai', name: 'AI' },
      { id: 'software', name: 'Software' },
      { id: 'gadgets', name: 'Gadgets' },
      { id: 'cybersecurity', name: 'Cybersecurity' },
      { id: 'startups', name: 'Startups' }
    ]
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Global financial markets, economies, business strategy, and companies.',
    subcategories: [
      { id: 'markets', name: 'Markets' },
      { id: 'finance', name: 'Finance' },
      { id: 'economy', name: 'Economy' },
      { id: 'companies', name: 'Companies' },
      { id: 'startups', name: 'Startups' }
    ]
  },
  {
    id: 'science',
    name: 'Science',
    description: 'Space exploration, environment, scientific discoveries, and health.',
    subcategories: [
      { id: 'space', name: 'Space' },
      { id: 'environment', name: 'Environment' },
      { id: 'research', name: 'Research' },
      { id: 'health-science', name: 'Health Science' }
    ]
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    description: 'Cinema, music, television, celebrity culture, and gaming.',
    subcategories: [
      { id: 'movies', name: 'Movies' },
      { id: 'music', name: 'Music' },
      { id: 'tv', name: 'TV' },
      { id: 'celebrities', name: 'Celebrities' },
      { id: 'gaming', name: 'Gaming' }
    ]
  }
];

const DEPARTMENT_ICONS = {
  world: Globe,
  sports: Trophy,
  technology: Cpu,
  business: Briefcase,
  science: FlaskConical,
  entertainment: Film
};

function NewsImage({ article, className = 'h-48 w-full object-cover' }) {
  const [broken, setBroken] = useState(false);

  if (article.imageUrl && !broken) {
    return (
      <img
        src={article.imageUrl}
        alt={article.title || 'News'}
        loading="lazy"
        onError={() => setBroken(true)}
        className={`${className} transition-transform duration-300 group-hover:scale-105`}
      />
    );
  }

  return (
    <div className="h-48 w-full bg-gradient-to-br from-orange-50 via-slate-50 to-orange-100/40 flex flex-col items-center justify-center text-slate-400 gap-2 p-4 text-center select-none">
      <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-2xs">
        <Newspaper className="w-6 h-6" />
      </div>
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {article.category || 'World News'}
      </span>
    </div>
  );
}

const PORTAL_OPTIONS = [
  { id: 'admin', name: 'Admin Portal', emoji: '🛡️', role: 'Managing Director / MD' },
  { id: 'user', name: 'User / Assistant', emoji: '📅', role: 'Staff Workspace' },
  { id: 'sales', name: 'Sales Team Portal', emoji: '💼', role: 'Sales Team Lead' },
  { id: 'client', name: 'Client Booking', emoji: '🌐', role: 'Public Booking Page' },
  { id: 'news', name: 'Live World News', emoji: '📰', role: 'Global News Feed (Active)' },
];

export default function NewsPage({ onSwitchPortal }) {
  const [portalDropdownOpen, setPortalDropdownOpen] = useState(false);
  const portalDropdownRef = useRef(null);

  useEffect(() => {
    if (!portalDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (portalDropdownRef.current && !portalDropdownRef.current.contains(e.target)) {
        setPortalDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [portalDropdownOpen]);

  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [activeDeptId, setActiveDeptId] = useState('world');
  const [activeSubcatId, setActiveSubcatId] = useState('international');
  
  // Cache keyed by `${deptId}:${subcatId}`
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [reading, setReading] = useState(false);
  const [large, setLarge] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [now, setNow] = useState(Date.now());

  // Active department & subcategory objects
  const activeDept = useMemo(() => {
    return departments.find((d) => d.id === activeDeptId) || departments[0];
  }, [departments, activeDeptId]);

  const activeSubcat = useMemo(() => {
    return activeDept.subcategories?.find((s) => s.id === activeSubcatId) || activeDept.subcategories?.[0] || { id: activeSubcatId, name: activeSubcatId };
  }, [activeDept, activeSubcatId]);

  // Fetch departments metadata from backend on mount
  useEffect(() => {
    let mounted = true;
    async function fetchDepartments() {
      try {
        const res = await fetch(`${API_BASE}/api/news/departments`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.departments) && json.departments.length > 0 && mounted) {
            setDepartments(json.departments);
          }
        }
      } catch {
        // Fallback to DEFAULT_DEPARTMENTS
      }
    }
    fetchDepartments();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch subcategory articles
  const loadSubcategory = useCallback(async (deptId, subcatId, force = false) => {
    const key = `${deptId}:${subcatId}`;
    if (!force && cache[key]?.articles) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const endpoint = `${API_BASE}/api/news/${encodeURIComponent(deptId)}/${encodeURIComponent(subcatId)}`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Failed to fetch category news');
      const data = await res.json();
      if (!Array.isArray(data.articles)) throw new Error('Invalid response structure');

      setCache((prev) => ({
        ...prev,
        [key]: {
          articles: data.articles,
          updatedAt: data.updatedAt || new Date().toISOString(),
          status: data.status,
          fetchedAt: Date.now()
        }
      }));
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(`Unable to load news for ${subcatId}. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  }, [cache]);

  // Load active subcategory whenever activeDeptId or activeSubcatId changes
  useEffect(() => {
    loadSubcategory(activeDeptId, activeSubcatId);
  }, [activeDeptId, activeSubcatId, loadSubcategory]);

  // Auto-refresh timer every minute to update relative times & purge expired
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Expire reader view if current selected article expires
  useEffect(() => {
    if (selected && new Date(selected.expiresAt).getTime() <= now) {
      setSelected(null);
      setError('This story has expired. Please select a current article.');
    }
  }, [now, selected]);

  const handleSelectDepartment = (deptId) => {
    if (deptId === activeDeptId) return;
    setActiveDeptId(deptId);
    const targetDept = departments.find((d) => d.id === deptId);
    const firstSubcat = targetDept?.subcategories?.[0]?.id || 'general';
    setActiveSubcatId(firstSubcat);
  };

  const handleSelectSubcategory = (subcatId) => {
    if (subcatId === activeSubcatId) return;
    setActiveSubcatId(subcatId);
  };

  async function readArticle(article) {
    setSelected(article);
    setReading(true);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const response = await fetch(`${API_BASE}/api/news/${encodeURIComponent(article.id)}`);
      if (!response.ok) throw new Error();
      const detail = await response.json();
      setSelected((current) => (current?.id === article.id ? detail : current));
    } catch {
      // Retain preview article data if detail fetch fails
    } finally {
      setReading(false);
    }
  }

  async function openOriginal(event, url) {
    if (!Capacitor.isNativePlatform()) return;
    event.preventDefault();
    try {
      await Browser.open({ url });
    } catch {
      setError('The original article could not be opened. Please try again.');
    }
  }

  const handleShare = async (article, e) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(article.url);
        setCopiedId(article.id);
        setTimeout(() => setCopiedId(null), 2500);
      }
    } catch {
      // Fallback
    }
  };

  // Extract current feed data from cache
  const activeFeedData = cache[`${activeDeptId}:${activeSubcatId}`];
  const validArticles = useMemo(() => {
    return (activeFeedData?.articles || [])
      .filter((article) => new Date(article.expiresAt).getTime() > now)
      .slice(0, 20);
  }, [activeFeedData, now]);

  // Active Icon
  const DeptIcon = DEPARTMENT_ICONS[activeDeptId] || Globe;

  // --- In-App Reader View Modal ---
  if (selected) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-16 pt-4 sm:pt-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Reader Navigation & Controls */}
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
          <button
            onClick={() => setSelected(null)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 shadow-2xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-orange-500" />
            <span>Back to {activeSubcat.name || 'News'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLarge(!large)}
              aria-pressed={large}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 shadow-2xs transition cursor-pointer"
              title="Toggle font size"
            >
              <span>Text size</span>
              <span className="font-bold text-orange-600">{large ? 'A−' : 'A+'}</span>
            </button>
            <button
              onClick={(e) => handleShare(selected, e)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 shadow-2xs transition cursor-pointer"
              title="Copy article link"
            >
              {copiedId === selected.id ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-slate-500" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Reader Card Body */}
        <article className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-200/80">
                {selected.category || activeSubcat.name || 'News'}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-orange-500" />
                {timeAgo(selected.publishedAt, now)}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">
                {formatDate(selected.publishedAt)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
              {selected.title}
            </h1>

            <p className="text-xs text-slate-500 font-medium">
              By <span className="font-semibold text-slate-700">{selected.author || selected.source || 'Reporter'}</span> · Published by{' '}
              <span className="font-semibold text-slate-700">{selected.source || 'Publisher'}</span>
            </p>
          </div>

          {/* Featured Image */}
          {selected.imageUrl && (
            <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-2xs">
              <img
                src={selected.imageUrl}
                alt={selected.title}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
                className="w-full max-h-[440px] object-cover"
              />
            </div>
          )}

          {/* Lead / Description if not redundant */}
          {selected.description && (!selected.content || !selected.content.includes(selected.description.slice(0, 40))) && (
            <div className="p-4 rounded-2xl bg-orange-50/80 border border-orange-100 text-slate-800 font-medium text-sm sm:text-base leading-relaxed">
              {selected.description}
            </div>
          )}

          {/* Full Article Content */}
          <div className={`leading-relaxed ${large ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'}`}>
            {reading ? (
              <div className="py-6 space-y-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded-md w-full" />
                <div className="h-4 bg-slate-200 rounded-md w-11/12" />
                <div className="h-4 bg-slate-200 rounded-md w-4/5" />
                <div className="h-4 bg-slate-200 rounded-md w-full" />
                <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                <div className="py-4 text-center text-slate-400 flex items-center justify-center gap-2 text-xs font-semibold">
                  <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />
                  <span>Loading full article content...</span>
                </div>
              </div>
            ) : selected.content && /<[a-z][\s\S]*>/i.test(selected.content) ? (
              <div
                className="news-article-content space-y-4 text-slate-800"
                dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(selected.content) }}
              />
            ) : (selected.content || selected.description) ? (
              <div className="space-y-4 text-slate-700">
                {(selected.content || selected.description)
                  .split(/\n\n+/)
                  .map((p) => p.trim())
                  .filter(Boolean)
                  .map((paragraph, idx) => (
                    <p key={idx} className="leading-relaxed whitespace-pre-wrap">
                      {paragraph}
                    </p>
                  ))}
                {selected.contentStatus === 'provider_content' && (
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs">
                    Summary preview provided by {selected.source || 'publisher'}. Read full coverage on the original publication.
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 px-4 text-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-sm">
                <p className="font-semibold text-slate-700 mb-1">
                  Full article content is not available for this source.
                </p>
                <p className="text-xs text-slate-400">
                  Please read the original report directly on {selected.source || 'the publisher website'}.
                </p>
              </div>
            )}
          </div>

          {/* Footer with External Link & Licensing Notice */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <a
                href={selected.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => openOriginal(e, selected.url)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl shadow-xs transition active:scale-95"
              >
                <span>Read Original Article on {selected.source || 'Publisher'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <span className="text-[11px] text-slate-400">
                Verified 24h Global Coverage
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Text provided under attribution license. Third-party media and full copyrights belong to their respective publishers.
            </p>
          </div>
        </article>

        {/* Bottom Portal Switcher matching other portals */}
        <div className="fixed bottom-4 left-4 z-40" ref={portalDropdownRef}>
          {portalDropdownOpen && (
            <div className="absolute bottom-full mb-2 left-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1 flex items-center justify-between">
                <span>Switch Portal</span>
                <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-bold">Elevate</span>
              </div>
              {PORTAL_OPTIONS.map((p) => {
                const isSelected = p.id === 'news';
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (onSwitchPortal) onSwitchPortal(p.id);
                      setPortalDropdownOpen(false);
                    }}
                    className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-orange-50 text-orange-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm leading-none">{p.emoji}</span>
                      <div className="min-w-0">
                        <p className="font-bold text-xs truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{p.role}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-orange-500 stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={() => setPortalDropdownOpen(!portalDropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-[#FFF8F1] hover:bg-[#FFF2E2] border border-orange-200/90 rounded-2xl text-xs font-bold text-[#9A3412] shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer"
          >
            <span className="text-sm leading-none">📰</span>
            <span className="tracking-tight text-xs font-bold text-[#9A3412]">Live World News</span>
            <ChevronDown className={`w-3.5 h-3.5 text-orange-500 transition-transform duration-200 ${portalDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </main>
    );
  }

  // --- Main News Page View ---
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20 pt-4 sm:pt-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              LIVE NEWS NETWORK
            </span>
            <span className="text-xs font-semibold text-slate-500">
              • Top 20 News per Subcategory
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Elevate Global News
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Explore verified stories across major world departments and subcategories. Stories refreshed hourly and expire after 24 hours.
          </p>
        </div>

        {/* Status & Refresh Button */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {activeFeedData?.updatedAt && (
            <div className="hidden sm:flex flex-col text-right text-[11px] text-slate-400">
              <span className="flex items-center justify-end gap-1 font-semibold text-slate-600">
                <Clock className="w-3 h-3 text-orange-500" />
                Updated {timeAgo(activeFeedData.updatedAt, now)}
              </span>
              <span>Next refresh in ~1h</span>
            </div>
          )}

          <button
            onClick={() => loadSubcategory(activeDeptId, activeSubcatId, true)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200/90 shadow-2xs transition active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-orange-500 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      {/* DEPARTMENT NAVIGATION TABS (World, Sports, Technology, Business, Science, Entertainment) */}
      <nav className="mb-4 bg-white p-2 rounded-2xl border border-slate-200/90 shadow-2xs" aria-label="News Departments">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {departments.map((dept) => {
            const Icon = DEPARTMENT_ICONS[dept.id] || Layers;
            const isActive = dept.id === activeDeptId;
            return (
              <button
                key={dept.id}
                onClick={() => handleSelectDepartment(dept.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{dept.name}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* SUBCATEGORY PILLS & BREADCRUMB BAR */}
      <div className="mb-6 space-y-3">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <span className="text-slate-400">News</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button
            onClick={() => handleSelectDepartment(activeDeptId)}
            className="hover:text-orange-600 transition"
          >
            {activeDept.name}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/60">
            {activeSubcat.name}
          </span>
        </div>

        {/* Subcategories Selector Pills */}
        {activeDept.subcategories && activeDept.subcategories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {activeDept.subcategories.map((subcat) => {
              const isSubcatActive = subcat.id === activeSubcatId;
              return (
                <button
                  key={subcat.id}
                  onClick={() => handleSelectSubcategory(subcat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                    isSubcatActive
                      ? 'bg-slate-900 text-white shadow-2xs font-bold ring-2 ring-orange-500/50'
                      : 'bg-white hover:bg-orange-50 hover:text-orange-600 text-slate-700 border border-slate-200/90 shadow-2xs'
                  }`}
                >
                  {subcat.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Section Subheader Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
            <DeptIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {activeDept.name} → {activeSubcat.name}
            </h2>
            <p className="text-xs text-slate-500">
              Top 20 articles curated from independent global publishers
            </p>
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500 self-end sm:self-center">
          Showing <span className="text-orange-600 font-bold">{validArticles.length}</span> of 20 stories
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-semibold">{error}</span>
          </div>
          <button
            onClick={() => loadSubcategory(activeDeptId, activeSubcatId, true)}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold text-xs hover:bg-rose-700 transition cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Source Unavailability Notice */}
      {activeFeedData?.status === 'unavailable' && (
        <div className="mb-6 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <Clock className="w-4 h-4 shrink-0 text-amber-600" />
          <span>The live news feed for {activeSubcat.name} is refreshing. Retaining valid unexpired stories from the last 24 hours.</span>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && !activeFeedData && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-4 shadow-xs animate-pulse"
            >
              <div className="h-44 bg-slate-100 rounded-2xl w-full" />
              <div className="h-4 bg-slate-100 rounded-md w-1/3" />
              <div className="h-5 bg-slate-100 rounded-md w-5/6" />
              <div className="h-12 bg-slate-100 rounded-md w-full" />
              <div className="h-8 bg-slate-100 rounded-xl w-full" />
            </div>
          ))}
        </section>
      )}

      {/* Empty State */}
      {!loading && validArticles.length === 0 && (
        <section className="py-20 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 max-w-lg mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto shadow-xs">
            <Newspaper className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No {activeSubcat.name} news available right now.</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            New stories for this category will appear automatically when published.
          </p>
          <button
            onClick={() => loadSubcategory(activeDeptId, activeSubcatId, true)}
            className="mt-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Refresh Feed
          </button>
        </section>
      )}

      {/* Top 20 News Grid for Active Subcategory */}
      {validArticles.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-label={`Top 20 ${activeSubcat.name} News`}>
          {validArticles.map((article, index) => (
            <article
              key={article.id}
              onClick={() => readArticle(article)}
              className="group bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer"
            >
              <div>
                {/* News Image with Badges */}
                <div className="relative overflow-hidden">
                  <NewsImage article={article} />

                  {/* Subcategory Badge */}
                  <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-orange-600 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-orange-100 shadow-xs">
                    {article.category || activeSubcat.name}
                  </span>

                  {/* Rank Badge (#01 - #20) */}
                  <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                    #{String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-600 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-orange-500" />
                      {timeAgo(article.publishedAt, now)}
                    </span>
                    <span>{formatDate(article.publishedAt)}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {article.summary || article.description}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-5 pt-0 space-y-2 border-t border-slate-50 mt-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2">
                  <span className="font-semibold text-slate-700 truncate max-w-[160px]">
                    {article.source || 'Publisher'}
                  </span>
                  <button
                    onClick={(e) => handleShare(article, e)}
                    className="p-1 hover:text-slate-800 transition"
                    title="Copy article link"
                  >
                    {copiedId === article.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => readArticle(article)}
                    className="flex-1 py-2 px-3 bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Read Article</span>
                  </button>

                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      openOriginal(e, article.url);
                    }}
                    className="py-2 px-3 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-200/80 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1 shadow-2xs"
                    title="Open original article source"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Footer Note */}
      <footer className="mt-12 text-center text-xs text-slate-400 space-y-1">
        <p>
          Stories aggregated from reputable international publishers. Published stories expire automatically after 24 hours.
        </p>
        <p className="text-[11px]">
          Elevate Global News Network · Free of charge · Non-commercial reader
        </p>
      </footer>

      {/* Bottom Portal Switcher matching other portals */}
      <div className="fixed bottom-4 left-4 z-40" ref={portalDropdownRef}>
        {portalDropdownOpen && (
          <div className="absolute bottom-full mb-2 left-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95">
            <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1 flex items-center justify-between">
              <span>Switch Portal</span>
              <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-bold">Elevate</span>
            </div>
            {PORTAL_OPTIONS.map((p) => {
              const isSelected = p.id === 'news';
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    if (onSwitchPortal) onSwitchPortal(p.id);
                    setPortalDropdownOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-orange-50 text-orange-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm leading-none">{p.emoji}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{p.role}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-orange-500 stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={() => setPortalDropdownOpen(!portalDropdownOpen)}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-[#FFF8F1] hover:bg-[#FFF2E2] border border-orange-200/90 rounded-2xl text-xs font-bold text-[#9A3412] shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer"
        >
          <span className="text-sm leading-none">📰</span>
          <span className="tracking-tight text-xs font-bold text-[#9A3412]">Live World News</span>
          <ChevronDown className={`w-3.5 h-3.5 text-orange-500 transition-transform duration-200 ${portalDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </main>
  );
}
