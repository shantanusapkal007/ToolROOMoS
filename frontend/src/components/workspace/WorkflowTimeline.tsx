"use client";

import { Check, Circle, ArrowRight } from "lucide-react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface WorkflowTimelineProps {
  currentStage: string;
}

export function WorkflowTimeline({ currentStage }: WorkflowTimelineProps) {
  const stages = [
    { id: "CREATED", label: "Project", color: "text-zinc-600", hex: "#52525b" },
    { id: "ENGINEERING", label: "Engineering", color: "text-blue-600", hex: "#2563eb" },
    { id: "PROCUREMENT", label: "Purchase", color: "text-amber-600", hex: "#d97706" },
    { id: "MATERIAL_AVAILABLE", label: "Inventory", color: "text-emerald-600", hex: "#059669" },
    { id: "PRODUCTION", label: "Production", color: "text-purple-600", hex: "#9333ea" },
    { id: "INSPECTION", label: "Quality", color: "text-cyan-600", hex: "#0891b2" },
    { id: "DISPATCH_READY", label: "Dispatch", color: "text-orange-600", hex: "#ea580c" },
    { id: "INVOICED", label: "Finance", color: "text-green-600", hex: "#16a34a" },
  ];

  const currentIndex = stages.findIndex(s => s.id === currentStage);
  const normalizedIndex = currentIndex === -1 ? 0 : currentIndex;

  const springConfig = { type: "spring" as any, stiffness: 200, damping: 20 };

  return (
    <div className="w-full py-12 mb-8 overflow-x-auto hide-scrollbar relative">
      <div className="flex items-center min-w-max px-8">
        {stages.map((stage, idx) => {
          const isPast = idx < normalizedIndex;
          const isCurrent = idx === normalizedIndex;
          const isFuture = idx > normalizedIndex;

          return (
            <div key={stage.id} className="flex items-center group relative">
              
              {/* Stage Node */}
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: idx * 0.1, ...springConfig }}
                className="relative flex flex-col items-center justify-center z-10 cursor-pointer"
              >
                {/* Node Hover Glow */}
                <div className="absolute inset-0 bg-black/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />

                <motion.div 
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-500 z-10 relative overflow-hidden bg-white ${
                    isPast ? `border border-black/10 ${stage.color}` : 
                    isCurrent ? `${stage.color} border-2 border-current shadow-md` : 
                    "text-zinc-400 border border-black/5"
                  }`}
                >
                  {isPast && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={springConfig}>
                      <Check className="h-5 w-5" />
                    </motion.div>
                  )}
                  {isCurrent && (
                    <motion.div 
                      initial={{ x: -10, opacity: 0 }} 
                      animate={{ x: 0, opacity: 1 }} 
                      transition={springConfig}
                    >
                      <ArrowRight className="h-5 w-5" />
                      <div className={`absolute inset-0 bg-[${stage.hex}] opacity-20 animate-ping rounded-full`} />
                    </motion.div>
                  )}
                  {isFuture && <Circle className="h-3 w-3 opacity-50" />}
                </motion.div>
                
                {/* Stage Label */}
                <motion.span 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 + 0.1 }}
                  className={`absolute top-16 text-micro font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                    isCurrent ? `text-zinc-900` : 
                    isPast ? "text-zinc-500" : "text-zinc-400"
                  }`}
                >
                  {stage.label}
                </motion.span>
              </motion.div>

              {/* Connecting Line */}
              {idx < stages.length - 1 && (
                <div className="w-24 h-[2px] mx-2 relative overflow-hidden bg-black/5 rounded-full">
                  <motion.div 
                    initial={{ scaleX: 0, transformOrigin: "left" }}
                    animate={{ scaleX: isPast ? 1 : 0 }}
                    transition={{ delay: idx * 0.1 + 0.2, duration: 0.5, ease: "easeInOut" }}
                    className="absolute inset-0 h-full bg-zinc-400"
                  />
                  {/* Current Active Line Pulse */}
                  {isCurrent && (
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
