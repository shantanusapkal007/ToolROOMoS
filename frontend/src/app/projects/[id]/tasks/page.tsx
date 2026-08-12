"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useProject } from "@/hooks/useProjects";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { projectKeys } from "@/hooks/useProjects";
import {
  CheckSquare,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CircleDot,
  Circle,
  Lock,
  Calendar,
  User,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SkeletonBox } from "@/components/ui/SkeletonLoader";
import { useToast } from "@/components/ui/Toast";

type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  PENDING: {
    label: "Pending",
    color: "text-cool-gray",
    bg: "bg-canvas",
    border: "border-border-gray",
    icon: <Circle className="w-3.5 h-3.5" />,
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-primary",
    bg: "bg-primary-subtle",
    border: "border-primary/20",
    icon: <CircleDot className="w-3.5 h-3.5" />,
  },
  COMPLETED: {
    label: "Completed",
    color: "text-semantic-success-dark",
    bg: "bg-semantic-success-subtle",
    border: "border-semantic-success/20",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  BLOCKED: {
    label: "Blocked",
    color: "text-semantic-danger-dark",
    bg: "bg-semantic-danger-subtle",
    border: "border-semantic-danger/20",
    icon: <Lock className="w-3.5 h-3.5" />,
  },
};

const PRIORITY_OPTIONS = ["LOW", "NORMAL", "HIGH", "CRITICAL"];
const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  LOW: { label: "Low", color: "text-mute", bg: "bg-canvas", border: "border-border-gray" },
  NORMAL: { label: "Normal", color: "text-primary", bg: "bg-primary-subtle", border: "border-primary/20" },
  HIGH: { label: "High", color: "text-semantic-warning-dark", bg: "bg-semantic-warning-subtle", border: "border-semantic-warning/20" },
  CRITICAL: { label: "Critical", color: "text-semantic-danger-dark", bg: "bg-semantic-danger-subtle", border: "border-semantic-danger/20" },
};

const emptyForm = {
  title: "",
  description: "",
  assignedTo: "",
  startDate: "",
  startTime: "",
  dueDate: "",
  endTime: "",
  status: "PENDING",
  priority: "NORMAL",
};

