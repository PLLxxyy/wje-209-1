import React, { useState, useEffect, useCallback } from 'react';
import { User, Meetup, RESTAURANT_TYPES, STATUS_MAP, Page } from '../types';
import { apiGetMeetups } from '../api';

interface Props {
  user: User | null;
  onNavigate: (page: Page, meetupId?: number) => void;
}

export default function Square({ user, onNavigate }: Props) {
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadMeetups = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGetMeetups({
        status: statusFilter,
        type: typeFilter,
        search: searchQuery || undefined,
      });
      setMeetups(data.meetups);
    } catch (err) {
      console.error('加载饭局列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, searchQuery]);

  useEffect(() => {
    loadMeetups();
  }, [loadMeetups]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadMeetups();
  };

  const formatDate = (dt: string) => {
    const d = new Date(dt);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hour = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    return `${month}月${day}日 周${weekdays[d.getDay()]} ${hour}:${min}`;
  };

  return (
    <div>
      <div className="page-title">
        <div className="title-text">
          <span role="img" aria-label="fire">🔥</span>
          组局广场
        </div>
        {user && (
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate('create')}>
            + 发起饭局
          </button>
        )}
      </div>

      <div className="filter-bar">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            className="search-input"
            placeholder="搜索饭局标题、地点..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">全部类型</option>
          {RESTAURANT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">进行中</option>
          <option value="open">报名中</option>
          <option value="full">已满员</option>
          <option value="settled">已结算</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-spinner">正在加载饭局...</div>
      ) : meetups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🍽️</div>
          <div className="empty-text">暂无饭局</div>
          <div className="empty-sub">
            {user ? '点击"发起饭局"来创建第一个吧！' : '登录后即可发起或参加饭局'}
          </div>
          {user && (
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => onNavigate('create')}>
              发起饭局
            </button>
          )}
        </div>
      ) : (
        <div className="meetup-grid">
          {meetups.map((m) => {
            const pct = Math.min(100, Math.round((m.current_participants / m.max_participants) * 100));
            return (
              <div key={m.id} className="meetup-card" onClick={() => onNavigate('detail', m.id)}>
                <div className="card-header">
                  <div className="card-title">{m.title}</div>
                  <span className={`tag tag-${m.status}`}>{STATUS_MAP[m.status]}</span>
                </div>
                <div className="card-meta">
                  <span className="meta-item">
                    <span role="img" aria-label="food">🍜</span> {m.restaurant_type}
                  </span>
                  <span className="meta-item">
                    <span role="img" aria-label="location">📍</span> {m.location}
                  </span>
                  <span className="meta-item">
                    <span role="img" aria-label="time">📅</span> {formatDate(m.meeting_time)}
                  </span>
                </div>
                {m.description && <div className="card-desc">{m.description}</div>}
                <div className="card-footer">
                  <div className="participants-info">
                    <strong>{m.current_participants}</strong> / {m.max_participants} 人已报名
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="tag tag-type">预估 ¥{m.estimated_cost}/人</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
