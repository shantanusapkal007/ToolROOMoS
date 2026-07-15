"use client";

import React, { useState, useEffect } from 'react';
import { api } from "@/lib/api";
import { Plus, CheckSquare, Clock, AlignLeft, Target, CalendarDays, Activity, Edit2, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useProjectTasks, useCreateTask, useUpdateTaskStatus, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';

export default function TasksTab({ params }: { params: Promise<{ id: string }> }) {
  const { success, error } = useToast();
  const resolvedParams = React.use(params);
  
  const { data: tasks = [], isLoading: loading } = useProjectTasks(resolvedParams.id);
  const createTaskMutation = useCreateTask(resolvedParams.id);
  const updateTaskStatusMutation = useUpdateTaskStatus(resolvedParams.id);
  const updateTaskMutation = useUpdateTask(resolvedParams.id);
  const deleteTaskMutation = useDeleteTask(resolvedParams.id);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskData, setTaskData] = useState({
    taskName: '',
    description: '',
    assignedTo: '',
    startDate: '',
    endDate: '',
    status: 'PENDING'
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskData.taskName) return;

    try {
      const payload = {
        ...taskData,
        startDate: taskData.startDate ? new Date(taskData.startDate).toISOString() : null,
        endDate: taskData.endDate ? new Date(taskData.endDate).toISOString() : null,
      };

      if (editingTaskId) {
        await updateTaskMutation.mutateAsync({ taskId: editingTaskId, data: payload });
        setEditingTaskId(null);
      } else {
        await createTaskMutation.mutateAsync(payload);
      }

      setTaskData({
        taskName: '',
        description: '',
        assignedTo: '',
        startDate: '',
        endDate: '',
        status: 'PENDING'
      });
      setIsModalOpen(false);
    } catch (err: any) {
      // Handled by hook
    }
  };

  const handleEditTaskClick = (task: any) => {
    setTaskData({
      taskName: task.taskName || '',
      description: task.description || '',
      assignedTo: task.assignedTo || '',
      startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
      endDate: task.endDate ? new Date(task.endDate).toISOString().split('T')[0] : '',
      status: task.status || 'PENDING'
    });
    setEditingTaskId(task.id);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTaskMutation.mutateAsync(taskId);
      } catch (err: any) {
        // Handled by hook
      }
    }
  };

  const handleUpdateStatus = async (taskId: string, status: string) => {
    try {
      await updateTaskStatusMutation.mutateAsync({ taskId, status });
    } catch (err: any) {
      error('Error', 'Failed to update task');
    }
  };

  const calculateProgress = () => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((t: any) => t.status === 'COMPLETED').length;
    return Math.round((completed / tasks.length) * 100);
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-black/5 rounded-xl"></div>;
  }

  return (
    <div className="flex-1 overflow-y-auto pb-12 animate-fade-in relative flex flex-col h-full min-h-0">
      
      <div className="flex justify-between items-center shrink-0 mb-4 bg-white/[0.01] border border-black/5 rounded-xl p-3">
        <div className="flex items-center">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 mr-3 text-orange-400">
            <CheckSquare className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Project Management & Assembly Scheduling</h2>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Completion</span>
            <div className="flex items-center">
              <div className="w-24 h-1.5 bg-black/10 rounded-full overflow-hidden mr-2">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-1000" 
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-zinc-900 font-mono">{calculateProgress()}%</span>
            </div>
          </div>
          <button 
            onClick={() => {
              setTaskData({
                taskName: '',
                description: '',
                assignedTo: '',
                startDate: '',
                endDate: '',
                status: 'PENDING'
              });
              setEditingTaskId(null);
              setIsModalOpen(true);
            }}
            className="group relative px-4 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-lg transition-all duration-300 shadow-elevation"
          >
            <span className="relative z-10 flex items-center text-orange-400 font-bold text-xs">
              <Plus className="w-3 h-3 mr-1.5" />
              Add Task
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
        
        {/* Task List (Left) */}
        <div className="col-span-2 bg-white/[0.01] border border-black/5 rounded-2xl p-4 overflow-y-auto hide-scrollbar">
          <div className="space-y-2 relative z-10">
            {tasks.length > 0 ? tasks.map((task: any) => (
              <div key={task.id} className={`p-4 rounded-xl border flex items-center justify-between group transition-all ${
                task.status === 'COMPLETED' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-black/5 border-black/10 hover:border-orange-500/30 hover:bg-black/10'
              }`}>
                <div className="flex items-center space-x-4">
                  <button onClick={() => handleUpdateStatus(task.id, task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED')}>
                    <div className={`w-6 h-6 rounded flex items-center justify-center border transition-all ${
                      task.status === 'COMPLETED' ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-slate-500 text-transparent group-hover:border-orange-400'
                    }`}>
                      <CheckSquare className="w-4 h-4" />
                    </div>
                  </button>
                  <div>
                    <h3 className={`font-semibold transition-colors ${task.status === 'COMPLETED' ? 'text-emerald-400 line-through opacity-70' : 'text-zinc-900'}`}>
                      {task.taskName}
                    </h3>
                    {task.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {task.startDate && (
                    <div className="flex items-center text-xs text-zinc-500" title="Start Date">
                      <CalendarDays className="w-3 h-3 mr-1" />
                      {new Date(task.startDate).toLocaleDateString()}
                    </div>
                  )}
                  {task.endDate && (
                    <div className="flex items-center text-xs text-zinc-500" title="End Date">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(task.endDate).toLocaleDateString()}
                    </div>
                  )}
                  {task.assignedTo ? (
                    <span className="text-xs font-semibold bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                      {task.assignedTo}
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">Unassigned</span>
                  )}
                  
                  <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-2 transition-opacity pl-2">
                    <button 
                      onClick={() => handleEditTaskClick(task)}
                      className="p-1 hover:bg-black/10 rounded transition-colors text-zinc-500 hover:text-zinc-900"
                      title="Edit Task"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 hover:bg-red-500/20 rounded transition-colors text-slate-500 hover:text-red-400"
                      title="Delete Task"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 border border-dashed border-black/10 rounded-xl">
                <Target className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-zinc-500">No tasks defined. Break down the project into WBS or assembly steps.</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Sidebar (Right) */}
        <div className="col-span-1 space-y-4">
          <div className="bg-white/[0.01] border border-black/5 rounded-2xl p-5 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
             <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest flex items-center mb-4 relative z-10">
               <Activity className="w-4 h-4 mr-2 text-orange-400" />
               Scheduling Insights
             </h3>
             <ul className="space-y-3 text-sm text-zinc-500 relative z-10">
               <li className="flex justify-between">
                 <span>Total Tasks</span>
                 <span className="font-bold text-zinc-900">{tasks.length}</span>
               </li>
               <li className="flex justify-between">
                 <span>Completed</span>
                 <span className="font-bold text-emerald-400">{tasks.filter((t: any) => t.status === 'COMPLETED').length}</span>
               </li>
               <li className="flex justify-between">
                 <span>Pending</span>
                 <span className="font-bold text-orange-400">{tasks.filter((t: any) => t.status === 'PENDING').length}</span>
               </li>
             </ul>
          </div>
        </div>

      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/5 backdrop-blur-xl animate-fade-in">
          <div className="glass-modal w-full max-w-lg p-6 animate-slide-up border border-orange-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[60px] -mr-24 -mt-24 pointer-events-none" />
            <h3 className="text-xl font-bold text-zinc-900 mb-5 relative z-10">
              {editingTaskId ? 'Edit Task Details' : 'Create New Task'}
            </h3>
            
            <form onSubmit={handleCreateTask} className="space-y-4 relative z-10">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Task Name <span className="text-orange-500">*</span></label>
                  <input
                    type="text"
                    autoFocus
                    required
                    value={taskData.taskName}
                    onChange={(e) => setTaskData({ ...taskData, taskName: e.target.value })}
                    placeholder="e.g. Assemble Core Component"
                    className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-orange-500/50 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea
                    value={taskData.description}
                    onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                    placeholder="Task details..."
                    rows={2}
                    className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-orange-500/50 transition-all resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Assigned To</label>
                    <input
                      type="text"
                      value={taskData.assignedTo}
                      onChange={(e) => setTaskData({ ...taskData, assignedTo: e.target.value })}
                      placeholder="e.g. John Doe or Fitter"
                      className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Status</label>
                    <select
                      value={taskData.status}
                      onChange={(e) => setTaskData({ ...taskData, status: e.target.value })}
                      className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-orange-500/50 transition-all appearance-none"
                    >
                      <option value="PENDING" className="bg-[#F4F4F6]">Pending</option>
                      <option value="IN_PROGRESS" className="bg-[#F4F4F6]">In Progress</option>
                      <option value="COMPLETED" className="bg-[#F4F4F6]">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Start Date</label>
                    <input
                      type="date"
                      value={taskData.startDate}
                      onChange={(e) => setTaskData({ ...taskData, startDate: e.target.value })}
                      className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-orange-500/50 transition-all [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">End Date</label>
                    <input
                      type="date"
                      value={taskData.endDate}
                      onChange={(e) => setTaskData({ ...taskData, endDate: e.target.value })}
                      className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-orange-500/50 transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end space-x-3 mt-4 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-600 hover:text-zinc-900 bg-black/5 hover:bg-black/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-xl text-sm font-bold shadow-elevation transition-all"
                >
                  {editingTaskId ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
