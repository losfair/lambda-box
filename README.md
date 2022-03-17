# λ-box

λ-box is a selfhosted anonymous question box app, powered by [Blueboat](https://github.com/losfair/blueboat).

λ-box 是一个运行在 [Blueboat](https://github.com/losfair/blueboat) 上的匿名提问箱 app.

[My λ-box](https://ama.zhy.site/)

## Dependencies

- Blueboat
- MySQL
- Mailgun *and* Sendgrid accounts

## Example config

```yaml
endpoint: https://blueboat.example.com/
env:
  inboundToken: "your-inbound-token"
  mailFrom: "λ-box <lambda-box@example.com>"
  mailReplyTo: "reply@inbound.example.com"
  mailgunApiKey: "your-mailgun-api-key"
  mailgunApiBaseUrl: "https://api.mailgun.net/v3/mg.example.com"
  icpBeian: "xxx" # only if you run this service on a mainland China server
  ghToken: "your-github-oauth-api-token"
  allowedGhUsers: "losfair,octocat"
#  allowedCountries: "CN"
mysql:
  lambda:
    url: "mysql://lambda_box:some-password@mysql-server/lambda_box"
```

## License

Public domain software licensed under Unlicense.

公有领域软件，Unlicense.
