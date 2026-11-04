import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, RefreshCw, Calendar, Sparkles, Search } from 'lucide-react';

interface Article {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

interface NewsFeedProps {
  onNavigateHome?: () => void;
}

export default function NewsFeed({ onNavigateHome }: NewsFeedProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      if (data.success && Array.isArray(data.articles)) {
        setArticles(data.articles);
      } else {
        setError('Failed to load news feed items.');
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Unable to connect to news service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const filteredArticles = articles.filter(article => {
    const q = searchQuery.toLowerCase();
    return article.title.toLowerCase().includes(q) || article.description.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 pb-24">
      {/* Hero Banner */}
      <section className="bg-brand-dark text-white relative overflow-hidden py-16 sm:py-20 border-b border-slate-800">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 bg-brand-gold/20 border border-brand-gold/40 text-brand-gold px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
              <Newspaper className="w-3.5 h-3.5" />
              <span>Live European News Feed</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Germany & Europe <span className="text-brand-gold">News Stream</span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8">
              Stay updated with real-time news, immigration policy shifts, European current affairs, and cultural updates fetched directly from Deutsche Welle (DW).
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={fetchNews}
                disabled={loading}
                className="bg-brand-gold hover:bg-brand-lightGold text-brand-dark font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center space-x-2 shadow transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Feed</span>
              </button>

              {onNavigateHome && (
                <button
                  onClick={onNavigateHome}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition border border-slate-700"
                >
                  ← Back to Home
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Search & Flowing Stream Bar */}
      <section className="sticky top-20 z-40 bg-white/95 backdrop-blur shadow-sm border-b border-slate-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-brand-gold" />
              <span>Flowing Stream ({filteredArticles.length} Articles)</span>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search news articles..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-navy bg-slate-50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Flowing Feed Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        {loading && articles.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <RefreshCw className="w-8 h-8 animate-spin text-brand-navy mx-auto" />
            <p className="text-sm font-medium text-slate-600">Loading live news feed from Deutsche Welle...</p>
          </div>
        ) : error && articles.length === 0 ? (
          <div className="bg-rose-50 border border-rose-200 p-8 rounded-3xl text-center max-w-lg mx-auto">
            <p className="text-rose-700 text-sm mb-4">{error}</p>
            <button
              onClick={fetchNews}
              className="bg-brand-navy text-white px-4 py-2 rounded-xl text-xs font-semibold"
            >
              Try Again
            </button>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="bg-white border border-slate-200 p-12 rounded-3xl text-center max-w-lg mx-auto">
            <p className="text-slate-600 text-sm">No articles found matching "{searchQuery}".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article, idx) => (
              <article
                key={idx}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between group"
              >
                <div className="p-6 sm:p-8 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="inline-flex items-center space-x-1.5 bg-brand-navy/10 text-brand-navy px-3 py-1 rounded-full font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-brand-gold" />
                      <span>{article.pubDate}</span>
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">DW News</span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-navy transition leading-snug">
                    {article.title}
                  </h3>

                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    {article.description}
                  </p>
                </div>

                <div className="px-6 pb-6 pt-2 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-brand-navy hover:text-brand-gold transition"
                  >
                    <span>Read Full Article</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <span className="text-[10px] text-slate-400 font-medium">Deutsche Welle</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
