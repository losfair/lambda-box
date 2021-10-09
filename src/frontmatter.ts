import { JTDSchemaType } from "blueboat-types/src/validation/jtd";

const schema: JTDSchemaType<Record<string, string>> = {
  values: {
    type: "string",
  }
};

const validator = new Validation.JTD.JTDStaticSchema(schema);
const matcher = /^\s*(---([\s\S]+)---)?([\s\S]*)$/;

export interface DocumentWithFrontMatter {
  content: string,
  frontMatter: Record<string, string>,
}

export function parseDocumentWithFrontMatter(raw: string): DocumentWithFrontMatter {
  const m = matcher.exec(raw);
  if(!m) throw new Error("matcher returned null");

  const frontMatterText = (m[2] || "").trim();
  const content = (m[3] || "").trim();

  const frontMatter = frontMatterText ? TextUtil.Yaml.parse(frontMatterText) : {};
  if(!validator.validate(frontMatter)) {
    throw new Error("bad front matter: " + validator.lastError);
  }

  return {
    content,
    frontMatter,
  };
}
