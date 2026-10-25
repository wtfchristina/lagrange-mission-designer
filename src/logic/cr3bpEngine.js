export const CELESTIAL_SYSTEMS = {
  EARTH_MOON: {
    name: 'Earth – Moon System',
    mu: 0.0121505856,
    primaryName: 'Earth',
    secondaryName: 'Moon',
    lengthScaleKm: 384400,
    timeScaleDays: 4.3425
  },
  SUN_EARTH: {
    name: 'Sun – Earth System',
    mu: 3.0034806e-6,
    primaryName: 'Sun',
    secondaryName: 'Earth',
    lengthScaleKm: 149597870,
    timeScaleDays: 58.13
  },
  JUPITER_EUROPA: {
    name: 'Jupiter – Europa System',
    mu: 2.528e-5,
    primaryName: 'Jupiter',
    secondaryName: 'Europa',
    lengthScaleKm: 670900,
    timeScaleDays: 0.565
  }
};

export function calculatePotential(x, y, z, mu) {
  const r1 = Math.sqrt(Math.pow(x + mu, 2) + y * y + z * z) + 1e-8;
  const r2 = Math.sqrt(Math.pow(x - 1 + mu, 2) + y * y + z * z) + 1e-8;
  return 0.5 * (x * x + y * y) + (1.0 - mu) / r1 + mu / r2;
}

export function calculateLagrangePoints(mu) {
  const dOmegaDx = (x) => {
    const r1 = Math.abs(x + mu);
    const r2 = Math.abs(x - 1 + mu);
    return x - ((1 - mu) * (x + mu)) / Math.pow(r1, 3) - (mu * (x - 1 + mu)) / Math.pow(r2, 3);
  };

  const solve1D = (x0) => {
    let x = x0;
    for (let i = 0; i < 40; i++) {
      const dx = 1e-5;
      const f = dOmegaDx(x);
      const df = (dOmegaDx(x + dx) - dOmegaDx(x - dx)) / (2 * dx);
      const step = f / df;
      x -= step;
      if (Math.abs(step) < 1e-9) break;
    }
    return x;
  };

  const l1_x = solve1D(1 - Math.cbrt(mu / 3));
  const l2_x = solve1D(1 + Math.cbrt(mu / 3));
  const l3_x = solve1D(-1 - (5 / 12) * mu);

  return {
    L1: { x: l1_x, y: 0, z: 0, name: 'L1' },
    L2: { x: l2_x, y: 0, z: 0, name: 'L2' },
    L3: { x: l3_x, y: 0, z: 0, name: 'L3' },
    L4: { x: 0.5 - mu, y: Math.sqrt(3) / 2, z: 0, name: 'L4' },
    L5: { x: 0.5 - mu, y: -Math.sqrt(3) / 2, z: 0, name: 'L5' }
  };
}

export function calculateJacobiConstant(state, mu) {
  const [x, y, z, vx, vy, vz] = state;
  const vSq = vx * vx + vy * vy + vz * vz;
  return 2.0 * calculatePotential(x, y, z, mu) - vSq;
}

// Reconstruct valid 6D state vector from (x0, vx0) on section y=0, z=0 given C_J
export function reconstructStateFromPoincare(x0, vx0, targetCj, mu) {
  const twoOmega = 2.0 * calculatePotential(x0, 0, 0, mu);
  const vySq = twoOmega - targetCj - (vx0 * vx0);

  if (vySq < 0) {
    return null; // Forbidden Hill's region
  }

  const vy0 = Math.sqrt(vySq);
  return [x0, 0.0, 0.0, vx0, vy0, 0.0];
}

export function computeHessian(x, y, z, mu) {
  const r1_sq = Math.pow(x + mu, 2) + y * y + z * z + 1e-8;
  const r2_sq = Math.pow(x - 1 + mu, 2) + y * y + z * z + 1e-8;
  const r1_3 = Math.pow(r1_sq, 1.5);
  const r2_3 = Math.pow(r2_sq, 1.5);
  const r1_5 = Math.pow(r1_sq, 2.5);
  const r2_5 = Math.pow(r2_sq, 2.5);

  const Uxx = 1 - (1 - mu) / r1_3 - mu / r2_3 + 3 * (1 - mu) * Math.pow(x + mu, 2) / r1_5 + 3 * mu * Math.pow(x - 1 + mu, 2) / r2_5;
  const Uyy = 1 - (1 - mu) / r1_3 - mu / r2_3 + 3 * (1 - mu) * y * y / r1_5 + 3 * mu * y * y / r2_5;
  const Uzz = - (1 - mu) / r1_3 - mu / r2_3 + 3 * (1 - mu) * z * z / r1_5 + 3 * mu * z * z / r2_5;
  const Uxy = 3 * (1 - mu) * (x + mu) * y / r1_5 + 3 * mu * (x - 1 + mu) * y / r2_5;
  const Uxz = 3 * (1 - mu) * (x + mu) * z / r1_5 + 3 * mu * (x - 1 + mu) * z / r2_5;
  const Uyz = 3 * (1 - mu) * y * z / r1_5 + 3 * mu * y * z / r2_5;

  return { Uxx, Uyy, Uzz, Uxy, Uxz, Uyz };
}

