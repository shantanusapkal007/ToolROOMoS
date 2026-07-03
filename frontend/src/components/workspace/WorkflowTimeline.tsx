"use client";

import { Check, Circle, ArrowRight } from "lucide-react";

interface WorkflowTimelineProps {
  currentStage: string;
}

export function WorkflowTimeline({ currentStage }: WorkflowTimelineProps) {
  const stages = [
    { id: "CREATED", label: "Project", color: "text-slate-400" },
    { id: "ENGINEERING", label: "Engineering", color: "text-blue-500" },
    { id: "PROCUREMENT", label: "Purchase", color: "text-amber-500" },
    { id: "MATERIAL_AVAILABLE", label: "Inventory", color: "text-emerald-500" },
    { id: "PRODUCTION", label: "Production", color: "text-purple-500" },
    { id: "INSPECTION", label: "Quality", color: "text-cyan-500" },
    { id: "DISPATCH_READY", label: "Dispatch", color: "text-orange-500" },
    { id: "INVOICED", label: "Finance", color: "text-green-500" },
  ];

  // Find index of current stage to determine past/future
  const currentIndex = stages.findIndex(s => s.id === currentStage);
  const normalizedIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="w-full py-8 mb-8 overflow-x-auto hide-scrollbar">
      <div className="flex items-center min-w-max px-4">
        {stages.map((stage, idx) => {
          const isPast = idx < normalizedIndex;
          const isCurrent = idx === normalizedIndex;
          const isFuture = idx > normalizedIndex;

          return (
            <div key={stage.id} className="flex items-center group">
              {/* Stage Node */}
              <div className="relative flex flex-col items-center justify-center">
                <div 
                  className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${
                    isPast ? `bg-white/10 ${stage.color}` : 
                    isCurrent ? `${stage.color} bg-white/5 shadow-[0_0_20px_currentColor] border border-current scale-110` : 
                    "bg-slate-900/50 text-slate-600 border border-slate-800"
                  }`}
                >
                  {isPast ? <Check className="h-5 w-5" /> : 
                   isCurrent ? <ArrowRight className="h-5 w-5" /> : 
                   <Circle className="h-3 w-3" />}
                </div>
                
                {/* Stage Label */}
                <span 
                  className={`absolute top-14 text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                    isCurrent ? `text-white drop-shadow-md` : 
                    isPast ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {stage.label}
                </span>
              </div>

              {/* Connecting Line */}
              {idx < stages.length - 1 && (
                <div className={`h-[2px] w-16 mx-2 transition-all duration-500 ${
                  isPast ? `bg-gradient-to-r from-white/20 to-white/20` : "bg-slate-800"
                }`}></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
