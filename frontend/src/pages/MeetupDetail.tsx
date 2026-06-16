import React, { useState, useEffect, useCallback } from 'react';
import { User, Meetup, Participant, STATUS_MAP, Page } from '../types';
import { apiGetMeetup, apiJoinMeetup, apiLeaveMeetup, apiRecordExpense, apiConfirmPayment, apiFavoriteMeetup, apiUnfavoriteMeetup } from '../api';

interface Props {
  meetupId: number;
  user: User | null;
  onNavigate: (page: Page, meetupId?: number) => void;
}

export default function MeetupDetail({ meetupId, user, onNavigate }: Props) {
  const [meetup, setMeetup] = useState<Meetup | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // 结算相关
  const [showExpense, setShowExpense] = useState(false);
  const [actualCost, setActualCost] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGetMeetup(meetupId);
      setMeetup(data.meetup);
      setParticipants(data.participants);
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [meetupId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isCreator = user && meetup && meetup.creator_id === user.id;
  const isParticipant = user && participants.some((p) => p.user_id === user.id);

  const handleJoin = async () => {
    if (!user) { onNavigate('login'); return; }
    setActionLoading(true);
    try {
      await apiJoinMeetup(meetupId);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    setActionLoading(true);
    try {
      await apiLeaveMeetup(meetupId);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordExpense = async () => {
    const cost = parseFloat(actualCost);
    if (!cost || cost <= 0) { setError('请输入有效金额'); return; }
    setActionLoading(true);
    try {
      await apiRecordExpense(meetupId, cost);
      setShowExpense(false);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setActionLoading(true);
    try {
      await apiConfirmPayment(meetupId);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) { onNavigate('login'); return; }
    setActionLoading(true);
    try {
      if (meetup?.is_favorited) {
        await apiUnfavoriteMeetup(meetupId);
      } else {
        await apiFavoriteMeetup(meetupId);
      }
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dt: string) => {
    const d = new Date(dt);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="loading-spinner">加载中...</div>;
  }

  if (!meetup) {
    return (
      <div className="empty-state">
        <div className="empty-icon">😕</div>
        <div className="empty-text">饭局不存在</div>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => onNavigate('square')}>
          返回广场
        </button>
      </div>
    );
  }

  const perPerson = meetup.actual_cost
    ? (meetup.actual_cost / participants.length).toFixed(2)
    : null;
  const myParticipant = participants.find((p) => p.user_id === user?.id);
  const allConfirmed = participants.length > 0 && participants.every((p) => p.confirmed_payment);

  return (
    <div>
      <button className="back-btn" onClick={() => onNavigate('square')}>
        ← 返回广场
      </button>

      {error && (
        <div style={{ background: '#FFF3F0', border: '1px solid #FFCDD2', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: 'var(--danger)', fontSize: '14px' }}>
          {error}
          <button style={{ marginLeft: '12px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }} onClick={() => setError('')}>关闭</button>
        </div>
      )}

      <div className="detail-card">
        <div className="detail-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="detail-tags">
              <span className="tag tag-type">{meetup.restaurant_type}</span>
              <span className={`tag tag-${meetup.status}`}>{STATUS_MAP[meetup.status]}</span>
            </div>
            {user && (
              <button
                className={`favorite-btn ${meetup.is_favorited ? 'favorited' : ''}`}
                onClick={handleToggleFavorite}
                disabled={actionLoading}
                title={meetup.is_favorited ? '取消收藏' : '收藏'}
              >
                {meetup.is_favorited ? '⭐ 已收藏' : '☆ 收藏'}
              </button>
            )}
          </div>
          <h1>{meetup.title}</h1>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            由 <strong>{meetup.creator_name}</strong> 发起
          </div>
        </div>

        <div className="detail-info-grid">
          <div className="detail-info-item">
            <span className="info-label">聚餐时间</span>
            <span className="info-value">📅 {formatDate(meetup.meeting_time)}</span>
          </div>
          <div className="detail-info-item">
            <span className="info-label">聚餐地点</span>
            <span className="info-value">📍 {meetup.location}</span>
          </div>
          <div className="detail-info-item">
            <span className="info-label">预估人均</span>
            <span className="info-value">💰 ¥{meetup.estimated_cost}</span>
          </div>
          <div className="detail-info-item">
            <span className="info-label">报名人数</span>
            <span className="info-value">
              👥 {meetup.current_participants} / {meetup.max_participants} 人
            </span>
          </div>
        </div>

        {meetup.description && (
          <div style={{ marginBottom: '28px', padding: '16px', background: '#FAF7F4', borderRadius: '8px', fontSize: '15px', lineHeight: '1.7' }}>
            {meetup.description}
          </div>
        )}

        {/* 参与者列表 */}
        <div className="participants-section">
          <h3>已报名 ({participants.length}人)</h3>
          <div className="participant-list">
            {participants.map((p) => (
              <div key={p.id} className="participant-item">
                <div className="participant-avatar">
                  {p.nickname.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{p.nickname}</div>
                  {meetup.status === 'settled' && (
                    p.confirmed_payment ? (
                      <span className="payment-confirmed">已确认付款</span>
                    ) : (
                      <span className="payment-unconfirmed">待确认</span>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 操作按钮 */}
        {user && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {meetup.status === 'open' && !isParticipant && (
              <button className="btn btn-primary" onClick={handleJoin} disabled={actionLoading}>
                {actionLoading ? '处理中...' : '我要参加'}
              </button>
            )}
            {meetup.status === 'open' && isParticipant && !isCreator && (
              <button className="btn btn-secondary" onClick={handleLeave} disabled={actionLoading}>
                {actionLoading ? '处理中...' : '退出饭局'}
              </button>
            )}
            {meetup.status === 'full' && !isParticipant && (
              <button className="btn btn-secondary" disabled>已满员</button>
            )}
            {isParticipant && meetup.status !== 'settled' && (
              <span style={{ fontSize: '14px', color: 'var(--success)', display: 'flex', alignItems: 'center' }}>
                ✓ 你已参加此饭局
              </span>
            )}
          </div>
        )}

        {!user && meetup.status === 'open' && (
          <div style={{ marginBottom: '20px' }}>
            <button className="btn btn-primary" onClick={() => onNavigate('login')}>
              登录后参加
            </button>
          </div>
        )}

        {/* 发起人结算区域 */}
        {isCreator && meetup.status !== 'settled' && (
          <div className="expense-section">
            <h3>💰 结算</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              饭局结束后，在这里录入实际花费，系统会自动计算每人应付金额。
            </p>
            {showExpense ? (
              <div>
                <div className="form-group">
                  <label>实际总花费 (元)</label>
                  <input
                    type="number"
                    value={actualCost}
                    onChange={(e) => setActualCost(e.target.value)}
                    placeholder="输入本次聚餐的总花费"
                    min={1}
                    step={1}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowExpense(false)}>取消</button>
                  <button className="btn btn-success btn-sm" onClick={handleRecordExpense} disabled={actionLoading}>
                    {actionLoading ? '提交中...' : '确认结算'}
                  </button>
                </div>
              </div>
            ) : (
              <button className="btn btn-success" onClick={() => setShowExpense(true)}>
                录入实际花费
              </button>
            )}
          </div>
        )}

        {/* 已结算信息 */}
        {meetup.status === 'settled' && (
          <div className="expense-section">
            <h3>💳 结算信息</h3>
            <div className="expense-amount">
              总花费 ¥{meetup.actual_cost}
            </div>
            <div className="expense-breakdown">
              {participants.length} 人 AA，每人应付 <strong>¥{perPerson}</strong>
            </div>
            {isParticipant && myParticipant && !myParticipant.confirmed_payment && !isCreator && (
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button className="btn btn-primary" onClick={handleConfirmPayment} disabled={actionLoading}>
                  {actionLoading ? '确认中...' : '确认已付款'}
                </button>
              </div>
            )}
            {isParticipant && myParticipant?.confirmed_payment && (
              <div style={{ textAlign: 'center', marginTop: '12px', color: 'var(--success)', fontWeight: 600 }}>
                ✓ 你已确认付款
              </div>
            )}
            {allConfirmed && (
              <div style={{ textAlign: 'center', marginTop: '12px', padding: '10px', background: '#E8F5E9', borderRadius: '8px', color: 'var(--success)', fontWeight: 600 }}>
                🎉 所有参与者均已确认付款
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
