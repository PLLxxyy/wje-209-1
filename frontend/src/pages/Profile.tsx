import React, { useState, useEffect } from 'react';
import { User, Meetup, UserStats, STATUS_MAP, Page } from '../types';
import { apiGetUserProfile, apiGetMyCreated, apiGetMyJoined } from '../api';

interface Props {
  user: User;
  onNavigate: (page: Page, meetupId?: number) => void;
}

export default function Profile({ user, onNavigate }: Props) {
  const [stats, setStats] = useState<UserStats>({ created_count: 0, joined_count: 0, favorited_count: 0, total_spent: 0 });
  const [created, setCreated] = useState<Meetup[]>([]);
  const [joined, setJoined] = useState<Meetup[]>([]);
  const [activeTab, setActiveTab] = useState<'created' | 'joined'>('created');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [profileData, createdData, joinedData] = await Promise.all([
          apiGetUserProfile(),
          apiGetMyCreated(),
          apiGetMyJoined(),
        ]);
        setStats(profileData.stats);
        setCreated(createdData.meetups);
        setJoined(joinedData.meetups);
      } catch (err) {
        console.error('加载个人信息失败:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const formatDate = (dt: string) => {
    const d = new Date(dt);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hour = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hour}:${min}`;
  };

  const renderMeetupList = (list: Meetup[], emptyText: string) => {
    if (list.length === 0) {
      return (
        <div className="empty-state" style={{ padding: '40px 20px' }}>
          <div className="empty-icon">📭</div>
          <div className="empty-text">{emptyText}</div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {list.map((m) => {
          const pct = Math.min(100, Math.round((m.current_participants / m.max_participants) * 100));
          return (
            <div
              key={m.id}
              className="meetup-card"
              style={{ cursor: 'pointer' }}
              onClick={() => onNavigate('detail', m.id)}
            >
              <div className="card-header">
                <div className="card-title" style={{ fontSize: '16px' }}>{m.title}</div>
                <span className={`tag tag-${m.status}`}>{STATUS_MAP[m.status]}</span>
              </div>
              <div className="card-meta">
                <span className="meta-item">🍜 {m.restaurant_type}</span>
                <span className="meta-item">📍 {m.location}</span>
                <span className="meta-item">📅 {formatDate(m.meeting_time)}</span>
              </div>
              <div className="card-footer">
                <span className="participants-info">
                  <strong>{m.current_participants}</strong> / {m.max_participants} 人
                  <div className="progress-bar" style={{ width: '120px' }}>
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </span>
                {m.status === 'settled' && m.actual_cost && (
                  <span className="tag tag-settled">
                    AA ¥{(m.actual_cost / m.current_participants).toFixed(0)}/人
                  </span>
                )}
                {m.confirmed_payment ? (
                  <span className="payment-confirmed">已付款</span>
                ) : m.status === 'settled' && m.confirmed_payment === 0 ? (
                  <span className="payment-unconfirmed">待付款</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return <div className="loading-spinner">加载中...</div>;
  }

  return (
    <div>
      <div className="profile-header">
        <div className="profile-avatar">{user.nickname.charAt(0)}</div>
        <div className="profile-name">{user.nickname}</div>
        <div className="profile-username">@{user.username}</div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-value">{stats.created_count}</div>
          <div className="stat-label">发起饭局</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.joined_count}</div>
          <div className="stat-label">参加饭局</div>
        </div>
        <div
          className="stat-card"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('favorites')}
        >
          <div className="stat-value">{stats.favorited_count}</div>
          <div className="stat-label">⭐ 收藏饭局</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">¥{stats.total_spent}</div>
          <div className="stat-label">累计消费</div>
        </div>
      </div>

      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeTab === 'created' ? 'active' : ''}`}
          onClick={() => setActiveTab('created')}
        >
          我发起的 ({created.length})
        </button>
        <button
          className={`profile-tab ${activeTab === 'joined' ? 'active' : ''}`}
          onClick={() => setActiveTab('joined')}
        >
          我参加的 ({joined.length})
        </button>
      </div>

      {activeTab === 'created'
        ? renderMeetupList(created, '还没有发起过饭局')
        : renderMeetupList(joined, '还没有参加过饭局')}
    </div>
  );
}
