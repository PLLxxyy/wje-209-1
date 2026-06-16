export interface User {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  created_at?: string;
}

export interface Meetup {
  id: number;
  creator_id: number;
  creator_name: string;
  creator_avatar?: string;
  title: string;
  restaurant_type: string;
  description: string;
  location: string;
  meeting_time: string;
  max_participants: number;
  current_participants: number;
  estimated_cost: number;
  actual_cost: number | null;
  status: 'open' | 'full' | 'settled' | 'cancelled';
  created_at: string;
  confirmed_payment?: number;
  my_joined_at?: string;
  is_favorited?: number;
  favorited_at?: string;
}

export interface Participant {
  id: number;
  user_id: number;
  joined_at: string;
  confirmed_payment: number;
  nickname: string;
  avatar?: string;
}

export interface UserStats {
  created_count: number;
  joined_count: number;
  favorited_count: number;
  total_spent: number;
}

export type Page = 'square' | 'detail' | 'create' | 'profile' | 'favorites' | 'login' | 'register';

export const RESTAURANT_TYPES = ['火锅', '烧烤', '日料', '西餐', '家常菜', '湘菜', '川菜', '粤菜', '东北菜', '东南亚菜'];

export const STATUS_MAP: Record<string, string> = {
  open: '报名中',
  full: '已满员',
  settled: '已结算',
  cancelled: '已取消',
};
