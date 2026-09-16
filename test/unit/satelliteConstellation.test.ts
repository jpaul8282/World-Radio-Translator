import { test, describe } from "node:test";
import assert from "node:assert";
import {
  calculateGeoDistanceKm,
  findNearestSatellite,
  tickSatelliteOrbits,
  INITIAL_SATELLITE_CONSTELLATION
} from "../../src/lib/satelliteConstellation";

describe("New Functionality Testing: Neural Satellite Space-Mesh", () => {
  test("calculateGeoDistanceKm accurately computes geographical distances", () => {
    // Distance between identical coordinates is 0
    const zeroDist = calculateGeoDistanceKm(48.8566, 2.3522, 48.8566, 2.3522);
    assert.strictEqual(zeroDist, 0);

    // Distance between Paris (48.8566, 2.3522) and London (51.5074, -0.1278) ~343 km
    const parisLondon = calculateGeoDistanceKm(48.8566, 2.3522, 51.5074, -0.1278);
    assert.strictEqual(parisLondon > 300 && parisLondon < 400, true);

    // Distance between New York (40.7128, -74.0060) and Tokyo (35.6762, 139.6503) ~10,800 km
    const nyTokyo = calculateGeoDistanceKm(40.7128, -74.0060, 35.6762, 139.6503);
    assert.strictEqual(nyTokyo > 10000 && nyTokyo < 12000, true);
  });

  test("findNearestSatellite resolves nearest orbital node", () => {
    // Station in Washington D.C. (38.9, -77.0) should pair with Americas satellite
    const result = findNearestSatellite(38.9, -77.0, INITIAL_SATELLITE_CONSTELLATION);
    assert.ok(result.satellite);
    assert.strictEqual(result.satellite.id, "sat-neuro-01");
    assert.strictEqual(result.beamQualityScore >= 80, true);
    assert.strictEqual(result.calculatedLatencyMs > 0, true);
  });

  test("findNearestSatellite respects forced override satellite ID", () => {
    const result = findNearestSatellite(38.9, -77.0, INITIAL_SATELLITE_CONSTELLATION, "sat-neuro-03");
    assert.strictEqual(result.satellite.id, "sat-neuro-03");
  });

  test("tickSatelliteOrbits updates positions without longitude overflow", () => {
    const updated = tickSatelliteOrbits(INITIAL_SATELLITE_CONSTELLATION);
    assert.strictEqual(updated.length, INITIAL_SATELLITE_CONSTELLATION.length);

    for (const sat of updated) {
      assert.strictEqual(sat.lng >= -180 && sat.lng <= 180, true);
      assert.strictEqual(sat.lat >= -90 && sat.lat <= 90, true);
      assert.strictEqual(sat.activeRelays >= 0, true);
    }
  });
});
