"use client";

import React, { useRef } from 'react';

interface SectionCardProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, description, icon, actions, children, className = '' }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`glass-panel spotlight-card p-6 sm:p-8 flex flex-col ${className}`}
    >
      {(title || description || actions) && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 relative z-10">
          <div className="flex items-center">
            {icon && (
              <div className="w-10 h-10 mr-4 rounded-xl bg-blue-500/8 text-blue-600 border border-blue-500/15 flex items-center justify-center shadow-inner">
                {React.cloneElement(icon as React.ReactElement<{className?: string}>, { className: 'w-5 h-5' })}
              </div>
            )}
            <div>
              {title && <h2 className="text-title font-semibold text-zinc-900 tracking-tight">{title}</h2>}
              {description && <p className="text-sm text-zinc-500 mt-0.5 tracking-wide">{description}</p>}
            </div>
          </div>
          {actions && <div className="mt-4 sm:mt-0">{actions}</div>}
        </div>
      )}
      <div className="flex-1 relative z-10">
        {children}
      </div>
    </div>
  );
};
