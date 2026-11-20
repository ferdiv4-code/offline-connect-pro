import * as SQLite from 'expo-sqlite';
let dbPromise:Promise<SQLite.SQLiteDatabase>|null=null;
export async function initializeDatabase(){
  if(!dbPromise)dbPromise=SQLite.openDatabaseAsync('offline-connect-pro.db');
  const db=await dbPromise;
  await db.execAsync(`
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS local_users(id TEXT PRIMARY KEY NOT NULL,display_name TEXT NOT NULL,status TEXT NOT NULL DEFAULT '',avatar_uri TEXT,updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS rooms(id TEXT PRIMARY KEY NOT NULL,name TEXT NOT NULL,description TEXT,code TEXT,is_private INTEGER NOT NULL DEFAULT 0,max_members INTEGER NOT NULL DEFAULT 8,host_ip TEXT,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS conversations(id TEXT PRIMARY KEY NOT NULL,title TEXT NOT NULL,kind TEXT NOT NULL,peer_id TEXT,updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS messages(id TEXT PRIMARY KEY NOT NULL,conversation_id TEXT NOT NULL,sender_id TEXT NOT NULL,sender_name TEXT NOT NULL DEFAULT '',body TEXT NOT NULL,message_type TEXT NOT NULL DEFAULT 'text',file_name TEXT,file_mime TEXT,file_base64 TEXT,created_at TEXT NOT NULL,delivery_state TEXT NOT NULL DEFAULT 'local');
    CREATE TABLE IF NOT EXISTS call_history(id TEXT PRIMARY KEY NOT NULL,peer_name TEXT NOT NULL,call_type TEXT NOT NULL,created_at TEXT NOT NULL,duration_seconds INTEGER NOT NULL DEFAULT 0);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id,created_at);
  `);
  const migrations = [
    'ALTER TABLE rooms ADD COLUMN code TEXT',
    'ALTER TABLE rooms ADD COLUMN max_members INTEGER NOT NULL DEFAULT 8',
    'ALTER TABLE rooms ADD COLUMN host_ip TEXT',
    'ALTER TABLE conversations ADD COLUMN peer_id TEXT',
    "ALTER TABLE messages ADD COLUMN sender_name TEXT NOT NULL DEFAULT ''",
    'ALTER TABLE messages ADD COLUMN file_name TEXT',
    'ALTER TABLE messages ADD COLUMN file_mime TEXT',
    'ALTER TABLE messages ADD COLUMN file_base64 TEXT'
  ];
  for (const sql of migrations) { try { await db.execAsync(sql); } catch { /* Column already exists on upgraded installs. */ } }
  return db;
}
export async function saveMessage(m:any){
  const db=await initializeDatabase();
  await db.runAsync(`INSERT OR REPLACE INTO messages(id,conversation_id,sender_id,sender_name,body,message_type,file_name,file_mime,file_base64,created_at,delivery_state) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
    m.id,m.conversationId,m.senderId,m.senderName||'',m.body,m.type||'text',m.fileName||null,m.fileMime||null,m.fileBase64||null,m.createdAt,m.deliveryState||'sent');
  await db.runAsync(`INSERT INTO conversations(id,title,kind,peer_id,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET updated_at=excluded.updated_at`,
    m.conversationId,m.conversationTitle||'Conversation',m.kind||'group',m.peerId||null,m.createdAt);
}
export async function getMessages(conversationId:string){
  const db=await initializeDatabase();
  return db.getAllAsync<any>('SELECT * FROM messages WHERE conversation_id=? ORDER BY created_at ASC',conversationId);
}
export async function getConversations(){
  const db=await initializeDatabase();
  return db.getAllAsync<any>(`SELECT c.*, (SELECT body FROM messages m WHERE m.conversation_id=c.id ORDER BY created_at DESC LIMIT 1) last_message,
  (SELECT created_at FROM messages m WHERE m.conversation_id=c.id ORDER BY created_at DESC LIMIT 1) last_time
  FROM conversations c ORDER BY updated_at DESC`);
}
export async function saveLocalUser(user:{id:string;name:string;status:string;avatar:string|null}){
  const db=await initializeDatabase();
  await db.runAsync('INSERT OR REPLACE INTO local_users(id,display_name,status,avatar_uri,updated_at) VALUES(?,?,?,?,?)',user.id,user.name,user.status,user.avatar,new Date().toISOString());
}
