import { JTDSchemaType } from "blueboat-types/src/validation/jtd";

export interface AddQuestionRequest {
  owner_ghid: number;
  text: string;
}
export const schema_AddQuestionRequest: JTDSchemaType<AddQuestionRequest> = {
  properties: {
    owner_ghid: { type: "uint32" },
    text: { type: "string" },
  }
};
export const validator_AddQuestionRequest = new Validation.JTD.JTDStaticSchema(schema_AddQuestionRequest);

export interface GetQuestionsRequest {
  owner_ghid: number;
  before: number;
}
export const schema_GetQuestionsRequest: JTDSchemaType<GetQuestionsRequest> = {
  properties: {
    owner_ghid: { type: "uint32" },
    before: { type: "float64" },
  },
};
export const validator_GetQuestionsRequest = new Validation.JTD.JTDStaticSchema(schema_GetQuestionsRequest);

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
