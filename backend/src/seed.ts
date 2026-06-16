import bcrypt from 'bcryptjs';
import db from './database';

function seed() {
  console.log('正在初始化数据库...');

  // 清空数据
  db.exec('DELETE FROM participants');
  db.exec('DELETE FROM meetups');
  db.exec('DELETE FROM users');
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users', 'meetups', 'participants')");

  const hashedPassword = bcrypt.hashSync('123456', 10);

  // 创建用户
  const users = [
    { username: 'zhangsan', nickname: '张三', avatar: '' },
    { username: 'lisi', nickname: '李四', avatar: '' },
    { username: 'wangwu', nickname: '王五', avatar: '' },
    { username: 'zhaoliu', nickname: '赵六', avatar: '' },
  ];

  const insertUser = db.prepare('INSERT INTO users (username, password, nickname, avatar) VALUES (?, ?, ?, ?)');
  const userIds: number[] = [];
  for (const u of users) {
    const result = insertUser.run(u.username, hashedPassword, u.nickname, u.avatar);
    userIds.push(result.lastInsertRowid as number);
  }
  console.log(`已创建 ${users.length} 个用户`);

  // 创建饭局
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86400000);
  const dayAfter = new Date(now.getTime() + 172800000);
  const threeDays = new Date(now.getTime() + 259200000);

  const meetups = [
    {
      creator_id: userIds[0],
      title: '周五火锅局，一起涮肉！',
      restaurant_type: '火锅',
      description: '天气冷了，一起来吃顿热乎乎的火锅吧！这家店的牛肉特别新鲜，毛肚也是一绝。欢迎喜欢辣锅的小伙伴～',
      location: '海底捞（朝阳大悦城店）',
      meeting_time: tomorrow.toISOString().replace('T', ' ').slice(0, 19),
      max_participants: 6,
      estimated_cost: 150,
    },
    {
      creator_id: userIds[1],
      title: '周末日料探店',
      restaurant_type: '日料',
      description: '新开的一家日料店，据说刺身很新鲜，想去试试。一个人去太尴尬，找个搭子一起。',
      location: '千鸟の屋日本料理（三里屯店）',
      meeting_time: dayAfter.toISOString().replace('T', ' ').slice(0, 19),
      max_participants: 4,
      estimated_cost: 200,
    },
    {
      creator_id: userIds[2],
      title: '烧烤啤酒之夜',
      restaurant_type: '烧烤',
      description: '夏天就该吃烧烤喝啤酒！找了家评分很高的烧烤店，有小龙虾和各种烤串。',
      location: '木屋烧烤（望京店）',
      meeting_time: tomorrow.toISOString().replace('T', ' ').slice(0, 19),
      max_participants: 8,
      estimated_cost: 120,
    },
    {
      creator_id: userIds[0],
      title: '西餐小聚，聊聊创业',
      restaurant_type: '西餐',
      description: '想找几个对创业感兴趣的朋友一起吃西餐聊天，交流一下各自的想法和经验。',
      location: 'Wagas（国贸店）',
      meeting_time: threeDays.toISOString().replace('T', ' ').slice(0, 19),
      max_participants: 5,
      estimated_cost: 180,
    },
    {
      creator_id: userIds[3],
      title: '家常菜聚餐，AA制',
      restaurant_type: '家常菜',
      description: '老北京家常菜，量大实惠，味道正宗。红烧肉和宫保鸡丁都很好吃！',
      location: '眉州东坡（亚运村店）',
      meeting_time: dayAfter.toISOString().replace('T', ' ').slice(0, 19),
      max_participants: 6,
      estimated_cost: 100,
    },
    {
      creator_id: userIds[1],
      title: '湘菜辣味挑战',
      restaurant_type: '湘菜',
      description: '你能吃辣吗？来挑战正宗湘菜！剁椒鱼头、辣椒炒肉，辣到爽！',
      location: '费大厨辣椒炒肉（合生汇店）',
      meeting_time: threeDays.toISOString().replace('T', ' ').slice(0, 19),
      max_participants: 4,
      estimated_cost: 130,
    },
  ];

  const insertMeetup = db.prepare(`
    INSERT INTO meetups (creator_id, title, restaurant_type, description, location, meeting_time, max_participants, estimated_cost)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertParticipant = db.prepare('INSERT INTO participants (meetup_id, user_id) VALUES (?, ?)');

  const meetupIds: number[] = [];
  for (const m of meetups) {
    const result = insertMeetup.run(
      m.creator_id, m.title, m.restaurant_type, m.description,
      m.location, m.meeting_time, m.max_participants, m.estimated_cost
    );
    meetupIds.push(result.lastInsertRowid as number);
    // 创建者自动加入
    insertParticipant.run(result.lastInsertRowid, m.creator_id);
  }
  console.log(`已创建 ${meetups.length} 个饭局`);

  // 模拟一些参与者
  insertParticipant.run(meetupIds[0], userIds[1]); // 李四加入火锅局
  insertParticipant.run(meetupIds[0], userIds[2]); // 王五加入火锅局
  insertParticipant.run(meetupIds[2], userIds[0]); // 张三加入烧烤局
  insertParticipant.run(meetupIds[2], userIds[1]); // 李四加入烧烤局
  insertParticipant.run(meetupIds[4], userIds[2]); // 王五加入家常菜聚餐
  insertParticipant.run(meetupIds[5], userIds[0]); // 张三加入湘菜局
  console.log('已添加参与者数据');

  console.log('\n种子数据初始化完成！');
  console.log('测试账号:');
  console.log('  zhangsan / 123456');
  console.log('  lisi / 123456');
  console.log('  wangwu / 123456');
  console.log('  zhaoliu / 123456');
}

seed();
