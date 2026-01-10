import { apiClient } from "../config/api-client";

interface TestResponse {
  message: string;
}

export class TestService {
  getTest = () => apiClient<TestResponse>("/");
}

export const testService = new TestService();