export default function ProjectTasksPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: project, isLoading } = useProject(id);
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [deletingTask, setDeletingTask] = useState<any>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    api.get('master-data/employees').then((res: any) => {
      const data = res.data?.data || res.data || [];
      setEmployees(Array.isArray(data) ? data.filter((e: any) => e.status === 'ACTIVE' || !e.status) : []);
    }).catch(() => {});
  }, []);

  if (isLoading) return <SkeletonBox className="h-64 w-full" />;

  const tasks = project?.projectTasks || [];

  const filteredTasks = filterStatus === "ALL"
    ? tasks
    : tasks.filter((t: any) => t.status === filterStatus);

  const taskStats = {
    total: tasks.length,
    pending: tasks.filter((t: any) => t.status === "PENDING").length,
    inProgress: tasks.filter((t: any) => t.status === "IN_PROGRESS").length,
    completed: tasks.filter((t: any) => t.status === "COMPLETED").length,
    blocked: tasks.filter((t: any) => t.status === "BLOCKED").length,
  };

  const completionPercent = taskStats.total > 0
    ? Math.round((taskStats.completed / taskStats.total) * 100)
    : 0;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post(`projects/${id}/tasks`, formData);
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      setShowCreateModal(false);
      setFormData({ ...emptyForm });
      success("Task Created", "Action item added to the project task register.");
    } catch (err: any) {
      const msg = err.response?.data?.message;
      error("Create Failed", Array.isArray(msg) ? msg.join(", ") : (msg || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (task: any) => {
    setEditingTask(task);
    setFormData({
      title: task.taskName || "",
      description: task.description || "",
      assignedTo: task.assignedTo || "",
      startDate: task.startDate ? task.startDate.split("T")[0] : "",
      startTime: task.startDate ? task.startDate.split("T")[1]?.slice(0, 5) || "" : "",
      dueDate: task.endDate ? task.endDate.split("T")[0] : "",
      endTime: task.endDate ? task.endDate.split("T")[1]?.slice(0, 5) || "" : "",
      status: task.status || "PENDING",
      priority: "NORMAL",
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    setIsSubmitting(true);
    try {
      await api.put(`projects/${id}/tasks/${editingTask.id}`, formData);
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      setShowEditModal(false);
      setEditingTask(null);
      setFormData({ ...emptyForm });
      success("Task Updated", "Action item updated successfully.");
    } catch (err: any) {
      const msg = err.response?.data?.message;
      error("Update Failed", Array.isArray(msg) ? msg.join(", ") : (msg || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (task: any, newStatus: string) => {
    try {
      await api.patch(`projects/${id}/tasks/${task.id}/status`, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      success("Status Updated", `Task moved to ${STATUS_CONFIG[newStatus as TaskStatus]?.label || newStatus}.`);
    } catch (err: any) {
      error("Update Failed", err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async () => {
    if (!deletingTask) return;
    setIsSubmitting(true);
    try {
      await api.delete(`projects/${id}/tasks/${deletingTask.id}`);
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      setShowDeleteModal(false);
      setDeletingTask(null);
      success("Task Deleted", "Action item removed from the project register.");
    } catch (err: any) {
      error("Delete Failed", err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const isOverdue = (task: any) => {
    if (!task.endDate || task.status === "COMPLETED") return false;
    return new Date(task.endDate) < new Date();
  };

  const isProjectClosed = project?.currentStage === 'CLOSED' || project?.currentStage === 'COMPLETED';

  return (
    <div className="space-y-6 font-sans text-ink">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[12px] border border-border-gray shadow-subtle">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-8 w-8 rounded-[12px] bg-primary flex items-center justify-center shadow-sm shrink-0">
              <CheckSquare className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-ink tracking-tight">Project Action Plan & Task List</h1>
          </div>
          <p className="text-xs text-mute ml-[42px]">
            Milestone checklists, ECN / ECO engineering change action items, and departmental tasks.
          </p>
        </div>

        {!isProjectClosed && (
          <Button variant="primary" size="md" onClick={() => { setFormData({ ...emptyForm }); setShowCreateModal(true); }}>
            <Plus className="w-4 h-4" />
            <span>Create Task Item</span>
          </Button>
        )}
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-[12px] border border-border-gray shadow-subtle">
          <div className="text-[10px] font-semibold text-cool-gray uppercase tracking-wider">Total Tasks</div>
          <div className="text-xl font-semibold text-ink mt-0.5">{taskStats.total}</div>
        </div>
        <div className="bg-white p-3.5 rounded-[12px] border border-border-gray shadow-subtle">
          <div className="text-[10px] font-semibold text-cool-gray uppercase tracking-wider">Pending</div>
          <div className="text-xl font-semibold text-mute mt-0.5">{taskStats.pending}</div>
        </div>
        <div className="bg-white p-3.5 rounded-[12px] border border-border-gray shadow-subtle">
          <div className="text-[10px] font-semibold text-primary uppercase tracking-wider">In Progress</div>
          <div className="text-xl font-semibold text-primary mt-0.5">{taskStats.inProgress}</div>
        </div>
        <div className="bg-white p-3.5 rounded-[12px] border border-border-gray shadow-subtle">
          <div className="text-[10px] font-semibold text-semantic-success-dark uppercase tracking-wider">Completed</div>
          <div className="text-xl font-semibold text-semantic-success-dark mt-0.5">{taskStats.completed}</div>
        </div>
        <div className="bg-white p-3.5 rounded-[12px] border border-border-gray shadow-subtle">
          <div className="text-[10px] font-semibold text-semantic-danger-dark uppercase tracking-wider">Blocked</div>
          <div className="text-xl font-semibold text-semantic-danger-dark mt-0.5">{taskStats.blocked}</div>
        </div>
      </div>

      {/* Progress Bar */}
      {taskStats.total > 0 && (
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-cool-gray">Overall Completion</span>
            <span className="text-xs font-semibold text-ink">{completionPercent}%</span>
          </div>
          <div className="w-full h-2 bg-canvas rounded-full overflow-hidden border border-border-gray/40">
            <div
              className="h-full bg-semantic-success-dark rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Filter Strip */}
      <div className="flex items-center gap-1.5 p-1 bg-canvas rounded-[12px] border border-border-gray overflow-x-auto">
        {[
          { key: "ALL", label: "All" },
          { key: "PENDING", label: "Pending" },
          { key: "IN_PROGRESS", label: "In Progress" },
          { key: "COMPLETED", label: "Completed" },
          { key: "BLOCKED", label: "Blocked" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            className={`px-3.5 py-1.5 rounded-[12px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === f.key
                ? "bg-white text-ink shadow-sm"
                : "text-mute hover:text-ink hover:bg-white/50"
            }`}
          >
            {f.label}
            {f.key !== "ALL" && (
              <span className="ml-1.5 text-[10px] opacity-60">
                {f.key === "PENDING" ? taskStats.pending
                  : f.key === "IN_PROGRESS" ? taskStats.inProgress
                  : f.key === "COMPLETED" ? taskStats.completed
                  : taskStats.blocked}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task Table */}
      <div className="bg-white rounded-[12px] border border-border-gray shadow-subtle overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border-gray flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-ink">Project Task Register</h3>
            <p className="text-[10px] text-mute mt-0.5">
              {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""} shown
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-gray bg-canvas">
                <th className="p-3 font-semibold text-[10px] text-mute uppercase tracking-wider w-[35%]">Task / Action Item</th>
                <th className="p-3 font-semibold text-[10px] text-mute uppercase tracking-wider">Assigned To</th>
                <th className="p-3 font-semibold text-[10px] text-mute uppercase tracking-wider">Start Date</th>
                <th className="p-3 font-semibold text-[10px] text-mute uppercase tracking-wider">Due Date</th>
                <th className="p-3 font-semibold text-[10px] text-mute uppercase tracking-wider text-center">Status</th>
                <th className="p-3 font-semibold text-[10px] text-mute uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-gray">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task: any) => {
                  const statusCfg = STATUS_CONFIG[(task.status as TaskStatus) || "PENDING"];
                  const overdue = isOverdue(task);

                  return (
                    <tr key={task.id} className="hover:bg-canvas/60 transition-colors group">
                      <td className="p-3">
                        <div className="font-semibold text-ink">{task.taskName}</div>
                        {task.description && (
                          <div className="text-[11px] text-cool-gray mt-0.5 line-clamp-1">{task.description}</div>
                        )}
                      </td>
                      <td className="p-3">
                        {task.assignedTo ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-canvas border border-border-gray rounded-[12px] text-ink font-semibold text-[11px]">
                            <User className="w-3 h-3 text-cool-gray" />
                            {task.assignedTo}
                          </span>
                        ) : (
                          <span className="text-cool-gray">—</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-mute">
                        {formatDate(task.startDate)}
                      </td>
                      <td className="p-3 font-mono">
                        <span className={overdue ? "text-semantic-danger-dark font-semibold" : "text-mute"}>
                          {formatDate(task.endDate)}
                          {overdue && <AlertTriangle className="inline w-3 h-3 ml-1 text-semantic-danger-dark" />}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="relative inline-block">
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task, e.target.value)}
                            className={`appearance-none cursor-pointer pl-2 pr-6 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border} focus:outline-none`}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="BLOCKED">Blocked</option>
                          </select>
                          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-40" />
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(task)}
                            className="p-1.5 rounded-[12px] hover:bg-primary-subtle text-cool-gray hover:text-primary transition-colors cursor-pointer"
                            title="Edit Task"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setDeletingTask(task); setShowDeleteModal(true); }}
                            className="p-1.5 rounded-[12px] hover:bg-semantic-danger-subtle text-cool-gray hover:text-semantic-danger-dark transition-colors cursor-pointer"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <CheckSquare className="w-8 h-8 text-cool-gray" />
                      <p className="text-sm font-semibold text-cool-gray">No tasks found</p>
                      <p className="text-xs text-mute">
                        {filterStatus === "ALL"
                          ? "Click 'Create Task Item' to add an action item."
                          : "No tasks match the selected filter."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Task Item"
        subtitle="Add a new action item, milestone, or engineering change task."
        maxWidth="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Task Name / Action Item"
            required
            placeholder="e.g. Complete die design review"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Describe the scope, deliverables, or acceptance criteria..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-canvas border border-border-gray px-3.5 py-2.5 text-sm font-medium text-ink placeholder:text-mute rounded-[12px] shadow-subtle focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary hover:border-border-gray transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider">
                Assigned To
              </label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full h-[var(--size-input)] bg-canvas border border-border-gray px-3 text-sm font-medium text-ink rounded-[12px] shadow-subtle focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary hover:border-border-gray transition-all cursor-pointer"
              >
                <option value="">Select Employee</option>
                {employees.map((emp: any) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name}{emp.designation ? ` — ${emp.designation}` : ''}{emp.department?.departmentName ? ` (${emp.department.departmentName})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full h-[var(--size-input)] bg-canvas border border-border-gray px-3 text-sm font-medium text-ink rounded-[12px] shadow-subtle focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary hover:border-border-gray transition-all cursor-pointer"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
            <Input
              label="Start Time"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
            <Input
              label="End Time"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border-gray">
            <Button variant="white" type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingTask(null); }}
        title="Edit Task Item"
        subtitle={`Editing: ${editingTask?.taskName || ""}`}
        maxWidth="lg"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Task Name / Action Item"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-canvas border border-border-gray px-3.5 py-2.5 text-sm font-medium text-ink placeholder:text-mute rounded-[12px] shadow-subtle focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary hover:border-border-gray transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider">
                Assigned To
              </label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full h-[var(--size-input)] bg-canvas border border-border-gray px-3 text-sm font-medium text-ink rounded-[12px] shadow-subtle focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary hover:border-border-gray transition-all cursor-pointer"
              >
                <option value="">Select Employee</option>
                {employees.map((emp: any) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name}{emp.designation ? ` — ${emp.designation}` : ''}{emp.department?.departmentName ? ` (${emp.department.departmentName})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full h-[var(--size-input)] bg-canvas border border-border-gray px-3 text-sm font-medium text-ink rounded-[12px] shadow-subtle focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary hover:border-border-gray transition-all cursor-pointer"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
            <Input
              label="Start Time"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
            <Input
              label="End Time"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border-gray">
            <Button variant="white" type="button" onClick={() => { setShowEditModal(false); setEditingTask(null); }}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Update Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeletingTask(null); }}
        title="Delete Task"
        subtitle="This action cannot be undone."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-semantic-danger-subtle border border-semantic-danger/20 rounded-[12px]">
            <p className="text-sm text-semantic-danger-dark">
              Are you sure you want to delete <strong>"{deletingTask?.taskName}"</strong>?
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="white" onClick={() => { setShowDeleteModal(false); setDeletingTask(null); }}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isSubmitting}>
              Delete Task
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
