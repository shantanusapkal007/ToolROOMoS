"use client";

import React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
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
  User, 
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

  const { data: project, isLoading } = useProject(id);

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
    <div className="flex h-screen w-screen overflow-hidden text-zinc-900 font-sans bg-[#F8F9FA]">
      <Sidebar />
      <main className="flex-1 h-full flex flex-col relative pl-16 overflow-hidden">
        {/* Top Floating Glass Header */}
        <div className="w-full bg-white/80 backdrop-blur-md border-b border-zinc-200/80 px-6 py-4 shrink-0 shadow-2xs">
          <div className="max-w-[1440px] mx-auto flex flex-col gap-3">
            
            {/* Upper Action Bar & Breadcrumb */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/projects')}
                  className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-600 transition-colors flex items-center gap-1 text-xs font-semibold"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Projects</span>
                </button>

                <span className="text-zinc-300">/</span>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-micro font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                    {project?.projectNumber || id}
                  </span>
                  <h1 className="text-lg font-bold text-zinc-900 tracking-tight">
                    {project?.partName || "Project Workspace"}
                  </h1>
                </div>
              </div>

              {project?.currentStage && (
                <div className="flex items-center gap-2">
                  <span className="text-micro font-semibold text-zinc-500 uppercase tracking-wider">Stage:</span>
                  <span className="px-2.5 py-1 rounded-md text-micro font-bold bg-zinc-900 text-white tracking-wide uppercase">
                    {project.currentStage.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Metadata Bar */}
            {project && (
              <div className="flex items-center gap-6 text-xs text-zinc-600 pt-1 border-t border-zinc-100">
                {project.customer?.companyName && (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="font-semibold text-zinc-800">{project.customer.companyName}</span>
                  </div>
                )}
                {project.customerPoNumber && (
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-zinc-400 font-sans">PO #:</span>
                    <span className="font-semibold text-zinc-800">{project.customerPoNumber}</span>
                  </div>
                )}
                {project.targetDeliveryDate && (
                  <div className="flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
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
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-zinc-900 text-white shadow-xs"
                        : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
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
      </main>
    </div>
  );
}
