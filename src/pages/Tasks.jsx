import React, { useState } from 'react';
import { 
  CheckSquare, Plus, Clock, MessageSquare, Paperclip, 
  Trash2, User, ChevronRight, X, UserCheck, Eye 
} from 'lucide-react';
import firebaseService from '../firebaseService';

export default function Tasks({ 
  tasks, 
  setTasks, 
  comments, 
  setComments, 
  logActivity,
  brandColor = 'indigo',
  currentUser,
  currentRole = 'admin',
  clients = [],
  teamMembers = []
}) {
  // Resolve active client context
  const clientRecord = clients?.find(c => c.email === currentUser?.email) || { companyName: currentUser?.displayName || '' };
  const companyName = clientRecord.companyName || '';
  const [selectedTask, setSelectedTask] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  
  const teamMembersList = teamMembers.length > 0 
    ? teamMembers.map(tm => tm.name) 
    : ['Alex Rivera', 'Chloe Chen', 'Marcus Aurelius', 'Jane Doe'];

  const resolvedClients = clients.length > 0
    ? clients.map(c => c.companyName)
    : ['AeroMedia Group', 'Apex Health Corp', 'Zenith E-Commerce', 'Verdant Energy', 'Novus Learning'];

  // Add Task Form State
  const [taskForm, setTaskForm] = useState({
    title: '', 
    client: resolvedClients[0] || 'AeroMedia Group', 
    assignee: teamMembersList[0] || 'Alex Rivera',
    status: 'Todo', 
    deadline: '', 
    priority: 'High'
  });

  const columns = ['Todo', 'In Progress', 'Review', 'Completed'];

  // Action: Transition Task Stage directly
  const handleTransitionTask = async (id, newStatus, title) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      const updatedTask = { ...task, status: newStatus };
      try {
        await firebaseService.saveDocument('tasks', id, updatedTask);
      } catch (err) {
        console.error('Failed to save task transition:', err);
      }
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
    }
    logActivity('Task Progress Updated', `Shifted task "${title}" to column ${newStatus.toUpperCase()}.`);
    
    // Update selected profile view if open
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask(prev => ({ ...prev, status: newStatus }));
    }
  };

  // Action: Submit custom new task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.deadline) return;

    const created = {
      id: `tsk-${Date.now()}`,
      title: taskForm.title,
      client: taskForm.client,
      assignee: taskForm.assignee,
      status: taskForm.status,
      deadline: taskForm.deadline,
      priority: taskForm.priority,
      comments: 0
    };

    try {
      await firebaseService.saveDocument('tasks', created.id, created);
    } catch (err) {
      console.error('Failed to save new task:', err);
    }

    setTasks(prev => [created, ...prev]);
    logActivity('Task Registered', `Assigned new task "${created.title}" to ${created.assignee}.`);
    
    // Reset Form
    setTaskForm({ title: '', client: 'AeroMedia Group', assignee: 'Alex Rivera', status: 'Todo', deadline: '', priority: 'High' });
    setIsAddOpen(false);
  };

  // Action: Submit dynamic comment
  const handleAddCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const userRoleLabel = currentRole === 'admin' ? ' (Admin)' : currentRole === 'team' ? ' (Team)' : ' (Client)';
    const added = {
      id: `c-${Date.now()}`,
      taskId: selectedTask.id,
      user: (currentUser?.displayName || 'Client') + userRoleLabel,
      text: newComment.trim(),
      time: 'Just now'
    };

    try {
      await firebaseService.saveDocument('comments', added.id, added);
      // Increment comments count on main card directly in the database
      const task = tasks.find(t => t.id === selectedTask.id);
      if (task) {
        const updatedTask = { ...task, comments: (task.comments || 0) + 1 };
        await firebaseService.saveDocument('tasks', task.id, updatedTask);
        setTasks(prev => prev.map(t => t.id === selectedTask.id ? updatedTask : t));
      }
    } catch (err) {
      console.error('Failed to save comment/task updates:', err);
    }

    setComments(prev => [added, ...prev]);
    logActivity('Task Comment Appended', `Left comment on workflow task ID: #${selectedTask.id}.`);
    setNewComment('');
  };

  // Action: Delete Task
  const handleDeleteTask = async (id, title) => {
    if (currentRole !== 'admin') {
      alert("Access Denied: Only Super Admin can delete assignments.");
      return;
    }
    if (confirm(`Remove task "${title}" from pipeline boards?`)) {
      try {
        await firebaseService.deleteDocument('tasks', id);
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
      setTasks(prev => prev.filter(t => t.id !== id));
      logActivity('Task Deleted', `Removed task "${title}" from project.`);
      setSelectedTask(null);
    }
  };

  // Color mappings
  const getBrandTextColor = () => {
    switch (brandColor) {
      case 'emerald': return 'text-emerald-400';
      case 'violet': return 'text-violet-400';
      case 'amber': return 'text-amber-400';
      default: return 'text-indigo-400';
    }
  };

  const getBrandBg = () => {
    switch (brandColor) {
      case 'emerald': return 'bg-emerald-500';
      case 'violet': return 'bg-violet-500';
      case 'amber': return 'bg-amber-500';
      default: return 'bg-indigo-500';
    }
  };

  const getPriorityBadge = (prio) => {
    switch (prio) {
      case 'High': return 'bg-red-500/10 border-red-500/35 text-red-400';
      case 'Medium': return 'bg-amber-500/10 border-amber-500/35 text-amber-400';
      default: return 'bg-slate-800 border-slate-700 text-slate-400';
    }
  };

  const getTaskComments = (taskId) => {
    return comments.filter(c => c.taskId === taskId);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Workflows & Tasks Board</h2>
          <p className="text-xs text-slate-400 mt-1">Deploy campaign assignments, set critical milestones, and review team comments.</p>
        </div>
        {currentRole !== 'client' && (
          <button 
            onClick={() => setIsAddOpen(true)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95 ${getBrandBg()}`}
          >
            <Plus className="w-4 h-4" /> Delegate Task
          </button>
        )}
      </div>

      {/* Main Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
        {columns.map((col) => {
          const displayedTasks = currentRole === 'client' 
            ? tasks.filter(t => t.client.toLowerCase() === companyName.toLowerCase()) 
            : currentRole === 'team'
              ? tasks.filter(t => {
                  const activeTeamMember = teamMembers?.find(tm => tm.email.toLowerCase() === currentUser?.email?.toLowerCase());
                  const targetName = activeTeamMember ? activeTeamMember.name : (currentUser?.displayName || '');
                  return t.assignee.toLowerCase() === targetName.toLowerCase();
                })
              : tasks;
          const colTasks = displayedTasks.filter(t => t.status === col);
          return (
            <div key={col} className="p-4 bg-slate-900/40 border border-slate-900 rounded-2xl flex flex-col space-y-4">
              
              {/* Column Header */}
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-indigo-400" /> {col}
                </span>
                <span className="bg-slate-950 border border-slate-800 text-[10px] text-slate-400 font-bold px-2 py-0.5 rounded-full">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List Container */}
              <div className="space-y-3.5 min-h-[300px] overflow-y-auto max-h-[70vh] pr-0.5">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 bg-slate-900 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700 rounded-xl transition-all shadow-sm select-none relative group"
                  >
                    {/* Priority badge */}
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${getPriorityBadge(task.priority)}`}>
                        {task.priority} Priority
                      </span>
                      
                      {/* Interactive Column Swapper for fast clicks */}
                      {currentRole !== 'client' && (
                        <select
                          value={task.status}
                          onChange={(e) => handleTransitionTask(task.id, e.target.value, task.title)}
                          className="bg-slate-950 border border-slate-800 text-slate-500 py-0.5 px-1.5 rounded text-[9px] font-bold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
                        >
                          {columns.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-slate-200 mt-1 leading-snug">{task.title}</h4>
                    <span className="text-[9px] text-indigo-400 font-semibold block mt-1.5">{task.client}</span>

                    {/* Footer Details */}
                    <div className="mt-4 pt-3 border-t border-slate-950/60 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-[9px] text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                        <span className="tabular-nums font-semibold">{task.deadline}</span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        {/* Comments count */}
                        <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-600" />
                          <span>{getTaskComments(task.id).length}</span>
                        </div>

                        {/* Assignee Avatar initials */}
                        <div 
                          className="w-6 h-6 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-400"
                          title={`Assigned to ${task.assignee}`}
                        >
                          {task.assignee.split(' ').map(n => n.charAt(0)).join('')}
                        </div>
                      </div>
                    </div>

                    {/* Quick inspect trigger */}
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="absolute inset-0 w-full h-full cursor-pointer z-10 opacity-0"
                    />

                  </div>
                ))}

                {colTasks.length === 0 && (
                  <p className="text-slate-600 text-center italic py-12 text-[10px]">Column Empty</p>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* MODAL 1: TASK DETAILS DRAWER */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-900 bg-slate-900/40 flex justify-between items-start">
              <div>
                <span className="text-[8px] uppercase tracking-wider font-extrabold text-indigo-400">Campaign Task Record</span>
                <h3 className="text-sm font-bold text-slate-200 mt-1 leading-tight">{selectedTask.title}</h3>
              </div>
              <button onClick={() => setSelectedTask(null)} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-5 overflow-y-auto space-y-6 text-xs text-slate-300">
              
              {/* Properties row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-900/40 border border-slate-900 rounded-xl space-y-1.5">
                  <div className="text-slate-500">Partner Account: <span className="text-slate-200 font-bold">{selectedTask.client}</span></div>
                  <div className="text-slate-500">Assigned Expert: <span className="text-indigo-300 font-bold">{selectedTask.assignee}</span></div>
                </div>

                <div className="p-3.5 bg-slate-900/40 border border-slate-900 rounded-xl space-y-1.5">
                  <div className="text-slate-500 flex items-center">Stage Status: 
                    {currentRole === 'client' ? (
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ml-1.5 ${
                        selectedTask.status === 'Completed' 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      }`}>
                        {selectedTask.status}
                      </span>
                    ) : (
                      <select
                        value={selectedTask.status}
                        onChange={(e) => handleTransitionTask(selectedTask.id, e.target.value, selectedTask.title)}
                        className="bg-slate-950 border border-slate-850 text-slate-300 py-0.5 px-2 rounded font-bold text-[10px] ml-1.5 cursor-pointer focus:outline-none"
                      >
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    )}
                  </div>
                  <div className="text-slate-500">Deadline Target: <span className="text-red-400 font-extrabold">{selectedTask.deadline}</span></div>
                </div>
              </div>

              {/* Client-visible settings badge */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/35 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4.5 h-4.5 text-emerald-400" />
                  <div>
                    <div className="font-bold text-slate-200">Client-Visible Portal Update</div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Approved strategy targets visible within partner panel.</p>
                  </div>
                </div>
                <span className="text-[9px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">Visible</span>
              </div>

              {/* Comments stream */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 mb-3.5 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-indigo-400" /> Comments Thread ({getTaskComments(selectedTask.id).length})
                </h4>

                <div className="space-y-3.5 mb-4 max-h-40 overflow-y-auto pr-1">
                  {getTaskComments(selectedTask.id).map((com) => (
                    <div key={com.id} className="p-3 bg-slate-900 border border-slate-900 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-slate-300">{com.user}</span>
                        <span className="text-slate-500 select-none">{com.time}</span>
                      </div>
                      <p className="text-slate-400 text-[10px] leading-relaxed">{com.text}</p>
                    </div>
                  ))}

                  {getTaskComments(selectedTask.id).length === 0 && (
                    <p className="text-slate-600 text-center italic py-2">No comments left on this campaign task yet.</p>
                  )}
                </div>

                {/* Form comment submit */}
                <form onSubmit={handleAddCommentSubmit} className="flex gap-2">
                  <input 
                    type="text" 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a status update or ask a query..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-250 placeholder-slate-500 focus:outline-none"
                  />
                  <button 
                    type="submit" 
                    className={`px-4 py-2.5 text-xs font-bold text-white rounded-xl shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-all ${getBrandBg()}`}
                  >
                    Reply
                  </button>
                </form>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-900 bg-slate-900/40 flex justify-between">
              {currentRole === 'admin' ? (
                <button
                  onClick={() => handleDeleteTask(selectedTask.id, selectedTask.title)}
                  className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-400 py-2 px-3 rounded-lg hover:bg-red-500/5 cursor-pointer transition-all"
                >
                  <Trash2 className="w-4 h-4" /> Delete Assignment
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={() => setSelectedTask(null)}
                className={`px-4 py-2 ${getBrandBg()} text-white rounded-xl text-xs font-bold cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md`}
              >
                Close Panel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: ADD TASK FORM */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddTask}
            className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
          >
            <div className="p-5 border-b border-slate-900 bg-slate-900/40 flex justify-between items-center text-slate-200">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <CheckSquare className={`w-4 h-4 ${getBrandTextColor()}`} /> Delegate Campaign Task
              </h3>
              <button type="button" onClick={() => setIsAddOpen(false)} className="p-1 hover:bg-slate-800 text-slate-400 rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Task / Assignment Title *</label>
                <input 
                  type="text" required
                  placeholder="e.g. Audit outbound technical redirect paths"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Partner Account</label>
                  <select 
                    value={taskForm.client}
                    onChange={(e) => setTaskForm({...taskForm, client: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none cursor-pointer"
                  >
                    {resolvedClients.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Assign Expert</label>
                  <select 
                    value={taskForm.assignee}
                    onChange={(e) => setTaskForm({...taskForm, assignee: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none cursor-pointer"
                  >
                    {teamMembersList.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Critical Deadline *</label>
                  <input 
                    type="date" required
                    value={taskForm.deadline}
                    onChange={(e) => setTaskForm({...taskForm, deadline: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Priority Ranking</label>
                  <select 
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="High">🔴 High Priority</option>
                    <option value="Medium">🟡 Medium Priority</option>
                    <option value="Low">⚪ Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Initial Status Column</label>
                <select 
                  value={taskForm.status}
                  onChange={(e) => setTaskForm({...taskForm, status: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none cursor-pointer"
                >
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

            </div>

            <div className="p-4 border-t border-slate-900 bg-slate-900/40 flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className={`px-4 py-2 ${getBrandBg()} text-white rounded-xl text-xs font-bold cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md`}
              >
                Assign Work
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