export function variationalDerivatives(state42, mu) {
  const [x, y, z, vx, vy, vz] = state42.slice(0, 6);
  const r1_sq = Math.pow(x + mu, 2) + y * y + z * z + 1e-8;
  const r2_sq = Math.pow(x - 1 + mu, 2) + y * y + z * z + 1e-8;
  const r1_3 = Math.pow(r1_sq, 1.5);
  const r2_3 = Math.pow(r2_sq, 1.5);

  const ax = 2.0 * vy + x - ((1.0 - mu) * (x + mu)) / r1_3 - (mu * (x - 1.0 + mu)) / r2_3;
  const ay = -2.0 * vx + y - ((1.0 - mu) * y) / r1_3 - (mu * y) / r2_3;
  const az = -((1.0 - mu) * z) / r1_3 - (mu * z) / r2_3;

  const dState = new Array(42).fill(0);
  dState[0] = vx; dState[1] = vy; dState[2] = vz;
  dState[3] = ax; dState[4] = ay; dState[5] = az;

  const { Uxx, Uyy, Uzz, Uxy, Uxz, Uyz } = computeHessian(x, y, z, mu);
  const A = [
    [0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 1],
    [Uxx, Uxy, Uxz, 0, 2, 0],
    [Uxy, Uyy, Uyz, -2, 0, 0],
    [Uxz, Uyz, Uzz, 0, 0, 0]
  ];

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      let sum = 0;
      for (let k = 0; k < 6; k++) {
        sum += A[row][k] * state42[6 + k * 6 + col];
      }
      dState[6 + row * 6 + col] = sum;
    }
  }

  return dState;
}

export function rk4Step42(state42, mu, dt) {
  const k1 = variationalDerivatives(state42, mu);
  const s2 = state42.map((v, i) => v + 0.5 * dt * k1[i]);
  const k2 = variationalDerivatives(s2, mu);
  const s3 = state42.map((v, i) => v + 0.5 * dt * k2[i]);
  const k3 = variationalDerivatives(s3, mu);
  const s4 = state42.map((v, i) => v + dt * k3[i]);
  const k4 = variationalDerivatives(s4, mu);

  return state42.map((v, i) => v + (dt / 6.0) * (k1[i] + 2.0 * k2[i] + 2.0 * k3[i] + k4[i]));
}

export function rk4Step(state, mu, dt) {
  const accel = (st) => {
    const [px, py, pz, pvx, pvy] = st;
    const r1_sq = Math.pow(px + mu, 2) + py * py + pz * pz + 1e-8;
    const r2_sq = Math.pow(px - 1 + mu, 2) + py * py + pz * pz + 1e-8;
    const ax = 2.0 * pvy + px - ((1.0 - mu) * (px + mu)) / Math.pow(r1_sq, 1.5) - (mu * (px - 1.0 + mu)) / Math.pow(r2_sq, 1.5);
    const ay = -2.0 * pvx + py - ((1.0 - mu) * py) / Math.pow(r1_sq, 1.5) - (mu * py) / Math.pow(r2_sq, 1.5);
    const az = -((1.0 - mu) * pz) / Math.pow(r1_sq, 1.5) - (mu * pz) / Math.pow(r2_sq, 1.5);
    return [pvx, pvy, st[5], ax, ay, az];
  };

  const k1 = accel(state);
  const s2 = state.map((v, i) => v + 0.5 * dt * k1[i]);
  const k2 = accel(s2);
  const s3 = state.map((v, i) => v + 0.5 * dt * k2[i]);
  const k3 = accel(s3);
  const s4 = state.map((v, i) => v + dt * k3[i]);
  const k4 = accel(s4);

  return state.map((v, i) => v + (dt / 6.0) * (k1[i] + 2.0 * k2[i] + 2.0 * k3[i] + k4[i]));
}

