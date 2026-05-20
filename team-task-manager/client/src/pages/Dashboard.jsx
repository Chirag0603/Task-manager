import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ tasks: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    axios.get('/tasks/dashboard').then(res => {
      setData(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filteredTasks = data.tasks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'mine') return t.assignedTo?._id === user._id;
    if (filter === 'overdue') return t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done';
    return t.status === filter;
  });

  if (loading) return <div className="loading">⟳ Loading dashboard...</div>;

  const statCards = [
    { key: 'total', label: 'Total Tasks', value: data.stats.total, className: '', icon: '▣' },
    { key: 'inProgress', label: 'In Progress', value: data.stats.inProgress, className: 'stat-blue', icon: '⟳' },
    { key: 'done', label: 'Completed', value: data.stats.done, className: 'stat-green', icon: '✓' },
    { key: 'overdue', label: 'Overdue', value: data.stats.overdue, className: 'stat-red', icon: '⚠' },
  ];

  return (
    <div className="dashboard page-enter">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-sub">Welcome back, {user.name}</p>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((card) => (
          <div key={card.key} className={`stat-card ${card.className}`.trim()}>
            <span className="stat-icon" aria-hidden="true">{card.icon}</span>
            <div className="stat-number">{card.value || 0}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="filter-bar">
        {['all', 'mine', 'todo', 'in_progress', 'done', 'overdue'].map(f => (
          <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}>
            {f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="empty-state">
          <div className="icon">◈</div>
          <p>No tasks found</p>
        </div>
      ) : (
        <div className="tasks-list">
          {filteredTasks.map(task => (
            <TaskCard key={task._id} task={task} onUpdate={(updated) => {
              setData(prev => ({
                ...prev,
                tasks: prev.tasks.map(t => t._id === updated._id ? updated : t)
              }));
            }} />
          ))}
        </div>
      )}
    </div>
  );
}
