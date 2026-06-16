import React, { useState } from 'react';
import { User } from '../types';
import { apiRegister } from '../api';

interface Props {
  onAuth: (token: string, user: User) => void;
  onSwitch: () => void;
}

export default function Register({ onAuth, onSwitch }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiRegister(username, password, nickname);
      onAuth(data.token, data.user as User);
    } catch (err: any) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>注册</h2>
        <p className="subtitle">加入饭搭子，找到你的美食搭档</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="3-20个字符"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>昵称</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="大家怎么称呼你"
            />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少6位"
            />
          </div>
          {error && <div style={{ color: 'var(--danger)', fontSize: '14px', marginBottom: '12px' }}>{error}</div>}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </button>
        </form>
        <div className="switch-link">
          已有账号？<a onClick={onSwitch}>去登录</a>
        </div>
      </div>
    </div>
  );
}
