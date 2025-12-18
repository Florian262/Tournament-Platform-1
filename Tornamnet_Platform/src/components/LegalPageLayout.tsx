import React from 'react';

export default function LegalPageLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="min-h-screen bg-slate-950 py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900/60 border border-blue-500/10 rounded-2xl p-8 prose prose-invert text-slate-200">
          {title && <h1 className="text-3xl font-bold mb-4">{title}</h1>}
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
