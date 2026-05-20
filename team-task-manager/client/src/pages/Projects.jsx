import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Projects.css';

const COLORS = ['#7c6af7','#3b82f6','#22c55e','#f59e0b','#ef4444','#ec4899','#14b8a6'];

export default function Projects() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', members: [], deadline: '', color: COLORS[0] });
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      axios.get('/projects'),
      axios.get('/users/list')
    ]).then(([p, u]) => {
      setProjects(p.data);
      setUsers(u.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await axios.post('/projects', form);
      setProjects(prev => [data, ...prev]);
      setShowModal(false);
      setForm({ name: '', description: '', members: [], deadline: '', color: COLORS[0] });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    }
  };

  const toggleMember = (id) => {
    setForm(prev => ({
      ...prev,
      members: prev.members.includes(id)
        ? prev.members.filter(m => m !== id)
        : [...prev.members, id]
    }));
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await axios.delete(`/projects/${id}`);
      setProjects(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <div className="loading">⟳ Loading projects...</div>;

  return (
    <div className="projects-page page-enter">
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p className="page-sub">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="icon">◫</div>
          <p>{isAdmin ? 'Create your first project' : 'No projects assigned to you yet'}</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(p => (
            <div key={p._id} className="project-card">
              <div className="project-accent" style={{ background: p.color }} />
              <div className="project-body">
                <div className="project-top">
                  <Link to={`/projects/${p._id}`} className="project-name">{p.name}</Link>
                  <span className={`badge badge-${p.status}`}>{p.status}</span>
                </div>
                {p.description && <p className="project-desc">{p.description}</p>}
                <div className="project-footer">
                  <div className="member-avatars">
                    {[p.owner, ...p.members].slice(0, 4).map((m, i) => (
                      <div key={i} className="mini-avatar" title={m.name}
                        style={{ zIndex: 10 - i }}>
                        {m.name[0].toUpperCase()}
                      </div>
                    ))}
                    {p.members.length > 3 && <div className="mini-avatar">+{p.members.length - 3}</div>}
                  </div>
                  {p.deadline && (
                    <span className="project-deadline">
                      📅 {new Date(p.deadline).toLocaleDateString()}
                    </span>
                  )}
                  {isAdmin && (
                    <button className="btn btn-danger" onClick={() => handleDelete(p._id)}>✕</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h2 style={{ marginBottom: 20 }}>New Project</h2>
            {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Project Name *</label>
                <input required placeholder="My Awesome Project"
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} placeholder="What is this project about?"
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label>Color</label>
                <div className="color-picker">
                  {COLORS.map(c => (
                    <button type="button" key={c} className={`color-dot ${form.color === c ? 'selected' : ''}`}
                      style={{ background: c }} onClick={() => setForm({...form, color: c})} />
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Deadline</label>
                <input type="date" value={form.deadline}
                  onChange={e => setForm({...form, deadline: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Add Members</label>
                <div className="member-list">
                  {users.map(u => (
                    <div key={u._id} className={`member-item ${form.members.includes(u._id) ? 'selected' : ''}`}
                      onClick={() => toggleMember(u._id)}>
                      <div className="mini-avatar">{u.name[0]}</div>
                      <span>{u.name}</span>
                      <span className={`badge badge-${u.role}`}>{u.role}</span>
                      {form.members.includes(u._id) && <span style={{ marginLeft: 'auto' }}>✓</span>}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
