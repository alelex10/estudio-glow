import { API_BASE_URL } from "../config/api";
interface TestResponse {
  message: string;
}

export class TestService {
  private baseUrl = API_BASE_URL;

  async getTest(): Promise<TestResponse> {
    const response = await fetch(`${this.baseUrl}`);
    return response.json();
  }
}

export const testService = new TestService();