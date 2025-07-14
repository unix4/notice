
# notice
# 到期提醒工具

基于 Cloudflare Workers、D1 数据库和 Telegram 的全栈到期提醒小工具。帮助您跟踪域名、VPS、证书等资源的到期时间，并通过 Telegram 自动发送提醒消息。

## 功能特性

- 📅 **到期监控**: 跟踪各种资源的到期时间
- ⏰ **实时倒计时**: 网页端显示精确的倒计时
- 🤖 **自动提醒**: 通过 Telegram 机器人发送到期提醒
- 📱 **响应式设计**: 支持桌面和移动设备
- 🔒 **数据安全**: 使用 Cloudflare D1 数据库存储
- ⚡ **高性能**: 基于 Cloudflare Workers 边缘计算

## 技术栈

- **后端**: Cloudflare Workers (TypeScript)
- **数据库**: Cloudflare D1 (SQLite)
- **前端**: 原生 HTML + CSS + JavaScript
- **通知**: Telegram Bot API
- **部署**: Cloudflare Workers

## 快速开始：手把手教你一键部署到 Cloudflare

本节将详细指导您如何将这个到期提醒工具部署到 Cloudflare，即使您是 Cloudflare 的新手也能轻松完成。整个过程无需复杂的命令行操作，只需简单的点击和配置。

### 1. 准备工作

在开始之前，您需要准备以下内容：

