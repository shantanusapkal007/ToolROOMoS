"use client";

import { Check, Circle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface WorkflowTimelineProps {
  currentStage: string;
}

export function WorkflowTimeline({ currentStage }: WorkflowTimelineProps) {
  const stages = [
    { id: "CREATED", label: "Project", color: "text-body-mid" },
    { id: "ENGINEERING", label: "Engineering", color: "text-accent-blue-info" },
    { id: "PROCUREMENT", label: "Purchase", color: "text-accent-orange" },
    { id: "MATERIAL_AVAILABLE", label: "Inventory", color: "text-accent-green" },
    { id: "PRODUCTION", label: "Production", color: "text-accent-purple" },
    { id: "INSPECTION", label: "Quality", color: "text-accent-blue-deep" },
    { id: "DISPATCH_READY", label: "Dispatch", color: "text-accent-orange" },
    { id: "INVOICED", label: "Finance", color: "text-accent-green" },
  ];

  const currentIndex = stages.findIndex(s => s.id === currentStage);
  const normalizedIndex = currentIndex === -1 ? 0 : currentIndex;

  const springConfig = { type: "spring" as any, stiffness: 200, damping: 20 };

  return (
    <div className="w-full py-10 mb-6 overflow-x-auto hide-scrollbar relative">
      <div className="flex items-center min-w-max px-8">
        {stages.map((stage, idx) => {
          const isPast = idx < normalizedIndex;
          const isCurrent = idx === normalizedIndex;
          const isFuture = idx > normalizedIndex;

          return (
            <div key={stage.id} className="flex items-center group relative">
              
              {/* Stage Node (Circular icon indicator) */}
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: idx * 0.1, ...springConfig }}
                className="relative flex flex-col items-center justify-center z-10 cursor-pointer"
              >
                <motion.div 
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors duration-200 z-10 relative bg-canvas ${
                    isPast ? `border border-hairline ${stage.color}` : 
                    isCurrent ? `${stage.color} border-2 border-primary shadow-level-1` : 
                    "text-mute border border-hairline/60"
                  }`}
                >
                  {isPast && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={springConfig}>
                      <Check className="h-4 w-4" />
                    </motion.div>
                  )}
                  {isCurrent && (
                    <motion.div 
                      initial={{ x: -6, opacity: 0 }} 
                      animate={{ x: 0, opacity: 1 }} 
                      transition={springConfig}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </motion.div>
                  )}
                  {isFuture && <Circle className="h-2.5 w-2.5 opacity-40" />}
                </motion.div>
                
                {/* Stage Label */}
                <motion.span 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 + 0.1 }}
                  className={`absolute top-14 text-eyebrow-uppercase-sm font-medium uppercase whitespace-nowrap transition-colors duration-200 ${
                    isCurrent ? "text-ink font-semibold" : 
                    isPast ? "text-body-mid" : "text-mute"
                  }`}
                >
                  {stage.label}
                </motion.span>
              </motion.div>

              {/* Connecting Line */}
              {idx < stages.length - 1 && (
                <div className="w-20 h-[2px] mx-2 relative overflow-hidden bg-hairline">
                  <motion.div 
                    initial={{ scaleX: 0, transformOrigin: "left" }}
                    animate={{ scaleX: isPast ? 1 : 0 }}
                    transition={{ delay: idx * 0.1 + 0.2, duration: 0.4, ease: "easeInOut" }}
                    className="absolute inset-0 h-full bg-body-mid"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
