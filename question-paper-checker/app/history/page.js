'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function ScoreBadge({ score }) {
    const color = score >= 90
        ? 'bg-success/10 text-success border-success/30'
        : score >= 70
            ? 'bg-amber-50 text-amber-600 border-amber-200'
            : 'bg-red-50 text-error border-error/30';
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${color}`}>
            {score}/100
        </span>
    );
}

export default function HistoryPage() {
    const router = useRouter();
    const supabase = createClient();
    const [analyses, setAnalyses] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchAnalyses();
    }, []);

    const fetchAnalyses = async () => {
        const { data, error } = await supabase
            .from('analyses')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error) setAnalyses(data);
    };

    const handleLoadReport = (analysis) => {
        localStorage.setItem('reportData', JSON.stringify(analysis.report));
        router.push('/report');
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        setDeletingId(id);
        await supabase.from('analyses').delete().eq('id', id);
        setAnalyses(prev => prev.filter(a => a.id !== id));
        setDeletingId(null);
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <main className="flex-1">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="mb-10">
                    <h1 className="text-4xl font-bold text-foreground mb-3">Analysis History</h1>
                    <p className="text-lg text-gray-600">All your past question paper checks, saved automatically</p>
                </div>

                {analyses === null ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-2xl border border-border p-6 animate-pulse">
                                <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
                                <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                            </div>
                        ))}
                    </div>
                ) : analyses.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-border p-16 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">No analyses yet</h3>
                        <p className="text-gray-500 mb-6">Upload a question paper to get started</p>
                        <Link href="/" className="inline-block px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-opacity-90 transition-all">
                            Check a Paper
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {analyses.map((analysis) => (
                            <div
                                key={analysis.id}
                                onClick={() => handleLoadReport(analysis)}
                                className="bg-white rounded-2xl border border-border p-6 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <h3 className="font-semibold text-foreground truncate text-lg">{analysis.file_name}</h3>
                                            <ScoreBadge score={analysis.report.healthScore} />
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                                            <span>{formatDate(analysis.created_at)}</span>
                                            <span>{analysis.total_marks} marks</span>
                                            <span className={`font-medium ${analysis.report.critical > 0 ? 'text-error' : 'text-success'}`}>
                                                {analysis.report.critical} critical · {analysis.report.warnings} warnings
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium mt-2 text-gray-700">{analysis.report.verdict}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={(e) => handleDelete(analysis.id, e)}
                                            disabled={deletingId === analysis.id}
                                            className="p-2 text-gray-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                        <svg className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}