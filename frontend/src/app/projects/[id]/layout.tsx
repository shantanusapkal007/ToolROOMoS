"use client";

import React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProject } from "@/hooks/useProjects";
import { 
  Briefcase, 
  Layers, 
  Cpu, 
  Wrench, 
  Truck, 
  ShieldCheck, 
  PackageCheck, 
  DollarSign, 
  CheckSquare, 
  Calendar, 
  Building2,
  ArrowLeft,
  Activity,
  ShoppingCart
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/formatters";

export default function ProjectDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const id = params?.id as string;

  const { data: project } = useProject(id);

  const tabs = [
    { label: "Overview", path: `/projects/${id}/overview`, icon: Briefcase },
    { label: "Design", path: `/projects/${id}/design`, icon: Layers },
    { label: "Engineering", path: `/projects/${id}/engineering`, icon: Cpu },
    { label: "Purchase", path: `/projects/${id}/purchase`, icon: ShoppingCart },
    { label: "Inventory", path: `/projects/${id}/inventory`, icon: PackageCheck },
    { label: "Subcontract", path: `/projects/${id}/subcontract`, icon: Truck },
    { label: "Production", path: `/projects/${id}/production`, icon: Wrench },
    { label: "Assembly", path: `/projects/${id}/assembly`, icon: Activity },
    { label: "Quality", path: `/projects/${id}/quality`, icon: ShieldCheck },
    { label: "Dispatch", path: `/projects/${id}/dispatch`, icon: Truck },
    { label: "Finance", path: `/projects/${id}/finance`, icon: DollarSign },
    { label: "Tasks", path: `/projects/${id}/tasks`, icon: CheckSquare },
  ];

  return (
    <AppLayout noPadding>
      <div className="w-full h-full flex flex-col min-h-0 overflow-hidden">
        {/* Sub Header */}
        <div className="w-full bg-white border-b border-border-gray px-6 py-4 shrink-0 shadow-subtle">
          <div className="max-w-[1440px] mx-auto flex flex-col gap-3">
            
            {/* Upper Action Bar & Breadcrumb */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/projects')}
                  className="px-2.5 py-1.5 rounded-[10px] border border-border-gray hover:bg-[rgba(148,151,169,0.08)] text-cool-gray hover:text-ink transition-colors flex items-center gap-1.5 text-caption font-medium shadow-subtle"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Projects</span>
                </button>

                <span className="text-silver-blue/60">/</span>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-[6px] text-micro font-semibold font-mono bg-primary-subtle text-primary border border-primary/20">
                    {project?.projectNumber || id}
                  </span>
                  <h1 className="text-sub-heading font-bold text-ink tracking-tight">
                    {project?.partName || "Project Workspace"}
                  </h1>
                </div>
              </div>

              {project?.currentStage && (
                <div className="flex items-center gap-2">
                  <span className="text-micro font-semibold text-silver-blue uppercase tracking-wider">Stage:</span>
                  <span className="px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-primary text-white tracking-wide uppercase shadow-subtle">
                    {project.currentStage.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Metadata Bar */}
            {project && (
              <div className="flex items-center gap-6 text-caption text-cool-gray pt-1 border-t border-border-gray">
                {project.customer?.companyName && (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-silver-blue" />
                    <span className="font-semibold text-ink">{project.customer.companyName}</span>
                  </div>
                )}
                {project.customerPoNumber && (
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-silver-blue font-sans">PO #:</span>
                    <span className="font-semibold text-ink">{project.customerPoNumber}</span>
                  </div>
                )}
                {project.targetDeliveryDate && (
                  <div className="flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-silver-blue" />
                    <span>Target: {formatDate(project.targetDeliveryDate)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Sub-Navigation Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pt-2 scrollbar-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = pathname === tab.path || pathname?.startsWith(`${tab.path}/`);
                return (
                  <Link
                    key={tab.path}
                    href={tab.path}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-[10px] text-caption font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-primary text-white font-semibold shadow-subtle"
                        : "text-cool-gray hover:text-ink hover:bg-[rgba(148,151,169,0.08)]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </div>

          </div>
        </div>

        {/* Scrollable View Content */}
        <div className="flex-1 w-full max-w-[1440px] mx-auto overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </AppLayout>
  );
}
