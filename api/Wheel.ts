import { APIRequestContext } from '@playwright/test';
import { BASE_URL } from './config';

export class WheelApi {
  constructor(private request: APIRequestContext) {}

  async spin(accessToken: string, multiplier: number = 1) {
    const res = await this.request.post(`${BASE_URL}/api/frontend/wheel//v1`, {
      headers: { 'Content-Type': 'application/json', accessToken },
      data: { multiplier },
    });
    return res.json();
  }
}
