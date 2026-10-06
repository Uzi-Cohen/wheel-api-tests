import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';
import { AuthApi } from '../api/Auth';
import { WheelApi } from '../api/Wheel';

test.describe('Wheel Wedges', () => {

  test('spin lands on a valid wedge from the wheel config', async ({ request }) => {
    const auth = new AuthApi(request);
    const wheel = new WheelApi(request);
    const deviceId = `candidate_test_${uuidv4()}`;

    // Login gives us the wheel config AND the access token
    const session = await auth.login(deviceId);
    const wedges = session.Wheel.Wedges;
    const spinBody = await wheel.spin(session.AccessToken);

    const selectedIndex = spinBody.response.SelectedIndex;
    const reward = spinBody.response.SpinResult.Rewards[0];

    // SelectedIndex must point to a real wedge
    expect(selectedIndex).toBeGreaterThanOrEqual(0);
    expect(selectedIndex).toBeLessThan(wedges.length);

    // The reward we got must match what that wedge promises
    const expectedWedge = wedges[selectedIndex];
    const expectedReward = expectedWedge.Rewards[0];

    expect(reward.RewardDefinitionType).toBe(expectedReward.RewardDefinitionType);
    expect(reward.RewardResourceType).toBe(expectedReward.RewardResourceType);
    expect(reward.Amount).toBe(expectedReward.Amount);
  });

  test('wheel config has exactly 26 wedges', async ({ request }) => {
    const auth = new AuthApi(request);
    const session = await auth.login(`candidate_test_${uuidv4()}`);

    expect(session.Wheel.Wedges.length).toBe(26);
  });

  test('every wedge has at least one reward with a valid type', async ({ request }) => {
    const auth = new AuthApi(request);
    const session = await auth.login(`candidate_test_${uuidv4()}`);

    for (const wedge of session.Wheel.Wedges) {
      expect(wedge.Rewards.length).toBeGreaterThan(0);
      expect([1, 6]).toContain(wedge.Rewards[0].RewardDefinitionType); // 1=currency, 6=action
      expect(wedge.Rewards[0].Amount).toBeGreaterThan(0);
    }
  });

  test('wheel config is consistent across sessions', async ({ request }) => {
    const auth = new AuthApi(request);

    // Two different users should see the exact same wheel config
    const session1 = await auth.login(`candidate_test_${uuidv4()}`);
    const session2 = await auth.login(`candidate_test_${uuidv4()}`);

    expect(session1.Wheel.WheelId).toBe(session2.Wheel.WheelId);
    expect(session1.Wheel.Wedges.length).toBe(session2.Wheel.Wedges.length);

    // Each wedge matches position by position
    for (let i = 0; i < session1.Wheel.Wedges.length; i++) {
      const w1 = session1.Wheel.Wedges[i].Rewards[0];
      const w2 = session2.Wheel.Wedges[i].Rewards[0];
      expect(w1.RewardDefinitionType).toBe(w2.RewardDefinitionType);
      expect(w1.Amount).toBe(w2.Amount);
    }
  });

});