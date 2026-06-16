import React, { useState, useEffect, useCallback } from 'react';
import { User, Meetup, STATUS_MAP, Page } from '../types';
import { apiGetMyFavorites, apiUnfavoriteMeetup } from '../api';

interface Props {
  user: User;
  onNavigate: (page: Page, meetupId?: number) => void;
}

export default function Favorites({ user, onNavigate }: Props) {
  const [favorites, setFavorites] = useState<Meetup[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGetMyFavorites();
      setFavorites(data.meetups);
    } catch (err) {
      console.error('加载收藏列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleUnfavorite = async (e: React.MouseEvent, meetupId: number) => {
    e.stopPropagation();
    try {
      await apiUnfavoriteMeetup(meetupId);
      setFavorites(prev => prev.filter(m => m.id !== meetupId));
    } catch (err: any) {
      console.error('取消收藏失败:', err.message);
    }
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

  if (loading) {
    return <div className="loading-spinner">加载中...</div>;
  }

  return (
    <div>
      <div className="page-title">
        <div className="title-text">
          <span role="img" aria-label="star">⭐</span>
          我的收藏
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          共 {favorites.length} 个收藏的饭局
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📌</div>
          <div className="empty-text">还没有收藏任何饭局</div>
          <div className="empty-sub">去组局广场看看，发现感兴趣的饭局收藏起来吧</div>
          <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => onNavigate('square')}>
            去组局广场
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {favorites.map((m) => {
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      className={`favorite-btn favorited`}
                      onClick={(e) => handleUnfavorite(e, m.id)}
                      title="取消收藏"
                    >
                      ⭐
                    </button>
                    <span className={`tag tag-${m.status}`}>{STATUS_MAP[m.status]}</span>
                  </div>
                </div>
                <div className="card-meta">
                  <span className="meta-item">🍜 {m.restaurant_type}</span>
                  <span className="meta-item">📍 {m.location}</span>
                  <span className="meta-item">📅 {formatDate(m.meeting_time)}</span>
                </div>
                {m.description && <div className="card-desc">{m.description}</div>}
                <div className="card-footer">
                  <span className="participants-info">
                    <strong>{m.current_participants}</strong> / {m.max_participants} 人
                    <div className="progress-bar" style={{ width: '120px' }}>
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </span>
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