- **GitHub 账号**: 如果您还没有 GitHub 账号，请前往 [GitHub 官网](https://github.com/) 注册一个免费账号。
- **Cloudflare 账号**: 如果您还没有 Cloudflare 账号，请前往 [Cloudflare 官网](https://www.cloudflare.com/) 注册一个免费账号。

### 2. Fork 本项目到您的 GitHub 仓库

首先，您需要将本项目的代码复制（Fork）到您自己的 GitHub 账号下。这样，您就可以自由地修改和部署代码了。

1.  访问本项目的 GitHub 仓库页面（假设为 `https://github.com/your-username/expiry-reminder`）。
2.  点击页面右上角的 **`Fork`** 按钮。这会将项目的完整副本创建到您的 GitHub 账号下。

### 3. 在 Cloudflare 创建 D1 数据库

D1 是 Cloudflare 提供的一个基于 SQLite 的无服务器数据库。我们的到期提醒工具将使用它来存储您的项目信息。

1.  登录您的 Cloudflare 仪表板：[https://dash.cloudflare.com/](https://dash.cloudflare.com/)
2.  在左侧导航栏中，找到并点击 **`Workers 和 Pages`**。
3.  在 Workers 和 Pages 页面中，点击左侧的 **`D1`**。
4.  点击 **`创建数据库`** 按钮。
5.  为您的数据库输入一个名称，例如 `expiry-db`，然后点击 **`创建`**。
6.  数据库创建成功后，您会看到数据库的详细信息页面。请复制页面上显示的 **`数据库 ID`** (一串长长的字符)。

### 4. 配置 Telegram Bot

为了让到期提醒工具能够发送 Telegram 消息，您需要创建一个 Telegram 机器人并获取其 Bot Token。

1.  **在 Telegram 中创建机器人**: 
    - 打开 Telegram 应用，在搜索框中搜索 `@BotFather` 并打开它（官方机器人会有蓝色认证标记）。
    - 向 `@BotFather` 发送命令 `/newbot`。
    - 按照提示为您的机器人设置一个**名称**（例如：“到期提醒小助手”）和一个**用户名**（必须以 `bot` 结尾，例如：“ExpiryReminderBot”）。
    - 成功创建后，`@BotFather` 会给您一个 `HTTP API Token`，这串字符就是您的 Bot Token。请**务必**复制并妥善保管它，因为它非常重要。

2.  **获取 Telegram Chat ID**: 
    Chat ID 是 Telegram 用于识别您个人聊天或群组的唯一标识符。到期提醒工具需要这个 ID 来知道将消息发送给谁。
    - 在 Telegram 中搜索 `@userinfobot` 并打开它。
    - 向 `@userinfobot` 发送命令 `/start`。
    - 机器人会立即回复您的 Chat ID（通常是一串数字）。请复制这串 ID，您在网页端添加项目时会用到它。

### 5. 部署项目到 Cloudflare Workers

现在，我们将把 Fork 后的项目部署到 Cloudflare Workers。

1.  登录您的 Cloudflare 仪表板：[https://dash.cloudflare.com/](https://dash.cloudflare.com/)
2.  在左侧导航栏中，找到并点击 **`Workers 和 Pages`**。
3.  点击 **`创建应用程序`** 按钮。
4.  选择 **`Workers`** 选项卡，然后点击 **`部署到 Workers`**。
5.  在“创建 Worker”页面，选择 **`从 Git 导入`**。
6.  点击 **`连接到 GitHub`**，授权 Cloudflare 访问您的 GitHub 仓库。
7.  选择您刚刚 Fork 的 `expiry-reminder` 仓库，然后点击 **`开始设置`**。
8.  **配置构建和部署设置**：
    - **项目名称**: 输入一个您喜欢的项目名称，例如 `expiry-reminder`。
    - **生产分支**: 保持默认 `main` 或 `master` (取决于您的仓库主分支名称)。
    - **构建命令**: 留空（本项目无需单独构建）。
    - **构建输出目录**: 留空。
9.  **配置环境变量**：
    - 点击 **`添加变量`**。
    - 变量名称填写 `TELEGRAM_TOKEN`，值填写您在“步骤 4”中获取到的 Telegram Bot Token。
10. **配置 D1 数据库绑定**：
    - 点击 **`添加绑定`**。
    - 变量名称填写 `DB` (必须是这个名称)。
    - D1 数据库选择您在“步骤 3”中创建的 `expiry-db` 数据库。
11. **配置 Cron 触发器**：
    - 点击 **`添加 Cron 触发器`**。
    - Cron 表达式填写 `0 0 * * *` (表示每天 00:00 America/Los_Angeles 时区触发)。
12. **配置 R2 存储桶绑定 (可选，用于静态文件)**：
    - 点击 **`添加绑定`**。
    - 变量名称填写 `ASSETS` (必须是这个名称)。
    - R2 存储桶选择 **`创建存储桶`**，输入一个名称，例如 `expiry-reminder-assets`，然后点击 **`创建`**。
13. 确认所有设置无误后，点击 **`保存并部署`**。

Cloudflare 将会自动从您的 GitHub 仓库拉取代码，并部署您的 Worker。部署过程可能需要几分钟，请耐心等待。

部署成功后，您会看到一个 `*.workers.dev` 域名，例如 `https://expiry-reminder.your-subdomain.workers.dev`。点击这个链接，就可以访问您的到期提醒工具了！

### 6. 初始化 D1 数据库表结构

虽然我们已经绑定了 D1 数据库，但还需要手动执行一次 SQL 脚本来创建 `items` 表。

1.  回到 Cloudflare 仪表板，进入 **`Workers 和 Pages`** -> **`D1`**，找到您的 `expiry-db` 数据库。
2.  点击数据库名称进入详情页，然后点击 **`查询`** 选项卡。
3.  将以下 SQL 语句复制并粘贴到查询框中：

```sql
CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    expiry TIMESTAMP NOT NULL,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    cycle_unit TEXT NOT NULL CHECK (cycle_unit IN (
        'day',
        'month',
        'year'
    )),
    cycle_len INTEGER NOT NULL CHECK (cycle_len > 0),
    chat_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_items_expiry ON items(expiry);
CREATE INDEX IF NOT EXISTS idx_items_chat_id ON items(chat_id);

CREATE TRIGGER IF NOT EXISTS update_items_updated_at
AFTER UPDATE ON items
FOR EACH ROW
BEGIN
    UPDATE items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
```
4.  点击 **`运行`** 按钮。如果成功，您会看到“查询成功”的提示。

### 7. (可选) 本地开发与测试

如果您想在本地进行开发和测试，可以使用以下命令：

```bash
# 首先确保您已安装 Node.js 和 npm，并在项目根目录运行 npm install
npm install

# 启动本地开发服务器
npm run dev
```

这会在本地启动一个开发服务器，您可以通过访问 `http://localhost:8787` 来查看应用。本地开发时，D1 数据库会使用本地的 SQLite 文件，不会影响您部署到 Cloudflare 的线上数据库。

### 8. (可选) 自定义域名

如果您希望使用自己的域名来访问到期提醒工具（例如 `remind.yourdomain.com`），而不是 Cloudflare 提供的 `*.workers.dev` 域名，可以按照以下步骤操作：

1.  **在 Cloudflare 中添加您的域名**: 如果您的域名还没有添加到 Cloudflare，请先将其添加到您的 Cloudflare 账号中，并按照指引配置 DNS。
2.  **在 Workers 控制台中绑定自定义域名**: 
    - 登录 Cloudflare 控制台，进入您的 Workers 服务。
    - 找到您部署的 `expiry-reminder` Worker。
    - 在 Worker 的设置页面中，找到“触发器”或“路由”部分，添加一个新的自定义域名路由，将您的自定义域名指向这个 Worker。
3.  **更新 DNS 记录**: 确保您的自定义域名的 DNS 记录（通常是 CNAME 记录）指向您的 Worker 域名（例如 `expiry-reminder.YOUR_WORKERS_SUBDOMAIN.workers.dev`）。

## 使用说明

### 添加监控项目

1.  打开您部署好的到期提醒工具网页（例如 `https://expiry-reminder.YOUR_WORKERS_SUBDOMAIN.workers.dev`）。
2.  在“添加新项目”表单中填写以下信息：
    - **名称**: 资源的名称，例如“我的域名 example.com”、“VPS 服务器”、“SSL 证书”等，方便您识别。
    - **到期时间**: 点击输入框，选择该资源的具体到期日期和时间。请务必选择准确的时间，这将用于计算倒计时和发送提醒。
    - **价格 (元)**: 续费该资源所需的价格，单位是元。例如，如果续费需要 99.99 元，就填写 `99.99`。
    - **续费周期**: 填写续费的周期长度（例如 `1`）和周期单位（从下拉菜单中选择“天”、“月”或“年”）。例如，如果每年续费一次，就选择 `1` 和 `年`。
    - **Telegram Chat ID**: 填写您在“步骤 4”中获取到的 Telegram Chat ID。这是机器人发送提醒消息的目标。
3.  填写完毕后，点击“添加项目”按钮。项目会立即显示在下方的项目列表中。

### 管理项目

- **编辑**: 在项目列表中，点击某个项目旁边的“编辑”按钮，表单会自动填充该项目的信息，您可以修改后点击“更新项目”按钮保存。
- **删除**: 点击某个项目旁边的“删除”按钮，会弹出确认提示，确认后该项目将被移除。
- **查看倒计时**: 页面会实时显示每个项目距离到期的剩余时间，并根据剩余时间长短显示不同的颜色（例如，7天内到期会变黄，1天内到期会变红）。

### 自动提醒

系统会在每天的 **00:00（America/Los_Angeles 时区）** 自动运行一个定时任务，检查所有即将到期的项目。如果某个项目在 **未来 7 天内** 到期，系统就会通过您的 Telegram 机器人向您发送提醒消息，消息格式如下：

```
🔔 域名 example.com 将于 2025-01-21 到期，价格 99.00 元
```

## 故障排除

### 常见问题

**Q: Telegram 消息发送失败**
A: 请检查以下几点：
- **Bot Token 是否正确设置**: 确保您在“步骤 5”中设置的 `TELEGRAM_TOKEN` 是正确的。
- **Chat ID 是否正确**: 确保您在添加项目时填写的 Chat ID 是您自己的，并且是正确的。
- **是否已向机器人发送过消息**: Telegram 机器人无法主动向用户发送消息，用户必须先向机器人发送一条消息（例如 `/start`），机器人才能获取到该用户的 Chat ID 并开始发送消息。

**Q: 数据库连接失败**
A: 请检查：
- **D1 数据库绑定是否正确**: 确保您在“步骤 5”中将 `DB` 变量正确绑定到了您创建的 D1 数据库。
- **数据库表结构是否已初始化**: 确保您在“步骤 6”中执行了 SQL 脚本来创建 `items` 表。

**Q: 页面无法加载或显示空白**
A: 请检查：
- **Workers 是否部署成功**: 确保您在“步骤 5”中成功部署了 Worker。
- **域名配置是否正确**: 如果您使用了自定义域名，请检查您的 DNS 配置是否正确指向了您的 Worker。
- **浏览器控制台是否有错误信息**: 按下 `F12` 键打开浏览器开发者工具，查看“Console”（控制台）或“Network”（网络）选项卡，是否有红色的错误信息。

### 调试模式

在本地开发时，您可以使用以下命令进行调试：

```bash
# 首先确保您已安装 Node.js 和 npm，并在项目根目录运行 npm install
npm install

# 启动本地开发服务器
npm run dev
```

这会在本地启动一个开发服务器，您可以通过访问 `http://localhost:8787` 来查看应用。本地开发时，D1 数据库会使用本地的 SQLite 文件，不会影响您部署到 Cloudflare 的线上数据库。

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 许可证

MIT License

## 更新日志

### v1.0.0 (2025-01-14)
- 初始版本发布
- 支持项目添加、编辑、删除
- 实时倒计时显示
- Telegram 自动提醒功能
- 响应式设计支持

---



# notice
