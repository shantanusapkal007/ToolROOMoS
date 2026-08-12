"use client";

import React from "react";
import { 
  Layers, 
  Check, 
  FileText, 
  FileCheck, 
  ClipboardCheck, 
  Briefcase, 
  Box, 
  FileSpreadsheet, 
  Cpu, 
  Wrench, 
  Gauge, 
  ShieldCheck, 
  Truck, 
  CheckCircle2 
} from "lucide-react";

export interface ToolingWorkflowStepperProps {
  currentStage?: string;
  activeDepartment?: string;
}

const STEPPER_STAGES = [
  { id: "ENQUIRY", num: "01", label: "ENQUIRY / RFQ", icon: FileText, dept: "SALES & ESTIMATION" },
  { id: "QUOTATION", num: "02", label: "QUOTATION", icon: FileCheck, dept: "ESTIMATION & COSTING" },
  { id: "ORDER_CONFIRMED", num: "03", label: "ORDER CONFIRMED", icon: ClipboardCheck, dept: "PROJECT PLANNING" },
  { id: "PROJECT_CREATED", num: "04", label: "PROJECT CREATED", icon: Briefcase, dept: "PROJECT MANAGEMENT" },
  { id: "DESIGN_CAD", num: "05", label: "DESIGN CAD", icon: Box, dept: "TOOL DESIGN" },
  { id: "BOM_PROCUREMENT", num: "06", label: "BOM & PROCUREMENT", icon: FileSpreadsheet, dept: "ENGINEERING" },
  { id: "CAM_MACHINING", num: "07", label: "CAM & MACHINING", icon: Cpu, dept: "CNC / VMC SHOP" },
  { id: "BENCH_ASSEMBLY", num: "08", label: "BENCH ASSEMBLY", icon: Wrench, dept: "TOOLROOM FITTING" },
  { id: "TRYOUT", num: "09", label: "PRESS TRYOUT", icon: Gauge, dept: "PRESS SHOP" },
  { id: "QUALITY_INSPECTION", num: "10", label: "QUALITY INSPECTION", icon: ShieldCheck, dept: "QUALITY ASSURANCE" },
  { id: "DISPATCH", num: "11", label: "DISPATCH", icon: Truck, dept: "LOGISTICS & STORES" },
  { id: "CLOSED", num: "12", label: "CLOSED", icon: CheckCircle2, dept: "COMMERCIAL & FINANCE" },
];

const STAGE_INDEX_MAP: Record<string, number> = {
  ENQUIRY: 0,
  QUOTATION: 1,
  ORDER_CONFIRMED: 2,
  CREATED: 3,
  PROJECT_CREATED: 3,
  DESIGN_CAD: 4,
  DESIGN: 4,
  ENGINEERING: 5,
  BOM_PROCUREMENT: 5,
  PURCHASE: 5,
  INVENTORY: 5,
  CAM_PROGRAMMING: 6,
  CAM_MACHINING: 6,
  MACHINING: 6,
  PRODUCTION: 6,
  SUBCONTRACT: 6,
  BENCH_ASSEMBLY: 7,
  ASSEMBLY: 7,
  TRYOUT: 8,
  QUALITY_INSPECTION: 9,
  INSPECTION: 9,
  QUALITY: 9,
  DISPATCH_READY: 10,
  DISPATCHED: 10,
  DISPATCH: 10,
  INVOICED: 11,
  CLOSED: 11,
};

