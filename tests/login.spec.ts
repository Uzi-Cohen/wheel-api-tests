import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';
import { AuthApi } from '../api/Auth';

test.describe('Login', () => {

  test('new device creates a new account', async ({ request }) => {
    const auth = new AuthApi(request);
    const deviceId = `candidate_test_${uuidv4()}`;

    const session = await auth.login(deviceId);

    expect(session.AccessToken).toBeTruthy();
    expect(session.AccountCreated).toBe(true);
    expect(session.Session.SessionCounter).toBe(1);
    expect(session.DisplayName).toMatch(/^Guest_\d+/);
  });

  test('same device reconnects to existing account', async ({ request }) => {
    const auth = new AuthApi(request);
    const deviceId = `candidate_test_${uuidv4()}`;

    const session1 = await auth.login(deviceId);
    const session2 = await auth.login(deviceId);

    expect(session2.AccountCreated).toBe(false);
    expect(session2.Session.SessionCounter).toBe(2);
    expect(session2.ExternalPlayerId).toBe(session1.ExternalPlayerId);
  });

  test('balance fields are consistent on login', async ({ request }) => {
    const auth = new AuthApi(request);
    const session = await auth.login(`candidate_test_${uuidv4()}`);

    // Top-level shortcut fields should match UserBalance
    expect(session.CoinsAmount).toBe(session.UserBalance.Coins);
    expect(session.GemsAmount).toBe(session.UserBalance.Gems);
    expect(session.EnergyAmount).toBe(session.UserBalance.Energy);
  });
  

});