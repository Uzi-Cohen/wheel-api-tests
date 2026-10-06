import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';
import { AuthApi } from '../api/Auth';
import { WheelApi } from '../api/Wheel';

 
// Known reward types from the API
const REWARD_TYPES = {
  CURRENCY: 1,  // coins, gems, energy
  ACTION: 6,    // boosters, cards
};
 
const RESOURCE_TYPES = {
  COINS: 1,
  ENERGY: 2,
  GEMS: 3,
};
 
test.describe('Wheel Spin', () => {
 
  test('spin returns a valid reward', async ({ request }) => {
    const auth = new AuthApi(request);
    const wheel = new WheelApi(request);
 
    const session = await auth.login(`candidate_test_${uuidv4()}`);
    const body = await wheel.spin(session.AccessToken);
 
    expect(body.status).toBe(0);
    expect(body.response.SelectedIndex).toBeGreaterThanOrEqual(0);
    expect(body.response.SpinResult.Rewards.length).toBeGreaterThan(0);
    expect(body.response.SpinResult.Rewards[0].Amount).toBeGreaterThan(0);
  });
 
  test('reward type is a known type', async ({ request }) => {
    const auth = new AuthApi(request);
    const wheel = new WheelApi(request);
 
    const session = await auth.login(`candidate_test_${uuidv4()}`);
    const body = await wheel.spin(session.AccessToken);
    const reward = body.response.SpinResult.Rewards[0];
 
    // RewardDefinitionType must be one of the known types
    expect(Object.values(REWARD_TYPES)).toContain(reward.RewardDefinitionType);
 
    // If it's a currency reward, resource type must also be known
    if (reward.RewardDefinitionType === REWARD_TYPES.CURRENCY) {
      expect(Object.values(RESOURCE_TYPES)).toContain(reward.RewardResourceType);
    }
  });
 
  test('spin costs exactly 1 energy', async ({ request }) => {
    const auth = new AuthApi(request);
    const wheel = new WheelApi(request);
 
    const session = await auth.login(`candidate_test_${uuidv4()}`);
    const energyBefore = session.UserBalance.Energy;
 
    const body = await wheel.spin(session.AccessToken);
 
    expect(body.response.SpinResult.UserBalance.Energy).toBe(energyBefore - 1);
  });
 
  test('multiple spins each cost 1 energy and accumulate coins', async ({ request }) => {
    const auth = new AuthApi(request);
    const wheel = new WheelApi(request);
 
    const session = await auth.login(`candidate_test_${uuidv4()}`);
    const energyBefore = session.UserBalance.Energy;
 
    const spin1 = await wheel.spin(session.AccessToken);
    const spin2 = await wheel.spin(session.AccessToken);
    const spin3 = await wheel.spin(session.AccessToken);
 
    // Energy decreases by 1 each spin
    expect(spin1.response.SpinResult.UserBalance.Energy).toBe(energyBefore - 1);
    expect(spin2.response.SpinResult.UserBalance.Energy).toBe(energyBefore - 2);
    expect(spin3.response.SpinResult.UserBalance.Energy).toBe(energyBefore - 3);
 
    // Coins after spin3 must be >= coins after spin1
    const coinsAfterSpin1 = spin1.response.SpinResult.UserBalance.Coins;
    const coinsAfterSpin3 = spin3.response.SpinResult.UserBalance.Coins;
    expect(coinsAfterSpin3).toBeGreaterThanOrEqual(coinsAfterSpin1);
  });
 
  test('spin without access token is rejected', async ({ request }) => {
    const wheel = new WheelApi(request);
 
    const body = await wheel.spin('invalid_token');
 
    // Backend must reject unauthorized spin attempts
    expect(body.status).not.toBe(0);
  });
 
  test('spin fails when energy is 0', async ({ request }) => {
    const auth = new AuthApi(request);
    const wheel = new WheelApi(request);
 
    const session = await auth.login(`candidate_test_${uuidv4()}`);
 
    // Drain all energy
    let energy = session.UserBalance.Energy;
    while (energy > 0) {
      const body = await wheel.spin(session.AccessToken);
      energy = body.response.SpinResult.UserBalance.Energy;
    }
 
    // One more spin on empty energy — must fail
    const body = await wheel.spin(session.AccessToken);
    expect(body.status).not.toBe(0);
  });
 
  test('balance after spin persists on relogin', async ({ request }) => {
    const auth = new AuthApi(request);
    const wheel = new WheelApi(request);
    const deviceId = `candidate_test_${uuidv4()}`;
 
    const session1 = await auth.login(deviceId);
    const spinBody = await wheel.spin(session1.AccessToken);
    const balanceAfterSpin = spinBody.response.SpinResult.UserBalance;
 
    const session2 = await auth.login(deviceId);
 
    expect(session2.UserBalance.Coins).toBe(balanceAfterSpin.Coins);
    expect(session2.UserBalance.Energy).toBe(balanceAfterSpin.Energy);
    expect(session2.UserBalance.Gems).toBe(balanceAfterSpin.Gems);
  });
 
test('two fresh users get identical wedge sequence until energy runs out', async ({ request }) => {
    const auth = new AuthApi(request);
    const wheel = new WheelApi(request);
 
    // Two completely independent new users
    const sessionA = await auth.login(`candidate_test_${uuidv4()}`);
    const sessionB = await auth.login(`candidate_test_${uuidv4()}`);
 
    const sequenceA: number[] = [];
    const sequenceB: number[] = [];
 
    // Drain user A
    let energyA = sessionA.UserBalance.Energy;
    while (energyA > 0) {
      const body = await wheel.spin(sessionA.AccessToken);
      sequenceA.push(body.response.SelectedIndex);
      energyA = body.response.SpinResult.UserBalance.Energy;
    }
 
    // Drain user B
    let energyB = sessionB.UserBalance.Energy;
    while (energyB > 0) {
      const body = await wheel.spin(sessionB.AccessToken);
      sequenceB.push(body.response.SelectedIndex);
      energyB = body.response.SpinResult.UserBalance.Energy;
    }
 
    // Same number of spins (same starting energy)
    expect(sequenceA.length).toBe(sequenceB.length);
 
    // Same wedge at every position — wheel is scripted
    expect(sequenceA).toEqual(sequenceB);
 
    console.log(`Spins per user: ${sequenceA.length}`);
    console.log(`Wedge sequence: ${sequenceA.join(', ')}`);
});
});