import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';
import { AuthApi } from '../api/Auth';
import { WheelApi } from '../api/Wheel';

// Mirrors the API config exactly
const MULTIPLIER_THRESHOLDS = [
  { threshold: 0,     available: [1, 2, 3] },
  { threshold: 49,    available: [5] },
  { threshold: 99,    available: [10] },
  { threshold: 199,   available: [20] },
  { threshold: 399,   available: [40] },
  { threshold: 499,   available: [50] },
  { threshold: 999,   available: [100] },
  { threshold: 2499,  available: [250] },
  { threshold: 4999,  available: [500] },
  { threshold: 9999,  available: [1000] },
  { threshold: 19999, available: [2000] },
  { threshold: 49999, available: [5000] },
];

// Given an energy amount, return which multipliers should be allowed
function getAllowedMultipliers(energy: number): number[] {
  return MULTIPLIER_THRESHOLDS
    .filter(tier => energy > tier.threshold)
    .flatMap(tier => tier.available);
}

test.describe('Wheel Multipliers', () => {

  test('new user (10 energy) can spin with multiplier 1', async ({ request }) => {
    const auth = new AuthApi(request);
    const wheel = new WheelApi(request);

    const session = await auth.login(`candidate_test_${uuidv4()}`);
    expect(session.UserBalance.Energy).toBe(10); // confirm starting energy

    const body = await wheel.spin(session.AccessToken, 1);
    expect(body.status).toBe(0); // allowed
  });

  test('new user (10 energy) cannot spin with multiplier 5 (needs 49+)', async ({ request }) => {
    const auth = new AuthApi(request);
    const wheel = new WheelApi(request);

    const session = await auth.login(`candidate_test_${uuidv4()}`);
    expect(session.UserBalance.Energy).toBe(10);

    const body = await wheel.spin(session.AccessToken, 5);
    expect(body.status).not.toBe(0); // must be rejected
  });

  test('new user (10 energy) cannot spin with multiplier 10 (needs 99+)', async ({ request }) => {
    const auth = new AuthApi(request);
    const wheel = new WheelApi(request);

    const session = await auth.login(`candidate_test_${uuidv4()}`);

    const body = await wheel.spin(session.AccessToken, 10);
    expect(body.status).not.toBe(0); // must be rejected
  });

  test('multiplier config returned on login matches expected thresholds', async ({ request }) => {
    const auth = new AuthApi(request);
    const session = await auth.login(`candidate_test_${uuidv4()}`);

    const multiplierConfig = session.WheelMultipliers.config.Multipliers;

    // Config must exist and have all tiers
    expect(multiplierConfig.length).toBe(MULTIPLIER_THRESHOLDS.length);

    // Each tier matches what we expect
    for (let i = 0; i < MULTIPLIER_THRESHOLDS.length; i++) {
      expect(multiplierConfig[i].EnergyThreshold).toBe(MULTIPLIER_THRESHOLDS[i].threshold);
      expect(multiplierConfig[i].AvailableMultipliers).toEqual(MULTIPLIER_THRESHOLDS[i].available);
    }
  });

  test('allowed multipliers are correct for a user with 10 energy', async ({ request }) => {
    const auth = new AuthApi(request);
    const session = await auth.login(`candidate_test_${uuidv4()}`);

    const energy = session.UserBalance.Energy; // 10
    const allowed = getAllowedMultipliers(energy);

    // With 10 energy, only threshold 0 (>0) applies → [1, 2, 3]
    expect(allowed).toEqual([1, 2, 3]);
  });

});