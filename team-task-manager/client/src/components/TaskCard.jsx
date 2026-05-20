import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './TaskCard.css';

const STATUS_NEXT = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
const STATUS_LABEL = { todo: 'Todo', in_progress: 'In Progress', done: 'Done' };

export default function TaskCard({ task, onUpdate, onDelete }) {
  const { user, isAdmin } = useAuth();
  const [updating, setUpdating] = useState(false);

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  const cycleStatus = async () => {
    setUpdating(true);
    try {
      const { data } = await axios.put(`/tasks/${task._id}`, { status: STATUS_NEXT[task.status] });
      onUpdate?.(data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    try {
      await axios.delete(`/tasks/${task._id}`);
      onDelete?.(task._id);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className={`task-card ${isOverdue ? 'overdue' : ''}`}>
      <div className="task-main">
        <div className="task-info">
          <div className="task-title">{task.title}</div>
          {task.description && <div className="task-desc">{task.description}</div>}
          <div className="task-meta">
            {task.project && <span className="project-tag" style={{ borderColor: task.project.color }}>
              {task.project.name}
            </span>}
            {task.assignedTo && <span className="meta-chip">👤 {task.assignedTo.name}</span>}
            {task.dueDate && <span className={`meta-chip ${isOverdue ? 'overdue-chip' : ''}`}>
              📅 {new Date(task.dueDate).toLocaleDateString()}
            </span>}
          </div>
        </div>
        <div className="task-actions">
          <span className={`badge badge-${task.priority}`}>{task.priority}</span>
          <button
            className={`status-btn status-${task.status}`}
            onClick={cycleStatus}
            disabled={updating}
            title="Click to advance status"
          >
            {updating ? '...' : STATUS_LABEL[task.status]}
          </button>
          {(isAdmin || task.createdBy?._id === user._id) && (
            <button className="btn btn-danger" onClick={handleDelete}>✕</button>
          )}
        </div>
      </div>
    </div>
  );
}
