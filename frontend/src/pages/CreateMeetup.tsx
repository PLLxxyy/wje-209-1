import React, { useState } from 'react';
import { User, Page, RESTAURANT_TYPES } from '../types';
import { apiCreateMeetup } from '../api';

interface Props {
  user: User;
  onNavigate: (page: Page, meetupId?: number) => void;
}

export default function CreateMeetup({ user, onNavigate }: Props) {
  const [title, setTitle] = useState('');
  const [restaurantType, setRestaurantType] = useState(RESTAURANT_TYPES[0]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(6);
  const [estimatedCost, setEstimatedCost] = useState(100);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) { setError('请输入饭局标题'); return; }
    if (!location.trim()) { setError('请输入地点'); return; }
    if (!meetingTime) { setError('请选择聚餐时间'); return; }
    if (maxParticipants < 2) { setError('人数上限至少为2人'); return; }

    setLoading(true);
    try {
      const data = await apiCreateMeetup({
        title: title.trim(),
        restaurant_type: restaurantType,
        description: description.trim(),
        location: location.trim(),
        meeting_time: meetingTime.replace('T', ' ') + ':00',
        max_participants: maxParticipants,
        estimated_cost: estimatedCost,
      });
      onNavigate('detail', data.meetup.id);
    } catch (err: any) {
      setError(err.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  // 生成最小日期时间值（当前时间+1小时）
  const now = new Date();
  now.setHours(now.getHours() + 1);
  const minDateTime = now.toISOString().slice(0, 16);

  return (
    <div>
      <button className="back-btn" onClick={() => onNavigate('square')}>
        ← 返回广场
      </button>

      <div className="detail-card" style={{ maxWidth: '640px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px', textAlign: 'center' }}>
          发起饭局
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>饭局标题 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给饭局取个吸引人的名字吧"
              autoFocus
              maxLength={50}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>餐厅类型 *</label>
              <select value={restaurantType} onChange={(e) => setRestaurantType(e.target.value)}>
                {RESTAURANT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>人数上限 *</label>
              <input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 2)}
                min={2}
                max={50}
              />
            </div>
          </div>

          <div className="form-group">
            <label>聚餐地点 *</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="餐厅名称或地址"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>聚餐时间 *</label>
              <input
                type="datetime-local"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                min={minDateTime}
              />
            </div>
            <div className="form-group">
              <label>预估人均消费 (元)</label>
              <input
                type="number"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(parseFloat(e.target.value) || 0)}
                min={1}
                step={10}
              />
            </div>
          </div>

          <div className="form-group">
            <label>饭局描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="介绍一下这次饭局，比如想吃什么、有什么要求..."
              rows={4}
              maxLength={500}
            />
          </div>

          {error && <div style={{ color: 'var(--danger)', fontSize: '14px', marginBottom: '14px' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => onNavigate('square')}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
              {loading ? '发布中...' : '发布饭局'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
