import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'data.db');

const db: Database.Database = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nickname TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS meetups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    restaurant_type TEXT NOT NULL,
    description TEXT DEFAULT '',
    location TEXT NOT NULL,
    meeting_time DATETIME NOT NULL,
    max_participants INTEGER NOT NULL,
    estimated_cost REAL NOT NULL,
    actual_cost REAL,
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'full', 'settled', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meetup_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    confirmed_payment INTEGER DEFAULT 0,
    FOREIGN KEY (meetup_id) REFERENCES meetups(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(meetup_id, user_id)
  );
`);

export default db;
