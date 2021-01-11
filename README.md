# λ-box

λ-box is a selfhosted anonymous question box app, powered by rusty-workers.

Readme is Chinese only since this app is built under a Chinese context.

λ-box 是一个匿名提问箱 app ，由 rusty-workers 驱动。

[我的 λ-box](https://qbox.invariant.cn/)

## 搭建

首先请确保：

- 你有对一个 [rusty-workers](https://github.com/losfair/rusty-workers) 服务的访问权限（可以自建）
- 安装了 node 和 npm
- 你有 Mailgun 和 Sendgrid 的账号（免费版本即可）

**Step 1** 构建 app 包:

```bash
./build.sh
```

**Step 2** 将 `qbox_config.template.toml` 复制到 `qbox_config.toml` 并做必要修改：

- MAILGUN_API_BASE_URL: 你的 Mailgun 服务的 Base URL
- MAILGUN_API_KEY: 你的 Mailgun API KEY
- QUESTION_RECIPIENT: 问题会被发送到这个电子邮件地址
- INBOUND_TOKEN: Sendgrid 收到邮件回复后的回调 Token
- MAIL_FROM: 发件地址，需要是 Mailgun 已授权的地址，例：`λ-box <lambda-box@example.com>`
- MAIL_REPLY_TO: 回复地址，由 Sendgrid 管理，例：`reply@lambda-box-inbound.example.com`

**Step 3** 部署到 rusty-workers：

将第一步得到的 `qbox-build.tar` 和第二步得到的 `qbox_config.toml` 上传到有权限访问 rusty-workers 服务的机器，然后执行：

```bash
export RUST_LOG=info

# 添加 app
rusty-workers-cli app add-app qbox_config.toml --bundle qbox-build.tar

# 添加路由
# 如果你在第二步中修改了 qbox_config.toml 的 "id" 字段，此处 appid 也须更改
rusty-workers-cli app add-route qbox.your-domain.com --path / --appid 3f2c84e2-11ee-49c4-b95f-fced6b415161

```

**Step 4** Enjoy!
