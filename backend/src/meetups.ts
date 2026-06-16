import { Router, Response } from 'express';
import db from './database';
import { authMiddleware, AuthRequest } from './middleware';

const router = Router();

// 获取饭局列表（广场）
router.get('/', (req: AuthRequest, res: Response) => {
  const { status, type, search } = req.query;
  let sql = `
    SELECT m.*, u.nickname as creator_name, u.avatar as creator_avatar,
           (SELECT COUNT(*) FROM participants WHERE meetup_id = m.id) as current_participants
    FROM meetups m
    JOIN users u ON m.creator_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status && status !== 'all') {
    sql += ' AND m.status = ?';
    params.push(status);
  } else {
    sql += " AND m.status IN ('open', 'full')";
  }

  if (type && type !== 'all') {
    sql += ' AND m.restaurant_type = ?';
    params.push(type);
  }

  if (search) {
    sql += ' AND (m.title LIKE ? OR m.location LIKE ? OR m.description LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  sql += ' ORDER BY m.created_at DESC';

  const meetups = db.prepare(sql).all(...params);
  res.json({ meetups });
});

// 创建饭局
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { title, restaurant_type, description, location, meeting_time, max_participants, estimated_cost } = req.body;

  if (!title || !restaurant_type || !location || !meeting_time || !max_participants || estimated_cost === undefined) {
    res.status(400).json({ error: '请填写完整信息' });
    return;
  }

  if (max_participants < 2 || max_participants > 50) {
    res.status(400).json({ error: '人数上限需在2-50之间' });
    return;
  }

  const result = db.prepare(`
    INSERT INTO meetups (creator_id, title, restaurant_type, description, location, meeting_time, max_participants, estimated_cost)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.userId!, title, restaurant_type, description || '', location, meeting_time, max_participants, estimated_cost);

  // 创建者自动加入
  db.prepare('INSERT INTO participants (meetup_id, user_id) VALUES (?, ?)').run(result.lastInsertRowid, req.userId!);

  const meetup = db.prepare(`
    SELECT m.*, u.nickname as creator_name,
           (SELECT COUNT(*) FROM participants WHERE meetup_id = m.id) as current_participants
    FROM meetups m JOIN users u ON m.creator_id = u.id WHERE m.id = ?
  `).get(result.lastInsertRowid);

  res.json({ meetup });
});

// 获取饭局详情
router.get('/:id', (req: AuthRequest, res: Response) => {
  const meetup = db.prepare(`
    SELECT m.*, u.nickname as creator_name, u.avatar as creator_avatar,
           (SELECT COUNT(*) FROM participants WHERE meetup_id = m.id) as current_participants
    FROM meetups m JOIN users u ON m.creator_id = u.id WHERE m.id = ?
  `).get(req.params.id) as any;

  if (!meetup) {
    res.status(404).json({ error: '饭局不存在' });
    return;
  }

  const participants = db.prepare(`
    SELECT p.id, p.user_id, p.joined_at, p.confirmed_payment, u.nickname, u.avatar
    FROM participants p JOIN users u ON p.user_id = u.id
    WHERE p.meetup_id = ?
    ORDER BY p.joined_at ASC
  `).all(req.params.id);

  res.json({ meetup, participants });
});

