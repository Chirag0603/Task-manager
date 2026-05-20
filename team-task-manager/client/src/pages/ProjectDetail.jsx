import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import './ProjectDetail.css';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '', status: 'todo' });
  const [error, setError] = useState('');
  const [tab, setTab] = useState('todo');

  useEffect(() => {
    Promise.all([
      axios.get(`/projects/${id}`),
      axios.get(`/projects/${id}/tasks`),
      axios.get('/users/list')
    ]).then(([p, t, u]) => {
      setProject(p.data);
      setTasks(t.data);
      setUsers(u.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form, project: id };
      if (!payload.assignedTo) delete payload.assignedTo;
      if (!payload.dueDate) delete payload.dueDate;
      const { data } = await axios.post('/tasks', payload);
      setTasks(prev => [data, ...prev]);
      setShowModal(false);
      setForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '', status: 'todo' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    }
  };

  const isOwnerOrAdmin = project && (project.owner._id === user._id || isAdmin);
  const byStatus = (s) => tasks.filter(t => t.status === s);

  if (loading) return <div className="loading">⟳ Loading project...</div>;
  if (!project) return <div className="error-msg">Project not found</div>;

  return (
    <div className="project-detail page-enter">
      <div className="detail-header">
        <div>
          <Link to="/projects" className="breadcrumb">← Projects</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <div className="project-color-dot" style={{ background: project.color }} />
            <h1>{project.name}</h1>
            <span className={`badge badge-${project.status}`}>{project.status}</span>
          </div>
          {project.description && <p className="project-desc-detail">{project.description}</p>}
        </div>
        {isOwnerOrAdmin && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Task</button>
        )}
      </div>

      <div className="project-meta-bar">
        <div className="meta-item">
          <span className="meta-label">Owner</span>
          <span>{project.owner.name}</span>
        </div>
        {project.deadline && (
          <div className="meta-item">
            <span className="meta-label">Deadline</span>
            <span>{new Date(project.deadline).toLocaleDateString()}</span>
          </div>
        )}
        <div className="meta-item">
          <span className="meta-label">Members</span>
          <div className="member-avatars-row">
            {[project.owner, ...project.members].map((m, i) => (
              <div key={i} className="mini-avatar" title={m.name}>{m.name[0].toUpperCase()}</div>
            ))}
          </div>
        </div>
        <div className="meta-item">
          <span className="meta-label">Tasks</span>
          <span>{tasks.length} total · {byStatus('done').length} done</span>
        </div>
      </div>

      <div className="kanban-board">
        {['todo', 'in_progress', 'done'].map(status => (
          <div key={status} className="kanban-col">
            <div className="kanban-header">
              <span className={`badge badge-${status}`}>
                {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
              <span className="kanban-count">{byStatus(status).length}</span>
            </div>
            <div className="kanban-tasks">
              {byStatus(status).length === 0 ? (
                <div className="kanban-empty">No tasks</div>
              ) : byStatus(status).map(task => (
                <TaskCard key={task._id} task={task}
                  onUpdate={updated => setTasks(prev => prev.map(t => t._id === updated._id ? updated : t))}
                  onDelete={tid => setTasks(prev => prev.filter(t => t._id !== tid))} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h2 style={{ marginBottom: 20 }}>New Task</h2>
            {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Title *</label>
                <input required placeholder="Task title"
                  value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={2} placeholder="Details..."
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="todo">Todo</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Assign To</label>
                <select value={form.assignedTo} onChange={e => setForm({...form, assignedTo: e.target.value})}>
                  <option value="">Unassigned</option>
                  {[project.owner, ...project.members].map(m => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={form.dueDate}
                  onChange={e => setForm({...form, dueDate: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
