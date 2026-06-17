import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Favorites from './Favorites';
import { User, Page, Meetup } from '../types';
import * as apiModule from '../api';

vi.mock('../api');

const mockUser: User = {
  id: 1,
  username: 'testuser',
  nickname: '测试用户',
};

const mockNavigate = vi.fn();

const mockMeetups: Meetup[] = [
  {
    id: 1,
    creator_id: 2,
    creator_name: '小李',
    title: '周末火锅局',
    restaurant_type: '火锅',
    description: '一起吃火锅聊聊',
    location: '海底捞三里屯店',
    meeting_time: '2026-06-20T18:00:00.000Z',
    max_participants: 6,
    current_participants: 3,
    estimated_cost: 120,
    actual_cost: null,
    status: 'open',
    created_at: '2026-06-15T10:00:00.000Z',
    is_favorited: 1,
    favorited_at: '2026-06-16T08:00:00.000Z',
  },
  {
    id: 2,
    creator_id: 3,
    creator_name: '小王',
    title: '日料品鉴会',
    restaurant_type: '日料',
    description: '',
    location: '隐泉居酒屋',
    meeting_time: '2026-06-22T19:30:00.000Z',
    max_participants: 4,
    current_participants: 4,
    estimated_cost: 280,
    actual_cost: null,
    status: 'full',
    created_at: '2026-06-14T12:00:00.000Z',
    is_favorited: 1,
    favorited_at: '2026-06-15T09:00:00.000Z',
  },
];

describe('Favorites 收藏页面', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('加载中显示加载状态', () => {
    (apiModule.apiGetMyFavorites as any).mockReturnValue(new Promise(() => {}));
    render(<Favorites user={mockUser} onNavigate={mockNavigate} />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('加载成功且有收藏时，正确渲染收藏列表', async () => {
    (apiModule.apiGetMyFavorites as any).mockResolvedValue({ meetups: mockMeetups });

    render(<Favorites user={mockUser} onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('favorites-count')).toHaveTextContent('共 2 个收藏的饭局');
    expect(screen.getByTestId('favorites-list')).toBeInTheDocument();
    expect(screen.getByText('周末火锅局')).toBeInTheDocument();
    expect(screen.getByText('日料品鉴会')).toBeInTheDocument();
    expect(screen.queryByTestId('favorites-empty')).not.toBeInTheDocument();
    expect(screen.queryByTestId('favorites-error')).not.toBeInTheDocument();
    expect(apiModule.apiGetMyFavorites).toHaveBeenCalledTimes(1);
  });

  it('加载成功但没有收藏时，显示空状态提示', async () => {
    (apiModule.apiGetMyFavorites as any).mockResolvedValue({ meetups: [] });

    render(<Favorites user={mockUser} onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('favorites-empty')).toBeInTheDocument();
    expect(screen.getByText('还没有收藏任何饭局')).toBeInTheDocument();
    expect(screen.queryByTestId('favorites-list')).not.toBeInTheDocument();
    expect(screen.queryByTestId('favorites-error')).not.toBeInTheDocument();
  });

  it('加载失败时显示错误提示和重试按钮，点击重试可重新加载', async () => {
    let callCount = 0;
    (apiModule.apiGetMyFavorites as any).mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return Promise.reject(new Error('网络连接失败'));
      }
      return Promise.resolve({ meetups: mockMeetups });
    });

    render(<Favorites user={mockUser} onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByTestId('favorites-error')).toBeInTheDocument();
    });

    expect(screen.getByTestId('favorites-error-message')).toHaveTextContent('网络连接失败');
    expect(screen.getByTestId('favorites-retry-btn')).toBeInTheDocument();
    expect(screen.getByText('重新加载')).toBeInTheDocument();
    expect(screen.queryByTestId('favorites-list')).not.toBeInTheDocument();
    expect(screen.queryByTestId('favorites-empty')).not.toBeInTheDocument();
    expect(apiModule.apiGetMyFavorites).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('favorites-retry-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('favorites-list')).toBeInTheDocument();
    });

    expect(apiModule.apiGetMyFavorites).toHaveBeenCalledTimes(2);
    expect(screen.getByText('周末火锅局')).toBeInTheDocument();
    expect(screen.queryByTestId('favorites-error')).not.toBeInTheDocument();
  });
});
