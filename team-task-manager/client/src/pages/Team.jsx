import { useState, useEffect } from 'react';
import axios from 'axios';
import './Team.css';

const AVATAR_COLORS = ['#7c6af7', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];

const avatarColor = (id) => {
  const hash = [...String(id)].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

export default function Team() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/users/list')
      .then((res) => {
        const sorted = [...res.data].sort((a, b) => a.name.localeCompare(b.name));
        setUsers(sorted);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">⟳ Loading team...</div>;

  return (
    <div className="team-page page-enter">
      <div className="page-header team-header">
        <h1>Team</h1>
        <p className="team-count">
          {users.length} member{users.length !== 1 ? 's' : ''}
        </p>
      </div>

      {users.length === 0 ? (
        <div className="empty-state">
          <div className="icon">◎</div>
          <p>No team members yet</p>
        </div>
      ) : (
        <div className="team-grid">
          {users.map((u) => (
            <div className="team-card" key={u._id}>
              <div
                className="team-avatar"
                style={{ background: avatarColor(u._id) }}
              >
                {u.name[0]?.toUpperCase()}
              </div>
              <h3 className="team-name">{u.name}</h3>
              <p className="team-email">{u.email}</p>
              <span className={`badge badge-${u.role} team-role`}>
                {u.role}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
