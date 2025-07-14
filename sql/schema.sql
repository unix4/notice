-- 到期提醒工具数据库表结构
-- 创建时间: 2025-01-14
-- 描述: 用于存储需要监控到期时间的项目信息

CREATE TABLE IF NOT EXISTS items (
    -- 主键，使用UUID格式的文本
    id TEXT PRIMARY KEY,
    
    -- 项目名称，例如域名、VPS、证书等
    name TEXT NOT NULL,
    
    -- 到期时间，使用ISO-8601格式的时间戳
    expiry TIMESTAMP NOT NULL,
    
    -- 价格，以分为单位存储（避免浮点数精度问题）
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    
    -- 续费周期单位：day(天)、month(月)、year(年)
    cycle_unit TEXT NOT NULL CHECK (cycle_unit IN ('day', 'month', 'year')),
    
    -- 续费周期长度，必须为正整数
    cycle_len INTEGER NOT NULL CHECK (cycle_len > 0),
    
    -- Telegram聊天ID，用于发送提醒消息
    chat_id BIGINT NOT NULL,
    
    -- 创建时间（可选，用于审计）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 更新时间（可选，用于审计）
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_items_expiry ON items(expiry);
CREATE INDEX IF NOT EXISTS idx_items_chat_id ON items(chat_id);

-- 创建触发器自动更新 updated_at 字段
CREATE TRIGGER IF NOT EXISTS update_items_updated_at 
    AFTER UPDATE ON items
    FOR EACH ROW
    BEGIN
        UPDATE items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- 插入示例数据（可选，用于测试）
-- INSERT INTO items (id, name, expiry, price_cents, cycle_unit, cycle_len, chat_id) VALUES
-- ('550e8400-e29b-41d4-a716-446655440000', '示例域名 example.com', '2025-02-15 10:00:00', 9900, 'year', 1, 123456789),
-- ('550e8400-e29b-41d4-a716-446655440001', 'VPS服务器', '2025-01-25 15:30:00', 5000, 'month', 1, 123456789);