export function ToolingWorkflowStepper({ currentStage = "ENGINEERING" }: ToolingWorkflowStepperProps) {
  const normalizedStage = (currentStage || "ENGINEERING").toUpperCase();
  const currentStageIdx = STAGE_INDEX_MAP[normalizedStage] ?? 5;
  const isClosedProject = normalizedStage === "CLOSED" || normalizedStage === "COMPLETED";

  const row1 = STEPPER_STAGES.slice(0, 6);
  const row2 = STEPPER_STAGES.slice(6, 12);

  return (
    <div className="bg-white border border-border-gray p-5 rounded-[12px] shadow-subtle font-sans space-y-4">
      {/* Stepper Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-[10px] bg-primary-subtle text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-2xs">
          <Layers className="w-4.5 h-4.5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-ink tracking-tight">
            Tooling Workflow Pipeline Stepper
          </h3>
          <p className="text-[11px] text-mute mt-0.5">
            Track and monitor the progress of tooling workflow across all stages.
          </p>
        </div>
      </div>

      {/* Pipeline Stepper Container */}
      <div className="space-y-6 pt-1">
        {/* ROW 1: Steps 01 to 06 */}
        <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Horizontal Connecting Line across Row 1 aligned with top circle badges */}
          <div className="hidden lg:block absolute top-[11px] left-[8.33%] right-[8.33%] h-0.5 pointer-events-none z-0">
            <div className="w-full h-full flex items-center">
              {row1.slice(0, 5).map((_, idx) => {
                const isLineCompleted = isClosedProject ? true : idx < currentStageIdx;
                const isLineActive = isClosedProject ? false : idx === currentStageIdx;
                return (
                  <div key={idx} className="flex-1">
                    {isLineCompleted ? (
                      <div className="h-0.5 bg-semantic-success" />
                    ) : isLineActive ? (
                      <div className="h-0.5 bg-primary" />
                    ) : (
                      <div className="h-0 border-t-2 border-dashed border-border-gray" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {row1.map((step, idx) => {
            const isCompleted = isClosedProject ? true : idx < currentStageIdx;
            const isCurrent = isClosedProject ? false : idx === currentStageIdx;
            const Icon = step.icon;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                {/* Node Circle Badge at Top */}
                <div className="relative z-10 flex items-center justify-center h-6">
                  {isCompleted ? (
                    <div className="w-5.5 h-5.5 rounded-full bg-semantic-success text-white flex items-center justify-center border-2 border-white dark:border-canvas shadow-2xs">
                      <Check className="w-3 h-3 stroke-[3] text-white" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-6.5 h-6.5 rounded-full bg-primary text-white font-bold text-[10px] flex items-center justify-center border-2 border-white dark:border-canvas ring-4 ring-primary/20 shadow-xs">
                      {step.num.replace(/^0/, '')}
                    </div>
                  ) : (
                    <div className="w-5.5 h-5.5 rounded-full bg-white text-cool-gray font-semibold text-[10px] flex items-center justify-center border border-border-gray shadow-2xs">
                      {step.num.replace(/^0/, '')}
                    </div>
                  )}
                </div>

                {/* Card Container below Node Badge */}
                <div
                  className={`w-full mt-2.5 rounded-[10px] p-2.5 sm:p-3 text-left transition-all ${
                    isCurrent
                      ? "bg-primary-subtle border-2 border-primary shadow-sm ring-2 ring-primary/20"
                      : isCompleted
                      ? "bg-semantic-success-subtle border border-semantic-success/30 shadow-2xs"
                      : "bg-white border border-border-gray shadow-2xs"
                  }`}
                >
                  {/* Top Header inside Card */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-[4px] ${
                        isCurrent
                          ? "text-primary bg-primary-subtle border border-primary/30"
                          : isCompleted
                          ? "text-semantic-success-dark bg-semantic-success-subtle border border-semantic-success/30"
                          : "text-cool-gray bg-canvas border border-border-gray"
                      }`}
                    >
                      {step.num}
                    </span>

                    <div
                      className={`w-6 h-6 rounded-[6px] flex items-center justify-center ${
                        isCurrent
                          ? "bg-primary-subtle text-primary"
                          : isCompleted
                          ? "bg-semantic-success-subtle text-semantic-success"
                          : "bg-canvas text-cool-gray border border-border-gray"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Stage Title */}
                  <h4 className="text-[11px] font-bold text-ink uppercase tracking-tight mt-2 mb-2 min-h-[22px] flex items-center leading-tight">
                    {step.label}
                  </h4>

                  {/* Status Badge */}
                  <div>
                    {isCurrent ? (
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-primary-subtle text-primary border border-primary/30 inline-flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-primary animate-ping" />
                        <span>IN PROGRESS</span>
                      </span>
                    ) : isCompleted ? (
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/30 inline-block">
                        {step.id === 'CLOSED' ? 'CLOSED' : 'COMPLETED'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-medium uppercase tracking-wider bg-canvas text-cool-gray border border-border-gray inline-flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-cool-gray/50" />
                        <span>PENDING</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ROW 2: Steps 07 to 12 */}
        <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 pt-1">
          {/* Horizontal Connecting Line across Row 2 aligned with top circle badges */}
          <div className="hidden lg:block absolute top-[11px] left-[8.33%] right-[8.33%] h-0.5 pointer-events-none z-0">
            <div className="w-full h-full flex items-center">
              {row2.slice(0, 5).map((_, idx) => {
                const globalIdx = idx + 6;
                const isLineCompleted = isClosedProject ? true : globalIdx < currentStageIdx;
                const isLineActive = isClosedProject ? false : globalIdx === currentStageIdx;
                return (
                  <div key={idx} className="flex-1">
                    {isLineCompleted ? (
                      <div className="h-0.5 bg-semantic-success" />
                    ) : isLineActive ? (
                      <div className="h-0.5 bg-primary" />
                    ) : (
                      <div className="h-0 border-t-2 border-dashed border-border-gray" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {row2.map((step, idx) => {
            const globalIdx = idx + 6;
            const isCompleted = isClosedProject ? true : globalIdx < currentStageIdx;
            const isCurrent = isClosedProject ? false : globalIdx === currentStageIdx;
            const Icon = step.icon;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                {/* Node Circle Badge at Top */}
                <div className="relative z-10 flex items-center justify-center h-6">
                  {isCompleted ? (
                    <div className="w-5.5 h-5.5 rounded-full bg-semantic-success text-white flex items-center justify-center border-2 border-white dark:border-canvas shadow-2xs">
                      <Check className="w-3 h-3 stroke-[3] text-white" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-6.5 h-6.5 rounded-full bg-primary text-white font-bold text-[10px] flex items-center justify-center border-2 border-white dark:border-canvas ring-4 ring-primary/20 shadow-xs">
                      {step.num}
                    </div>
                  ) : (
                    <div className="w-5.5 h-5.5 rounded-full bg-white text-cool-gray font-semibold text-[10px] flex items-center justify-center border border-border-gray shadow-2xs">
                      {step.num.replace(/^0/, '')}
                    </div>
                  )}
                </div>

                {/* Card Container below Node Badge */}
                <div
                  className={`w-full mt-2.5 rounded-[10px] p-2.5 sm:p-3 text-left transition-all ${
                    isCurrent
                      ? "bg-primary-subtle border-2 border-primary shadow-sm ring-2 ring-primary/20"
                      : isCompleted
                      ? "bg-semantic-success-subtle border border-semantic-success/30 shadow-2xs"
                      : "bg-white border border-border-gray shadow-2xs"
                  }`}
                >
                  {/* Top Header inside Card */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-[4px] ${
                        isCurrent
                          ? "text-primary bg-primary-subtle border border-primary/30"
                          : isCompleted
                          ? "text-semantic-success-dark bg-semantic-success-subtle border border-semantic-success/30"
                          : "text-cool-gray bg-canvas border border-border-gray"
                      }`}
                    >
                      {step.num}
                    </span>

                    <div
                      className={`w-6 h-6 rounded-[6px] flex items-center justify-center ${
                        isCurrent
                          ? "bg-primary-subtle text-primary"
                          : isCompleted
                          ? "bg-semantic-success-subtle text-semantic-success"
                          : "bg-canvas text-cool-gray border border-border-gray"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Stage Title */}
                  <h4 className="text-[11px] font-bold text-ink uppercase tracking-tight mt-2 mb-2 min-h-[22px] flex items-center leading-tight">
                    {step.label}
                  </h4>

                  {/* Status Badge */}
                  <div>
                    {isCurrent ? (
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-primary-subtle text-primary border border-primary/30 inline-flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-primary animate-ping" />
                        <span>IN PROGRESS</span>
                      </span>
                    ) : isCompleted ? (
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/30 inline-block">
                        {step.id === 'CLOSED' ? 'CLOSED' : 'COMPLETED'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-medium uppercase tracking-wider bg-canvas text-cool-gray border border-border-gray inline-flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-cool-gray/50" />
                        <span>PENDING</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
