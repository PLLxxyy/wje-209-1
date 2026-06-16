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

export default router;
