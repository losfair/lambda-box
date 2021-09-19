export const appConfig = {
  inboundToken: App.mustGetEnv("inboundToken"),
  mailFrom: App.mustGetEnv("mailFrom"),
  questionRecipient: App.mustGetEnv("questionRecipient"),
  mailReplyTo: App.mustGetEnv("mailReplyTo"),
  mailgunApiKey: App.mustGetEnv("mailgunApiKey"),
  mailgunApiBaseUrl: App.mustGetEnv("mailgunApiBaseUrl"),
}

export const appDB = App.mysql.lambda;
