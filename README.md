# 饭搭子组局 (Dinner Meetup Organizer)

一个帮助用户组织和参加饭局的社交平台。发起饭局、邀请他人参加、自动AA计算。

## 功能

- **用户注册登录** - JWT认证，安全可靠
- **发起饭局** - 选择餐厅类型（火锅/烧烤/日料/西餐/家常菜等）、时间、地点、人数上限、费用预估
- **组局广场** - 浏览所有进行中的饭局，一键参加
- **满员截止** - 人数达到上限自动截止报名
- **AA结算** - 发起人录入实际花费，系统自动计算每人金额，参与者确认付款
- **个人中心** - 查看我发起的和参加过的饭局记录

## 技术栈

- **前端**: Vite + React 18 + TypeScript (端口 5209)
- **后端**: Express + TypeScript + better-sqlite3 (端口 3209)
- **认证**: JWT + bcryptjs
- **开发工具**: concurrently

## 快速开始

```bash
# 安装依赖
npm run install:all

# 初始化种子数据
npm run seed

# 启动开发服务器
npm run dev
```

前端访问: http://localhost:5209
后端API: http://localhost:3209/api

## 种子数据

运行 `npm run seed` 会创建以下测试账号:

| 用户名 | 密码 |
|--------|------|
| zhangsan | 123456 |
| lisi | 123456 |
| wangwu | 123456 |
| zhaoliu | 123456 |

## API 接口

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户

### 饭局
- `GET /api/meetups` - 获取饭局列表（广场）
- `POST /api/meetups` - 创建饭局
- `GET /api/meetups/:id` - 获取饭局详情
- `POST /api/meetups/:id/join` - 加入饭局
- `POST /api/meetups/:id/leave` - 退出饭局
- `POST /api/meetups/:id/expense` - 录入实际花费
- `POST /api/meetups/:id/confirm` - 确认付款

### 用户
- `GET /api/users/me` - 个人信息及统计
- `GET /api/users/me/created` - 我发起的饭局
- `GET /api/users/me/joined` - 我参加的饭局
