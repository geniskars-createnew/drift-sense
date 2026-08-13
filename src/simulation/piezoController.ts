// Software closed-loop Piezo Actuator PID Simulation Engine (Simulated - No Physical Hardware)

export interface PiezoState {
  position: { x: number; y: number };
  target: { x: number; y: number };
  iteration: number;
  status: 'idle' | 'drift_detected' | 'correcting' | 'stabilizing' | 'recovered';
  consecutiveInTolerance: number;
  integralError: { x: number; y: number };
  prevError: { x: number; y: number };
  history: {
    iteration: number;
    error: number;
    voltageX: number;
    voltageY: number;
    posX: number;
    posY: number;
  }[];
  pidGains: { Kp: number; Ki: number; Kd: number };
  coefficients: { Kx: number; Ky: number };
}

// Box-Muller transform for small Gaussian sensor noise
function gaussianRandom(mean = 0, stdev = 0.1): number {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

export function createPiezoSimulation(
  start: { x: number; y: number },
  target: { x: number; y: number },
  pidGains = { Kp: 0.6, Ki: 0.05, Kd: 0.1 },
  coefficients = { Kx: 0.5, Ky: 0.5 }
): PiezoState {
  const initErrorX = target.x - start.x;
  const initErrorY = target.y - start.y;
  const initErrorEuclidean = Math.sqrt(initErrorX * initErrorX + initErrorY * initErrorY);

  return {
    position: { x: start.x, y: start.y },
    target: { x: target.x, y: target.y },
    iteration: 0,
    status: initErrorEuclidean > 2 ? 'drift_detected' : 'idle',
    consecutiveInTolerance: 0,
    integralError: { x: 0, y: 0 },
    prevError: { x: initErrorX, y: initErrorY },
    history: [
      {
        iteration: 0,
        error: Math.round(initErrorEuclidean * 100) / 100,
        voltageX: 0,
        voltageY: 0,
        posX: Math.round(start.x * 100) / 100,
        posY: Math.round(start.y * 100) / 100,
      },
    ],
    pidGains,
    coefficients,
  };
}

export function stepSimulation(state: PiezoState, tolerancePx: number = 2.0): PiezoState {
  // If already recovered or max iterations reached (50 max limit), return state
  if (state.iteration >= 50 || state.status === 'recovered') {
    return { ...state, status: 'recovered' };
  }

  const nextIteration = state.iteration + 1;

  // 1. Compute current position error = target - position
  const errorX = state.target.x - state.position.x;
  const errorY = state.target.y - state.position.y;
  const errorEuclidean = Math.sqrt(errorX * errorX + errorY * errorY);

  // 2. PID Calculations
  const { Kp, Ki, Kd } = state.pidGains;
  const { Kx, Ky } = state.coefficients;

  // Integral error accumulation
  const newIntegralX = state.integralError.x + errorX;
  const newIntegralY = state.integralError.y + errorY;

  // Derivative error calculation
  const derivativeX = errorX - state.prevError.x;
  const derivativeY = errorY - state.prevError.y;

  // PID output voltages u(t) = Kp*e + Ki*sum(e) + Kd*d(e)
  const voltageX = Kp * errorX + Ki * newIntegralX + Kd * derivativeX;
  const voltageY = Kp * errorY + Ki * newIntegralY + Kd * derivativeY;

  // Actuator displacement calculation dx = Kx * Vx, dy = Ky * Vy
  const idealDx = Kx * voltageX;
  const idealDy = Ky * voltageY;

  // Settling delay factor (~30% response step per iteration simulating piezo mechanical settling time)
  const settlingFactor = 0.35;

  // Sensor noise
  const noiseX = gaussianRandom(0, 0.08);
  const noiseY = gaussianRandom(0, 0.08);

  // Update position
  const newPosX = state.position.x + idealDx * settlingFactor + noiseX;
  const newPosY = state.position.y + idealDy * settlingFactor + noiseY;

  // Re-calculate remaining error after position step
  const postErrorX = state.target.x - newPosX;
  const postErrorY = state.target.y - newPosY;
  const postErrorEuclidean = Math.sqrt(postErrorX * postErrorX + postErrorY * postErrorY);

  // Check tolerance & status transitions
  let consecutive = state.consecutiveInTolerance;
  let newStatus: PiezoState['status'] = state.status;

  if (postErrorEuclidean < tolerancePx) {
    consecutive += 1;
    if (consecutive >= 2) {
      newStatus = 'recovered';
    } else {
      newStatus = 'stabilizing';
    }
  } else {
    consecutive = 0;
    newStatus = postErrorEuclidean < 5 ? 'stabilizing' : 'correcting';
  }

  const newHistoryItem = {
    iteration: nextIteration,
    error: Math.round(postErrorEuclidean * 100) / 100,
    voltageX: Math.round(voltageX * 100) / 100,
    voltageY: Math.round(voltageY * 100) / 100,
    posX: Math.round(newPosX * 100) / 100,
    posY: Math.round(newPosY * 100) / 100,
  };

  return {
    ...state,
    position: { x: newPosX, y: newPosY },
    iteration: nextIteration,
    status: newStatus,
    consecutiveInTolerance: consecutive,
    integralError: { x: newIntegralX, y: newIntegralY },
    prevError: { x: errorX, y: errorY },
    history: [...state.history, newHistoryItem],
  };
}

export function injectDisturbance(state: PiezoState, dx: number, dy: number): PiezoState {
  const newPosX = state.position.x + dx;
  const newPosY = state.position.y + dy;

  const errorX = state.target.x - newPosX;
  const errorY = state.target.y - newPosY;
  const errorEuclidean = Math.sqrt(errorX * errorX + errorY * errorY);

  const disturbanceItem = {
    iteration: state.iteration + 1,
    error: Math.round(errorEuclidean * 100) / 100,
    voltageX: 0,
    voltageY: 0,
    posX: Math.round(newPosX * 100) / 100,
    posY: Math.round(newPosY * 100) / 100,
  };

  return {
    ...state,
    position: { x: newPosX, y: newPosY },
    iteration: state.iteration + 1,
    status: 'drift_detected',
    consecutiveInTolerance: 0,
    history: [...state.history, disturbanceItem],
  };
}
