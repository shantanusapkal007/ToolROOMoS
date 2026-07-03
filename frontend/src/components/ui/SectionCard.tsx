import React from 'react';

interface SectionCardProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, description, icon, actions, children, className = '' }) => {
  return (
    <div className={`glass-panel p-6 sm:p-8 flex flex-col ${className}`}>
      {(title || description || actions) && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div className="flex items-center">
            {icon && <div className="mr-3 text-blue-500">{icon}</div>}
            <div>
              {title && <h2 className="text-h4 font-semibold text-white">{title}</h2>}
              {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
            </div>
          </div>
          {actions && <div className="mt-4 sm:mt-0">{actions}</div>}
        </div>
      )}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};
