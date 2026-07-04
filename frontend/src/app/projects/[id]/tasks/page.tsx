"use client";

import React, { useState, useEffect } from 'react';
import { api } from "@/lib/api";
import { Plus, CheckSquare, Clock, AlignLeft, Target, CalendarDays, Activity } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function TasksTab({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskData, setTaskData] = useState({
    taskName: '',
    description: '',
    assignedTo: '',
    startDate: '',
    endDate: '',
    status: 'PENDING'
  });

  useEffect(() => {
    loadTasks();
  }, [resolvedParams.id]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get(`projects/${resolvedParams.id}/tasks`);
      setTasks(res.data.data || []);
    } catch (err) {
      addToast({ title: 'Error', message: 'Failed to load tasks', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskData.taskName) return;

    try {
      const payload = {
        ...taskData,
        startDate: taskData.startDate ? new Date(taskData.startDate).toISOString() : undefined,
        endDate: taskData.endDate ? new Date(taskData.endDate).toISOString() : undefined,
      };

      await api.post(`projects/${resolvedParams.id}/tasks`, payload);
      setTaskData({
        taskName: '',
        description: '',
        assignedTo: '',
        startDate: '',
        endDate: '',
        status: 'PENDING'
      });
      setIsModalOpen(false);
      loadTasks();
      addToast({ title: 'Success', message: 'Task added', type: 'success' });
    } catch (err) {
      addToast({ title: 'Error', message: 'Failed to create task', type: 'error' });
    }
  };

  const toggleTaskStatus = async (task: any) => {
    try {
      const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      await api.put(`projects/${resolvedParams.id}/tasks/${task.id}`, { status: newStatus });
      loadTasks();
    } catch (err) {
      addToast({ title: 'Error', message: 'Failed to update task', type: 'error' });
    }
  };

  const calculateProgress = () => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    return Math.round((completed / tasks.length) * 100);
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-white/5 rounded-xl"></div>;
  }

  return (
    <div className="flex-1 overflow-y-auto pb-32 animate-fade-in relative">
      
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center">
            <CheckSquare className="w-6 h-6 mr-3 text-orange-400" />
            Project Management & Assembly Scheduling
          </h2>
          <p className="text-sm text-slate-400 mt-1">Manage Work Breakdown Structure (WBS) and assembly schedules.</p>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Completion</p>
            <div className="flex items-center">
              <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden mr-3">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-purple-500 transition-all duration-1000" 
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
              <span className="font-bold text-white">{calculateProgress()}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        
        {/* Task List (Left) */}
        <div className="col-span-2 glass-panel p-6">
          <div className="mb-6 flex justify-end">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all flex items-center shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </button>
          </div>

          <div className="space-y-3 relative z-10">
            {tasks.length > 0 ? tasks.map(task => (
              <div key={task.id} className={`p-4 rounded-xl border flex items-center justify-between group transition-all ${
                task.status === 'COMPLETED' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/10 hover:border-orange-500/30 hover:bg-white/10'
              }`}>
                <div className="flex items-center space-x-4">
                  <button onClick={() => toggleTaskStatus(task)}>
                    <div className={`w-6 h-6 rounded flex items-center justify-center border transition-all ${
                      task.status === 'COMPLETED' ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-slate-500 text-transparent group-hover:border-orange-400'
                    }`}>
                      <CheckSquare className="w-4 h-4" />
                    </div>
                  </button>
                  <div>
                    <h3 className={`font-semibold transition-colors ${task.status === 'COMPLETED' ? 'text-emerald-400 line-through opacity-70' : 'text-white'}`}>
                      {task.taskName}
                    </h3>
                    {task.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {task.startDate && (
                    <div className="flex items-center text-xs text-slate-400" title="Start Date">
                      <CalendarDays className="w-3 h-3 mr-1" />
                      {new Date(task.startDate).toLocaleDateString()}
                    </div>
                  )}
                  {task.endDate && (
                    <div className="flex items-center text-xs text-slate-400" title="End Date">
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
                </div>
              </div>
            )) : (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                <Target className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No tasks defined. Break down the project into WBS or assembly steps.</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Sidebar (Right) */}
        <div className="col-span-1 space-y-6">
          <div className="glass-panel p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
             <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center mb-4 relative z-10">
               <Activity className="w-4 h-4 mr-2 text-purple-400" />
               Scheduling Insights
             </h3>
             <ul className="space-y-4 text-sm text-slate-400 relative z-10">
               <li className="flex justify-between">
                 <span>Total Tasks</span>
                 <span className="font-bold text-white">{tasks.length}</span>
               </li>
               <li className="flex justify-between">
                 <span>Completed</span>
                 <span className="font-bold text-emerald-400">{tasks.filter(t => t.status === 'COMPLETED').length}</span>
               </li>
               <li className="flex justify-between">
                 <span>Pending</span>
                 <span className="font-bold text-orange-400">{tasks.filter(t => t.status === 'PENDING').length}</span>
               </li>
             </ul>
          </div>
        </div>

      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0B1018] border border-white/10 rounded-2xl p-6 w-full max-w-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-purple-500"></div>
            <h3 className="text-lg font-bold text-white mb-6">Create New Task</h3>
            
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Task Name <span className="text-orange-500">*</span></label>
                  <input
                    type="text"
                    autoFocus
                    required
                    value={taskData.taskName}
                    onChange={(e) => setTaskData({ ...taskData, taskName: e.target.value })}
                    placeholder="e.g. Assemble Core Component"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    value={taskData.description}
                    onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                    placeholder="Task details..."
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assigned To</label>
                    <input
                      type="text"
                      value={taskData.assignedTo}
                      onChange={(e) => setTaskData({ ...taskData, assignedTo: e.target.value })}
                      placeholder="e.g. John Doe or Fitter"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                    <select
                      value={taskData.status}
                      onChange={(e) => setTaskData({ ...taskData, status: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all appearance-none"
                    >
                      <option value="PENDING" className="bg-[#0B1018]">Pending</option>
                      <option value="IN_PROGRESS" className="bg-[#0B1018]">In Progress</option>
                      <option value="COMPLETED" className="bg-[#0B1018]">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
                    <input
                      type="date"
                      value={taskData.startDate}
                      onChange={(e) => setTaskData({ ...taskData, startDate: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">End Date</label>
                    <input
                      type="date"
                      value={taskData.endDate}
                      onChange={(e) => setTaskData({ ...taskData, endDate: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-orange-500/20 transition-all"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
