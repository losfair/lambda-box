import { JTDParser } from "ajv/dist/jtd";

export async function tyckRequest<T>(
  req: Request,
  parser: JTDParser<T>
): Promise<T | Response> {
  const text = await req.text();
  const res = parser(text);
  if (res === undefined) {
    let res = {
      error: "decode_error",
      message: parser.message,
      position: parser.position,
    };
    return new Response(JSON.stringify(res), {
      status: 400,
    });
  } else {
    return res;
  }
}

export function jsonResponse<T>(
  value: T,
  serializer: (x: T) => string
): Response {
  return new Response(serializer(value), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function jsonGenericErrorResponse(
  status: number,
  message: string
): Response {
  return new Response(
    JSON.stringify({
      error: "generic_error",
      message,
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
