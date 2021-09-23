import { JTDStaticSchema } from "jsland-types/src/validation/jtd";

export async function tyckRequest<T>(
  req: Request,
  validator: JTDStaticSchema<T>,
): Promise<T | Response> {
  const raw: unknown = await req.json();
  if(!validator.validate(raw)) {
    let res = {
      error: "decode_error",
      message: validator.lastError || "",
    };
    return new Response(JSON.stringify(res), {
      status: 400,
    });
  } else {
    return raw;
  }
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

export function mkJsonResponse(status: number, data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
    status: status,
  });
}
