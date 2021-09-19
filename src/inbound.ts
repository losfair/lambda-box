import Busboy from "busboy"

export interface InboundMail {
  fields: Record<string, string>;
}

export interface MailInfo {
  subject: string;
  content: MailContent;
  envelope: Envelope;
  prettyFrom: string;

  targetTopic: string;
  headers: Record<string, string>;
}

export type MailContent = {
  text: string;
  html?: string;
};

export interface Envelope {
  to: string[];
  from: string;
}

export function parseInboundMail(raw: string, contentType: string): Promise<InboundMail> {
  return new Promise((resolve) => {
    const bb = new Busboy({ headers: { "content-type": contentType } });
    const inbound: InboundMail = {
      fields: {},
    };

    bb
      .on("field", (fieldname, val) => {
        inbound.fields[fieldname] = "" + val;
      })
      .on("finish", () => {
        resolve(inbound);
      });

    bb.end(raw);
  });
}

export function refineMail(inbound: InboundMail): MailInfo {
  if (inbound.fields.SPF !== "pass") throw new Error("refineMail: SPF fail");

  const subject = inbound.fields.subject;
  const prettyFrom = inbound.fields.from;
  const envelope = JSON.parse(inbound.fields.envelope);

  const content = {
    text: inbound.fields.text || "",
    html: inbound.fields.html,
  };

  if (
    !subject ||
    !prettyFrom ||
    !envelope.from ||
    !envelope.to ||
    !envelope.to[0]
  ) {
    throw new Error("refineMail: bad inbound");
  }

  const fromDomain = envelope.from.split("@")[1];
  const expectedDkim = `{@${fromDomain} : pass}`;
  if (expectedDkim !== inbound.fields.dkim)
    throw new Error("refineMail: DKIM fail");

  const targetTopic = envelope.to[0].split("@")[0];

  // Decode mail headers
  const headers = Object.fromEntries(
    (inbound.fields["headers"] || "")
      .split("\n")
      .map((x) => x.trim())
      .filter((x) => x)
      .map((x) => x.split(":", 2))
      .filter((x) => x.length == 2)
      .map(([k, v]) => [k.toLowerCase().trim(), v.trim()])
  );

  return {
    subject,
    content,
    envelope,
    targetTopic,
    prettyFrom,
    headers,
  };
}