export function solvePeriodicOrbit(mu, lPoint, amplitudeAx = 0.04, isL2 = false) {
  let x0 = isL2 ? lPoint.x + amplitudeAx : lPoint.x - amplitudeAx;
  let vy0 = isL2 ? -0.18 : 0.165;
  const dt = 0.001;
  const maxIters = 12;

  let residual = 1.0;
  let finalOrbit = [];
  let halfPeriod = 0;

  for (let iter = 0; iter < maxIters; iter++) {
    let s42 = new Array(42).fill(0);
    s42[0] = x0; s42[1] = 0; s42[2] = 0;
    s42[3] = 0; s42[4] = vy0; s42[5] = 0;
    for (let i = 0; i < 6; i++) s42[6 + i * 6 + i] = 1.0;

    let prevY = 0;
    let t = 0;
    let trajectory = [];

    for (let step = 0; step < 6000; step++) {
      prevY = s42[1];
      s42 = rk4Step42(s42, mu, dt);
      t += dt;
      trajectory.push([s42[0], s42[1], s42[2]]);

      if (t > 0.25 && prevY * s42[1] <= 0) {
        halfPeriod = t;
        break;
      }
    }

    const vx_final = s42[3];
    residual = Math.abs(vx_final);
    if (residual < 1e-6) {
      finalOrbit = trajectory;
      break;
    }

    const phi45 = s42[6 + 3 * 6 + 4];
    const phi25 = s42[6 + 1 * 6 + 4];
    const dState = variationalDerivatives(s42, mu);
    const ax = dState[3];
    const vy = s42[4];

    const dVx_dVy0 = phi45 - (ax / vy) * phi25;
    const deltaVy = -vx_final / dVx_dVy0;
    vy0 += deltaVy;
    finalOrbit = trajectory;
  }

  return {
    initialState: [x0, 0, 0, 0, vy0, 0],
    period: halfPeriod * 2,
    residual,
    orbit: finalOrbit
  };
}

export function computeRigorousManifolds(mu, periodicInitial, period, filamentCount = 14) {
  let s42 = new Array(42).fill(0);
  for (let i = 0; i < 6; i++) s42[i] = periodicInitial[i];
  for (let i = 0; i < 6; i++) s42[6 + i * 6 + i] = 1.0;

  const dt = 0.001;
  const steps = Math.floor(period / dt);
  const orbitRing = [];

  for (let s = 0; s < steps; s++) {
    s42 = rk4Step42(s42, mu, dt);
    orbitRing.push([s42[0], s42[1], s42[2], s42[3], s42[4], s42[5]]);
  }

  const M = [];
  for (let r = 0; r < 6; r++) {
    const row = [];
    for (let c = 0; c < 6; c++) row.push(s42[6 + r * 6 + c]);
    M.push(row);
  }

  let v_u = [1, 0, 0, 0, 1, 0];
  for (let iter = 0; iter < 25; iter++) {
    const nextV = new Array(6).fill(0);
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) nextV[r] += M[r][c] * v_u[c];
    }
    const norm = Math.hypot(...nextV);
    v_u = nextV.map(v => v / (norm || 1));
  }

  const generateTube = (isStable) => {
    const filaments = [];
    const stepCount = 550;
    const simDt = isStable ? -0.004 : 0.004;
    const eps = 1e-4;

    for (let f = 0; f < filamentCount; f++) {
      const ringIdx = Math.floor((f / filamentCount) * orbitRing.length);
      const base = orbitRing[ringIdx];
      let st = base.map((val, i) => val + (isStable ? -1 : 1) * eps * v_u[i]);
      const path = [];

      for (let step = 0; step < stepCount; step++) {
        path.push([st[0], st[1], st[2]]);
        st = rk4Step(st, mu, simDt);
        if (Math.hypot(st[0] + mu, st[1]) < 0.02 || Math.hypot(st[0] - 1 + mu, st[1]) < 0.01) break;
      }
      filaments.push(path);
    }
    return filaments;
  };

  return {
    unstableTube: generateTube(false),
    stableTube: generateTube(true)
  };
}

// Convert trajectory state record to CSV
export function exportEphemerisCSV(trajectoryHistory, system) {
  let csv = `CR3BP Ephemeris Export - ${system.name}\n`;
  csv += `Mass Parameter (mu): ${system.mu}\n`;
  csv += `Characteristic Length (km): ${system.lengthScaleKm}\n`;
  csv += `Characteristic Time (days): ${system.timeScaleDays}\n\n`;
  csv += `step,x_nd,y_nd,z_nd,vx_nd,vy_nd,vz_nd,jacobi_Cj,x_km,y_km,z_km\n`;

  trajectoryHistory.forEach((row, i) => {
    const [x, y, z, vx, vy, vz, cj] = row;
    const xKm = (x * system.lengthScaleKm).toFixed(2);
    const yKm = (y * system.lengthScaleKm).toFixed(2);
    const zKm = (z * system.lengthScaleKm).toFixed(2);
    csv += `${i},${x.toFixed(7)},${y.toFixed(7)},${z.toFixed(7)},${vx.toFixed(7)},${vy.toFixed(7)},${vz.toFixed(7)},${cj.toFixed(6)},${xKm},${yKm},${zKm}\n`;
  });

  return csv;
}
