import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; onClick?: () => void }[];
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, breadcrumbs, actions }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 shrink-0 bg-[#05070A]/60 backdrop-blur-2xl border border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] p-6 rounded-[24px] relative overflow-hidden group">
      {/* Subtle glow effect */}
      <div className="absolute top-0 right-1/4 w-[300px] h-full bg-blue-500/5 blur-[50px] group-hover:bg-blue-500/10 transition-colors duration-700 pointer-events-none" />

      <div className="relative z-10 flex items-center">
        {/* Pulsing Status Dot */}
        <div className="mr-6 flex items-center justify-center">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
          </div>
        </div>

        <div>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="flex items-center text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-[0.2em]">
              {breadcrumbs.map((bc, idx) => (
                <React.Fragment key={idx}>
                  <span 
                    className={`${bc.onClick ? 'hover:text-white cursor-pointer transition-colors duration-300' : 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]'}`}
                    onClick={bc.onClick}
                  >
                    {bc.label}
                  </span>
                  {idx < breadcrumbs.length - 1 && <span className="mx-3 text-slate-700">/</span>}
                </React.Fragment>
              ))}
            </div>
          )}
          <h1 className="text-4xl font-bold tracking-tight text-white mb-1 drop-shadow-md">{title}</h1>
          {subtitle && <p className="text-sm text-blue-400/80 font-medium tracking-wide">{subtitle}</p>}
        </div>
      </div>
      
      {actions && (
        <div className="mt-6 md:mt-0 flex items-center space-x-4 relative z-10">
          {actions}
        </div>
      )}
    </div>
  );
};
