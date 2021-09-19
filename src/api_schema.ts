import Ajv, { JTDSchemaType } from "ajv/dist/jtd";

const ajv = new Ajv();

export interface AddQuestionRequest {
  text: string;
}
export const schema_AddQuestionRequest: JTDSchemaType<AddQuestionRequest> = {
  properties: {
    text: { type: "string" },
  }
};
export const parser_AddQuestionRequest = ajv.compileParser(schema_AddQuestionRequest);

export interface GetQuestionsRequest {
  before: number;
}
export const schema_GetQuestionsRequest: JTDSchemaType<GetQuestionsRequest> = {
  properties: {
    before: { type: "float64" },
  },
};
export const parser_GetQuestionsRequest = ajv.compileParser(schema_GetQuestionsRequest);

export interface QuestionListResponse {
  questions: {
    id: number,
    entry: {
      time: number
      question: string,
      response: string,
    }
  }[],
}
export const schema_QuestionListResponse: JTDSchemaType<QuestionListResponse> = {
  properties: {
    questions: {
      elements: {
        properties: {
          id: { type: "float64" },
          entry: {
            properties: {
              time: { type: "float64" },
              question: { type: "string" },
              response: { type: "string" },
            }
          }
        }
      }
    }
  }
}
export const serializer_QuestionListResponse = ajv.compileSerializer(schema_QuestionListResponse);
