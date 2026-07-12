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
    <div className={`glass-panel p-[var(--space-3)] sm:p-[var(--space-4)] flex flex-col ${className}`}>
      {(title || description || actions) && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-[var(--space-3)]">
          <div className="flex items-center">
            {icon && <div className="mr-[var(--space-1-5)] text-[var(--color-brand)]">{icon}</div>}
            <div>
              {title && <h2 className="text-title font-semibold text-[var(--text-primary)]">{title}</h2>}
              {description && <p className="text-body text-[var(--text-secondary)] mt-[var(--space-05)]">{description}</p>}
            </div>
          </div>
          {actions && <div className="mt-[var(--space-2)] sm:mt-0">{actions}</div>}
        </div>
      )}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};
