import { Router, Response } from 'express';
import db from './database';
import { authMiddleware, AuthRequest } from './middleware';

const router = Router();

// 个人信息及统计
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT id, username, nickname, avatar, created_at FROM users WHERE id = ?').get(req.userId!) as any;
  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }

  const createdCount = db.prepare('SELECT COUNT(*) as count FROM meetups WHERE creator_id = ?').get(req.userId!) as any;
  const joinedCount = db.prepare('SELECT COUNT(*) as count FROM participants WHERE user_id = ?').get(req.userId!) as any;
  const favoritedCount = db.prepare('SELECT COUNT(*) as count FROM favorites WHERE user_id = ?').get(req.userId!) as any;
  const totalSpent = db.prepare(`
    SELECT COALESCE(SUM(m.actual_cost / sub.cnt), 0) as total
    FROM participants p
    JOIN meetups m ON p.meetup_id = m.id
    JOIN (SELECT meetup_id, COUNT(*) as cnt FROM participants GROUP BY meetup_id) sub ON sub.meetup_id = m.id
    WHERE p.user_id = ? AND m.status = 'settled'
  `).get(req.userId!) as any;

  res.json({
    user,
    stats: {
      created_count: createdCount.count,
      joined_count: joinedCount.count,
      favorited_count: favoritedCount.count,
      total_spent: Math.round(totalSpent.total * 100) / 100
    }
  });
});

// 我发起的饭局
router.get('/me/created', authMiddleware, (req: AuthRequest, res: Response) => {
  const meetups = db.prepare(`
    SELECT m.*, u.nickname as creator_name,
           (SELECT COUNT(*) FROM participants WHERE meetup_id = m.id) as current_participants
    FROM meetups m
    JOIN users u ON m.creator_id = u.id
    WHERE m.creator_id = ?
    ORDER BY m.created_at DESC
  `).all(req.userId!);

  res.json({ meetups });
});

// 我参加的饭局
router.get('/me/joined', authMiddleware, (req: AuthRequest, res: Response) => {
  const meetups = db.prepare(`
    SELECT m.*, u.nickname as creator_name,
           (SELECT COUNT(*) FROM participants WHERE meetup_id = m.id) as current_participants,
           p.confirmed_payment, p.joined_at as my_joined_at
    FROM participants p
    JOIN meetups m ON p.meetup_id = m.id
    JOIN users u ON m.creator_id = u.id
    WHERE p.user_id = ?
    ORDER BY p.joined_at DESC
  `).all(req.userId!);

  res.json({ meetups });
});

// 我收藏的饭局
router.get('/me/favorites', authMiddleware, (req: AuthRequest, res: Response) => {
  const meetups = db.prepare(`
    SELECT m.*, u.nickname as creator_name, u.avatar as creator_avatar,
           (SELECT COUNT(*) FROM participants WHERE meetup_id = m.id) as current_participants,
           f.created_at as favorited_at
    FROM favorites f
    JOIN meetups m ON f.meetup_id = m.id
    JOIN users u ON m.creator_id = u.id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `).all(req.userId!);

  res.json({ meetups });
});

// 收藏饭局
router.post('/me/favorites/:meetupId', authMiddleware, (req: AuthRequest, res: Response) => {
  const { meetupId } = req.params;

  const meetup = db.prepare('SELECT id FROM meetups WHERE id = ?').get(meetupId);
  if (!meetup) {
    res.status(404).json({ error: '饭局不存在' });
    return;
  }

  const existing = db.prepare('SELECT id FROM favorites WHERE meetup_id = ? AND user_id = ?').get(meetupId, req.userId!);
  if (existing) {
    res.status(400).json({ error: '已经收藏过该饭局' });
    return;
  }

  db.prepare('INSERT INTO favorites (meetup_id, user_id) VALUES (?, ?)').run(meetupId, req.userId!);
  res.json({ message: '收藏成功' });
});

// 取消收藏
router.delete('/me/favorites/:meetupId', authMiddleware, (req: AuthRequest, res: Response) => {
  const { meetupId } = req.params;

  const result = db.prepare('DELETE FROM favorites WHERE meetup_id = ? AND user_id = ?').run(meetupId, req.userId!);
  if (result.changes === 0) {
    res.status(400).json({ error: '未收藏该饭局' });
    return;
  }

  res.json({ message: '取消收藏成功' });
});

export default router;