// 加入饭局
router.post('/:id/join', authMiddleware, (req: AuthRequest, res: Response) => {
  const meetup = db.prepare('SELECT * FROM meetups WHERE id = ?').get(req.params.id) as any;
  if (!meetup) {
    res.status(404).json({ error: '饭局不存在' });
    return;
  }

  if (meetup.status !== 'open') {
    res.status(400).json({ error: '该饭局已满员或已关闭' });
    return;
  }

  const existing = db.prepare('SELECT id FROM participants WHERE meetup_id = ? AND user_id = ?').get(req.params.id, req.userId!);
  if (existing) {
    res.status(400).json({ error: '你已经参加了这个饭局' });
    return;
  }

  const currentCount = db.prepare('SELECT COUNT(*) as count FROM participants WHERE meetup_id = ?').get(req.params.id) as any;
  if (currentCount.count >= meetup.max_participants) {
    db.prepare("UPDATE meetups SET status = 'full' WHERE id = ?").run(req.params.id);
    res.status(400).json({ error: '饭局已满员' });
    return;
  }

  db.prepare('INSERT INTO participants (meetup_id, user_id) VALUES (?, ?)').run(req.params.id, req.userId!);

  // 检查是否满员
  const newCount = db.prepare('SELECT COUNT(*) as count FROM participants WHERE meetup_id = ?').get(req.params.id) as any;
  if (newCount.count >= meetup.max_participants) {
    db.prepare("UPDATE meetups SET status = 'full' WHERE id = ?").run(req.params.id);
  }

  res.json({ message: '加入成功' });
});

// 退出饭局
router.post('/:id/leave', authMiddleware, (req: AuthRequest, res: Response) => {
  const meetup = db.prepare('SELECT * FROM meetups WHERE id = ?').get(req.params.id) as any;
  if (!meetup) {
    res.status(404).json({ error: '饭局不存在' });
    return;
  }

  if (meetup.creator_id === req.userId!) {
    res.status(400).json({ error: '发起人不能退出饭局' });
    return;
  }

  const result = db.prepare('DELETE FROM participants WHERE meetup_id = ? AND user_id = ?').run(req.params.id, req.userId!);
  if (result.changes === 0) {
    res.status(400).json({ error: '你未参加这个饭局' });
    return;
  }

  // 重新设置状态
  if (meetup.status === 'full') {
    db.prepare("UPDATE meetups SET status = 'open' WHERE id = ?").run(req.params.id);
  }

  res.json({ message: '退出成功' });
});

// 录入实际花费（仅发起人）
router.post('/:id/expense', authMiddleware, (req: AuthRequest, res: Response) => {
  const { actual_cost } = req.body;
  if (actual_cost === undefined || actual_cost <= 0) {
    res.status(400).json({ error: '请输入有效的实际花费' });
    return;
  }

  const meetup = db.prepare('SELECT * FROM meetups WHERE id = ?').get(req.params.id) as any;
  if (!meetup) {
    res.status(404).json({ error: '饭局不存在' });
    return;
  }

  if (meetup.creator_id !== req.userId!) {
    res.status(403).json({ error: '仅发起人可以录入花费' });
    return;
  }

  db.prepare("UPDATE meetups SET actual_cost = ?, status = 'settled' WHERE id = ?").run(actual_cost, req.params.id);

  const participantCount = db.prepare('SELECT COUNT(*) as count FROM participants WHERE meetup_id = ?').get(req.params.id) as any;
  const perPerson = (actual_cost / participantCount.count).toFixed(2);

  res.json({ message: '花费录入成功', actual_cost, per_person: parseFloat(perPerson), participant_count: participantCount.count });
});

// 确认付款
router.post('/:id/confirm', authMiddleware, (req: AuthRequest, res: Response) => {
  const meetup = db.prepare('SELECT * FROM meetups WHERE id = ?').get(req.params.id) as any;
  if (!meetup) {
    res.status(404).json({ error: '饭局不存在' });
    return;
  }

  if (meetup.status !== 'settled') {
    res.status(400).json({ error: '饭局尚未结算，无法确认付款' });
    return;
  }

  const participant = db.prepare('SELECT * FROM participants WHERE meetup_id = ? AND user_id = ?').get(req.params.id, req.userId!) as any;
  if (!participant) {
    res.status(400).json({ error: '你未参加这个饭局' });
    return;
  }

  db.prepare('UPDATE participants SET confirmed_payment = 1 WHERE meetup_id = ? AND user_id = ?').run(req.params.id, req.userId!);
  res.json({ message: '付款确认成功' });
});

export default router;
