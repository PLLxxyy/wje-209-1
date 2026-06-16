import React, { useState } from 'react';
import { User } from '../types';
import { apiLogin } from '../api';

interface Props {
  onAuth: (token: string, user: User) => void;
  onSwitch: () => void;
}

export default function Login({ onAuth, onSwitch }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiLogin(username, password);
      onAuth(data.token, data.user as User);
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>登录</h2>
        <p className="subtitle">欢迎回来，一起组饭局吧</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
            />
          </div>
          {error && <div style={{ color: 'var(--danger)', fontSize: '14px', marginBottom: '12px' }}>{error}</div>}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        <div className="switch-link">
          还没有账号？<a onClick={onSwitch}>立即注册</a>
        </div>
      </div>
    </div>
  );
}
