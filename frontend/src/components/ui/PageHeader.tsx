import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; onClick?: () => void }[];
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, breadcrumbs, actions }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 shrink-0">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center text-sm font-semibold text-slate-500 mb-4 uppercase tracking-widest">
            {breadcrumbs.map((bc, idx) => (
              <React.Fragment key={idx}>
                <span 
                  className={`${bc.onClick ? 'hover:text-white cursor-pointer transition-colors' : 'text-blue-400'}`}
                  onClick={bc.onClick}
                >
                  {bc.label}
                </span>
                {idx < breadcrumbs.length - 1 && <span className="mx-2">/</span>}
              </React.Fragment>
            ))}
          </div>
        )}
        <h1 className="text-h1 tracking-tight text-white mb-2">{title}</h1>
        {subtitle && <p className="text-h6 text-slate-400 font-normal">{subtitle}</p>}
      </div>
      
      {actions && (
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          {actions}
        </div>
      )}
    </div>
  );
};
