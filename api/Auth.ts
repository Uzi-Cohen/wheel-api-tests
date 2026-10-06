import { APIRequestContext } from '@playwright/test';
import { BASE_URL, LOGIN_SOURCE } from './config';

// Wraps the login call so every test can create or reconnect a user in one line.
export class AuthApi {
  constructor(private request: APIRequestContext) {}

  async login(deviceId: string) {
    const res = await this.request.post(`${BASE_URL}/api/frontend/login/v4/login`, {
      headers: { 'Content-Type': 'application/json' },
      data: { DeviceId: deviceId, LoginSource: LOGIN_SOURCE },
    });
    const body = await res.json();
    return body.response.LoginResponse;
  }
}
