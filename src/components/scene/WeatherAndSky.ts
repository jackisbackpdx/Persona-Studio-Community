import * as THREE from 'three';
import { WeatherType, SeasonType } from '../../types';
import { soundEngine } from '../../audio/soundEngine';

export interface WeatherAndSkyManager {
  rootGroup: THREE.Group;
  sunDirectionalLight: THREE.DirectionalLight;
  moonDirectionalLight: THREE.DirectionalLight;
  ambientLight: THREE.AmbientLight;
  skyDome: THREE.Mesh;
  setWeather: (weather: WeatherType, userOverride?: boolean) => void;
  getWeather: () => WeatherType;
  setTimeOfDay: (hours: number, immediate?: boolean) => void;
  getTimeOfDay: () => number;
  setSeason: (season: SeasonType) => void;
  getSeason: () => SeasonType;
  update: (
    delta: number,
    elapsed: number
  ) => { isNight: boolean; nightFactor: number; weather: WeatherType; season: SeasonType };
  dispose: () => void;
}

interface SkyKeyframe {
  hour: number;
  skyColor: string;
  sunColor: string;
  ambientColor: string;
  sunIntensity: number;
  ambientIntensity: number;
  moonIntensity: number;
  fogDensity: number;
  nightFactor: number;
}

// Astronomical 24-Hour Continuous Lighting Table
const SKY_KEYFRAMES: SkyKeyframe[] = [
  {
    hour: 0.0,
    skyColor: '#050711',
    sunColor: '#38bdf8',
    ambientColor: '#0f172a',
    sunIntensity: 0.02,
    ambientIntensity: 0.22,
    moonIntensity: 0.52,
    fogDensity: 0.012,
    nightFactor: 1.0,
  },
  {
    hour: 4.8,
    skyColor: '#0b1329',
    sunColor: '#60a5fa',
    ambientColor: '#1e293b',
    sunIntensity: 0.08,
    ambientIntensity: 0.26,
    moonIntensity: 0.38,
    fogDensity: 0.014,
    nightFactor: 0.95,
  },
  {
    hour: 5.8,
    skyColor: '#7c2d12',
    sunColor: '#f97316',
    ambientColor: '#fed7aa',
    sunIntensity: 0.65,
    ambientIntensity: 0.55,
    moonIntensity: 0.12,
    fogDensity: 0.016,
    nightFactor: 0.65,
  },
  {
    hour: 6.8,
    skyColor: '#ea580c',
    sunColor: '#fbbf24',
    ambientColor: '#ffedd5',
    sunIntensity: 1.25,
    ambientIntensity: 0.85,
    moonIntensity: 0.0,
    fogDensity: 0.015,
    nightFactor: 0.15,
  },
  {
    hour: 8.5,
    skyColor: '#38bdf8',
    sunColor: '#fffbeb',
    ambientColor: '#f1f5f9',
    sunIntensity: 1.55,
    ambientIntensity: 1.05,
    moonIntensity: 0.0,
    fogDensity: 0.011,
    nightFactor: 0.0,
  },
  {
    hour: 12.5,
    skyColor: '#0284c7',
    sunColor: '#ffffff',
    ambientColor: '#f8fafc',
    sunIntensity: 1.65,
    ambientIntensity: 1.12,
    moonIntensity: 0.0,
    fogDensity: 0.009,
    nightFactor: 0.0,
  },
  {
    hour: 16.5,
    skyColor: '#38bdf8',
    sunColor: '#fef08a',
    ambientColor: '#fef3c7',
    sunIntensity: 1.5,
    ambientIntensity: 1.0,
    moonIntensity: 0.0,
    fogDensity: 0.011,
    nightFactor: 0.0,
  },
  {
    hour: 18.5,
    skyColor: '#f97316',
    sunColor: '#ea580c',
    ambientColor: '#ffedd5',
    sunIntensity: 1.45,
    ambientIntensity: 0.9,
    moonIntensity: 0.0,
    fogDensity: 0.015,
    nightFactor: 0.22,
  },
  {
    hour: 19.8,
    skyColor: '#312e81',
    sunColor: '#818cf8',
    ambientColor: '#1e1b4b',
    sunIntensity: 0.35,
    ambientIntensity: 0.45,
    moonIntensity: 0.2,
    fogDensity: 0.016,
    nightFactor: 0.75,
  },
  {
    hour: 21.2,
    skyColor: '#0f172a',
    sunColor: '#38bdf8',
    ambientColor: '#1e293b',
    sunIntensity: 0.06,
    ambientIntensity: 0.28,
    moonIntensity: 0.48,
    fogDensity: 0.013,
    nightFactor: 0.96,
  },
  {
    hour: 24.0,
    skyColor: '#050711',
    sunColor: '#38bdf8',
    ambientColor: '#0f172a',
    sunIntensity: 0.02,
    ambientIntensity: 0.22,
    moonIntensity: 0.52,
    fogDensity: 0.012,
    nightFactor: 1.0,
  },
];

// Helper: Cubic Hermite Smoothstep
function smoothInterpolation(t: number): number {
  return t * t * (3 - 2 * t);
}

// Seasonal Realistic Weather Probabilities (Pacific Northwest / Portland climate)
// Ensures everyday is NOT a thunderstorm or wildfire!
const SEASON_WEATHER_PROFILES: Record<SeasonType, Array<{ weather: WeatherType; weight: number }>> =
  {
    spring: [
      { weather: 'partially_cloudy', weight: 40 },
      { weather: 'light_rain', weight: 35 },
      { weather: 'cloudy', weight: 15 },
      { weather: 'heavy_rain', weight: 8 },
      { weather: 'thunderstorm', weight: 2 }, // Rare spring thunder cell
    ],
    summer: [
      { weather: 'partially_cloudy', weight: 48 },
      { weather: 'cloudy', weight: 35 },
      { weather: 'light_rain', weight: 14 },
      { weather: 'smoke', weight: 3 }, // Occasional dry late August forest haze
    ],
    fall: [
      { weather: 'cloudy', weight: 42 },
      { weather: 'light_rain', weight: 34 },
      { weather: 'partially_cloudy', weight: 16 },
      { weather: 'heavy_rain', weight: 8 },
    ],
    winter: [
      { weather: 'cloudy', weight: 45 },
      { weather: 'light_rain', weight: 30 },
      { weather: 'snow', weight: 18 }, // Winter snow flurries
      { weather: 'heavy_rain', weight: 7 },
    ],
  };

export function createWeatherAndSky(scene: THREE.Scene): WeatherAndSkyManager {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'weather-and-sky';
  scene.add(rootGroup);

  let currentWeather: WeatherType = 'partially_cloudy';
  let currentSeason: SeasonType = 'summer';
  let targetTimeHours: number = 17.5; // Target time set by user or clock
  let smoothTimeHours: number = 17.5; // Smoothed time value for fluid animation
  let weatherLockTimer: number = 0; // Cooldown after user manual selection
  let seasonalCycleTimer: number = 120; // Natural weather change cycle (every 120-180 seconds)

  // 1. Lights
  const ambientLight = new THREE.AmbientLight('#eedfcc', 0.9);
  scene.add(ambientLight);

  const sunDirectionalLight = new THREE.DirectionalLight('#fff2d4', 1.5);
  sunDirectionalLight.position.set(15, 30, 20);
  sunDirectionalLight.castShadow = true;
  sunDirectionalLight.shadow.mapSize.width = 2048;
  sunDirectionalLight.shadow.mapSize.height = 2048;
  sunDirectionalLight.shadow.camera.near = 0.5;
  sunDirectionalLight.shadow.camera.far = 120;
  sunDirectionalLight.shadow.camera.left = -40;
  sunDirectionalLight.shadow.camera.right = 40;
  sunDirectionalLight.shadow.camera.top = 40;
  sunDirectionalLight.shadow.camera.bottom = -40;
  sunDirectionalLight.shadow.bias = -0.0004;
  scene.add(sunDirectionalLight);

  const moonDirectionalLight = new THREE.DirectionalLight('#7dd3fc', 0.0);
  moonDirectionalLight.position.set(-15, 25, -20);
  moonDirectionalLight.castShadow = false;
  scene.add(moonDirectionalLight);

  // 2. Sky Dome Sphere
  const skyGeo = new THREE.SphereGeometry(250, 32, 20);
  const skyMat = new THREE.MeshBasicMaterial({
    color: '#2d3748',
    side: THREE.BackSide,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  rootGroup.add(skyDome);

  // 3. Floating Procedural Clouds (Dynamic density according to weather)
  const cloudsGroup = new THREE.Group();
  rootGroup.add(cloudsGroup);
  const cloudCount = 18;
  const cloudMat = new THREE.MeshStandardMaterial({
    color: '#e2e8f0',
    roughness: 0.92,
    transparent: true,
    opacity: 0.85,
  });

  for (let c = 0; c < cloudCount; c++) {
    const cloud = new THREE.Group();
    const puffs = 5 + Math.floor(Math.random() * 4);
    for (let p = 0; p < puffs; p++) {
      const puff = new THREE.Mesh(
        new THREE.DodecahedronGeometry(2.6 + Math.random() * 2.2),
        cloudMat
      );
      puff.position.set(
        (p - puffs / 2) * 2.6 + (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.1,
        (Math.random() - 0.5) * 2.0
      );
      cloud.add(puff);
    }
    cloud.position.set(
      (Math.random() - 0.5) * 110,
      28 + Math.random() * 14,
      (Math.random() - 0.5) * 85
    );
    cloudsGroup.add(cloud);
  }

  // 4. Rain Particles
  const rainCount = 1900;
  const rainGeo = new THREE.BufferGeometry();
  const rainPositions = new Float32Array(rainCount * 3);
  for (let i = 0; i < rainCount; i++) {
    rainPositions[i * 3] = (Math.random() - 0.5) * 105;
    rainPositions[i * 3 + 1] = Math.random() * 42 - 2;
    rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 95;
  }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));

  const rainMat = new THREE.PointsMaterial({
    color: '#93c5fd',
    size: 0.28,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
  });
  const rainParticles = new THREE.Points(rainGeo, rainMat);
  rootGroup.add(rainParticles);

  // 5. Snow Particles
  const snowCount = 1000;
  const snowGeo = new THREE.BufferGeometry();
  const snowPositions = new Float32Array(snowCount * 3);
  for (let i = 0; i < snowCount; i++) {
    snowPositions[i * 3] = (Math.random() - 0.5) * 95;
    snowPositions[i * 3 + 1] = Math.random() * 40 - 2;
    snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 90;
  }
  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));

  const snowMat = new THREE.PointsMaterial({
    color: '#ffffff',
    size: 0.36,
    transparent: true,
    opacity: 0,
  });
  const snowParticles = new THREE.Points(snowGeo, snowMat);
  rootGroup.add(snowParticles);

  // 6. Smoke / Dry Atmospheric Haze Particles
  const smokeCount = 380;
  const smokeGeo = new THREE.BufferGeometry();
  const smokePositions = new Float32Array(smokeCount * 3);
  for (let i = 0; i < smokeCount; i++) {
    smokePositions[i * 3] = (Math.random() - 0.5) * 85;
    smokePositions[i * 3 + 1] = Math.random() * 24 - 1.5;
    smokePositions[i * 3 + 2] = (Math.random() - 0.5) * 80;
  }
  smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));

  const smokeMat = new THREE.PointsMaterial({
    color: '#fdba74',
    size: 1.5,
    transparent: true,
    opacity: 0,
    blending: THREE.NormalBlending,
  });
  const smokeParticles = new THREE.Points(smokeGeo, smokeMat);
  rootGroup.add(smokeParticles);

  // 7. Thunderstorm lightning flash state
  let nextLightningTime = 8.0;
  let isFlashing = false;
  let flashDuration = 0;
  let thunderstormTimer = 0; // Ensures thunderstorms are brief realistic events

  // Weather and Seasonal Controls
  const setWeather = (w: WeatherType, userOverride = true) => {
    currentWeather = w;
    if (userOverride) {
      weatherLockTimer = 180; // Lock manual choice for 3 minutes before auto-cycle
    }
    if (w === 'thunderstorm') {
      thunderstormTimer = 28.0; // Short realistic storm cell (28 seconds)
      nextLightningTime = 2.0 + Math.random() * 3.5;
    }
  };

  const getWeather = (): WeatherType => currentWeather;

  const setTimeOfDay = (hours: number, immediate = false) => {
    targetTimeHours = (hours + 24) % 24;
    if (immediate) {
      smoothTimeHours = targetTimeHours;
    }
  };

  const getTimeOfDay = (): number => smoothTimeHours;

  const setSeason = (s: SeasonType) => {
    currentSeason = s;
  };

  const getSeason = (): SeasonType => currentSeason;

  // Frame update
  const update = (
    delta: number,
    elapsed: number
  ): { isNight: boolean; nightFactor: number; weather: WeatherType; season: SeasonType } => {
    // 1. Fluid Continuous Time Interpolation (Eliminates jarring steps)
    let timeDiff = targetTimeHours - smoothTimeHours;
    // Handle 24-hour circular wrap-around shortest path
    if (timeDiff > 12) timeDiff -= 24;
    if (timeDiff < -12) timeDiff += 24;
    smoothTimeHours = (smoothTimeHours + timeDiff * Math.min(1.0, delta * 3.8) + 24) % 24;

    // 2. Realistic Seasonal Climate Auto-Progression
    if (weatherLockTimer > 0) {
      weatherLockTimer -= delta;
    } else {
      seasonalCycleTimer -= delta;
      if (seasonalCycleTimer <= 0) {
        seasonalCycleTimer = 140 + Math.random() * 60;
        // Pick realistic seasonal weather based on weighted probabilities
        const profile = SEASON_WEATHER_PROFILES[currentSeason];
        const totalWeight = profile.reduce((sum, p) => sum + p.weight, 0);
        let rand = Math.random() * totalWeight;
        for (const entry of profile) {
          if (rand < entry.weight) {
            setWeather(entry.weather, false);
            break;
          }
          rand -= entry.weight;
        }
      }
    }

    // Thunderstorm realistic duration governor (Subsides to gentle rain)
    if (currentWeather === 'thunderstorm') {
      thunderstormTimer -= delta;
      if (thunderstormTimer <= 0) {
        currentWeather = 'light_rain';
      }
    }

    // 3. Sun and Moon Celestial Orbit
    // 06:00 is sunrise (sun at horizon east), 12:00 is noon, 18:00 is sunset, 00:00 is midnight
    const solarFraction = smoothTimeHours / 24;
    const sunAngle = (solarFraction - 0.25) * 2 * Math.PI;

    const sunX = -Math.cos(sunAngle) * 58;
    const sunY = Math.sin(sunAngle) * 46;
    const sunZ = Math.sin(sunAngle * 0.5) * 26 + 10;

    sunDirectionalLight.position.set(sunX, Math.max(0.2, sunY), sunZ);
    moonDirectionalLight.position.set(-sunX, Math.max(0.2, -sunY), -sunZ);

    // 4. Continuous Keyframe Lighting Interpolation
    let k0 = SKY_KEYFRAMES[0];
    let k1 = SKY_KEYFRAMES[1];
    for (let i = 0; i < SKY_KEYFRAMES.length - 1; i++) {
      if (smoothTimeHours >= SKY_KEYFRAMES[i].hour && smoothTimeHours <= SKY_KEYFRAMES[i + 1].hour) {
        k0 = SKY_KEYFRAMES[i];
        k1 = SKY_KEYFRAMES[i + 1];
        break;
      }
    }

    const span = Math.max(0.001, k1.hour - k0.hour);
    const rawT = (smoothTimeHours - k0.hour) / span;
    const blendT = smoothInterpolation(Math.max(0, Math.min(1, rawT)));

    // Colors blended along 24-hour continuum
    const cSky0 = new THREE.Color(k0.skyColor);
    const cSky1 = new THREE.Color(k1.skyColor);
    const skyColor = cSky0.clone().lerp(cSky1, blendT);

    const cSun0 = new THREE.Color(k0.sunColor);
    const cSun1 = new THREE.Color(k1.sunColor);
    const sunColor = cSun0.clone().lerp(cSun1, blendT);

    const cAmb0 = new THREE.Color(k0.ambientColor);
    const cAmb1 = new THREE.Color(k1.ambientColor);
    const ambientColor = cAmb0.clone().lerp(cAmb1, blendT);

    let sunIntensity = THREE.MathUtils.lerp(k0.sunIntensity, k1.sunIntensity, blendT);
    let ambientIntensity = THREE.MathUtils.lerp(k0.ambientIntensity, k1.ambientIntensity, blendT);
    let moonIntensity = THREE.MathUtils.lerp(k0.moonIntensity, k1.moonIntensity, blendT);
    let fogDensity = THREE.MathUtils.lerp(k0.fogDensity, k1.fogDensity, blendT);
    const nightFactor = THREE.MathUtils.lerp(k0.nightFactor, k1.nightFactor, blendT);

    // 5. Seasonal Nuance Shift
    if (currentSeason === 'summer') {
      sunIntensity *= 1.08;
      skyColor.lerp(new THREE.Color('#38bdf8'), 0.1);
    } else if (currentSeason === 'fall') {
      ambientColor.lerp(new THREE.Color('#fed7aa'), 0.12);
      skyColor.lerp(new THREE.Color('#94a3b8'), 0.08);
    } else if (currentSeason === 'winter') {
      sunIntensity *= 0.88;
      ambientColor.lerp(new THREE.Color('#cbd5e1'), 0.18);
      fogDensity += 0.003;
    } else if (currentSeason === 'spring') {
      ambientColor.lerp(new THREE.Color('#f0fdf4'), 0.08);
    }

    // 6. Weather Atmospheric Modifications
    let cloudTargetOpacity = 0.45;

    if (currentWeather === 'cloudy') {
      skyColor.lerp(new THREE.Color('#64748b'), 0.65);
      sunIntensity *= 0.42;
      ambientIntensity *= 0.78;
      cloudTargetOpacity = 0.92;
      fogDensity += 0.004;
    } else if (currentWeather === 'partially_cloudy') {
      cloudTargetOpacity = 0.65;
    } else if (currentWeather === 'light_rain') {
      skyColor.lerp(new THREE.Color('#475569'), 0.6);
      sunIntensity *= 0.52;
      ambientIntensity *= 0.75;
      cloudTargetOpacity = 0.88;
      fogDensity += 0.006;
    } else if (currentWeather === 'heavy_rain') {
      skyColor.lerp(new THREE.Color('#334155'), 0.82);
      sunIntensity *= 0.28;
      ambientIntensity *= 0.58;
      cloudTargetOpacity = 0.98;
      fogDensity += 0.012;
    } else if (currentWeather === 'thunderstorm') {
      skyColor.lerp(new THREE.Color('#1e293b'), 0.9);
      sunIntensity *= 0.15;
      ambientIntensity *= 0.38;
      cloudTargetOpacity = 1.0;
      fogDensity += 0.016;

      // Realistic Thunderstorm Lightning Flash
      if (elapsed > nextLightningTime && !isFlashing) {
        isFlashing = true;
        flashDuration = 0.14;
        soundEngine.init();
        soundEngine.playThunderRumble(0.65);
        nextLightningTime = elapsed + 5.0 + Math.random() * 7.0;
      }

      if (isFlashing) {
        flashDuration -= delta;
        skyColor.set('#f8fafc');
        sunColor.set('#e0f2fe');
        sunIntensity = 4.8;
        ambientIntensity = 3.6;
        if (flashDuration <= 0) {
          isFlashing = false;
        }
      }
    } else if (currentWeather === 'snow') {
      skyColor.lerp(new THREE.Color('#94a3b8'), 0.7);
      ambientColor.lerp(new THREE.Color('#f1f5f9'), 0.6);
      sunIntensity *= 0.55;
      cloudTargetOpacity = 0.85;
      fogDensity += 0.008;
    } else if (currentWeather === 'smoke') {
      skyColor.lerp(new THREE.Color('#78350f'), 0.75);
      sunColor.lerp(new THREE.Color('#b45309'), 0.6);
      ambientColor.lerp(new THREE.Color('#451a03'), 0.6);
      sunIntensity *= 0.38;
      cloudTargetOpacity = 0.15;
      fogDensity += 0.024;
    }

    // Apply materials & lights
    skyMat.color.copy(skyColor);
    scene.background = skyColor;
    if (scene.fog) {
      scene.fog.color.copy(skyColor);
      (scene.fog as THREE.FogExp2).density = THREE.MathUtils.lerp(
        (scene.fog as THREE.FogExp2).density,
        fogDensity,
        0.05
      );
    }

    sunDirectionalLight.color.copy(sunColor);
    sunDirectionalLight.intensity = THREE.MathUtils.lerp(
      sunDirectionalLight.intensity,
      sunIntensity,
      0.08
    );

    moonDirectionalLight.intensity = THREE.MathUtils.lerp(
      moonDirectionalLight.intensity,
      moonIntensity,
      0.08
    );

    ambientLight.color.copy(ambientColor);
    ambientLight.intensity = THREE.MathUtils.lerp(ambientLight.intensity, ambientIntensity, 0.08);

    // Smooth Cloud Opacity and Drift
    cloudMat.opacity = THREE.MathUtils.lerp(cloudMat.opacity, cloudTargetOpacity, 0.05);
    cloudsGroup.children.forEach((cloud, i) => {
      cloud.position.x += delta * (0.75 + (i % 3) * 0.35);
      if (cloud.position.x > 62) {
        cloud.position.x = -62;
      }
    });

    // 7. Update Rain Particles
    const isRaining = ['light_rain', 'heavy_rain', 'thunderstorm'].includes(currentWeather);
    if (isRaining) {
      const rainTargetOpacity =
        currentWeather === 'light_rain' ? 0.38 : currentWeather === 'heavy_rain' ? 0.75 : 0.92;
      rainMat.opacity = THREE.MathUtils.lerp(rainMat.opacity, rainTargetOpacity, 0.08);
      const rainSpeed = currentWeather === 'light_rain' ? 24 : 38;

      const positions = rainGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < rainCount; i++) {
        const yIdx = i * 3 + 1;
        positions[yIdx] -= delta * rainSpeed;
        if (positions[yIdx] < -2.0) {
          positions[yIdx] = 38.0;
        }
      }
      rainGeo.attributes.position.needsUpdate = true;
    } else {
      rainMat.opacity = THREE.MathUtils.lerp(rainMat.opacity, 0, 0.1);
    }

    // 8. Update Snow Particles
    if (currentWeather === 'snow') {
      snowMat.opacity = THREE.MathUtils.lerp(snowMat.opacity, 0.85, 0.08);
      const positions = snowGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < snowCount; i++) {
        const idx = i * 3;
        positions[idx + 1] -= delta * 3.4;
        positions[idx] += Math.sin(elapsed * 1.5 + i) * 0.02;
        if (positions[idx + 1] < -1.8) {
          positions[idx + 1] = 36.0;
        }
      }
      snowGeo.attributes.position.needsUpdate = true;
    } else {
      snowMat.opacity = THREE.MathUtils.lerp(snowMat.opacity, 0, 0.1);
    }

    // 9. Update Smoke / Dry Haze Particles
    if (currentWeather === 'smoke') {
      smokeMat.opacity = THREE.MathUtils.lerp(smokeMat.opacity, 0.52, 0.06);
      const positions = smokeGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < smokeCount; i++) {
        const idx = i * 3;
        positions[idx] += delta * 1.2;
        positions[idx + 1] += Math.sin(elapsed * 0.8 + i) * 0.01;
        if (positions[idx] > 45) {
          positions[idx] = -45;
        }
      }
      smokeGeo.attributes.position.needsUpdate = true;
    } else {
      smokeMat.opacity = THREE.MathUtils.lerp(smokeMat.opacity, 0, 0.1);
    }

    const isNight = nightFactor > 0.45;
    return { isNight, nightFactor, weather: currentWeather, season: currentSeason };
  };

  const dispose = () => {
    scene.remove(rootGroup);
    scene.remove(ambientLight);
    scene.remove(sunDirectionalLight);
    scene.remove(moonDirectionalLight);
    rainGeo.dispose();
    rainMat.dispose();
    snowGeo.dispose();
    snowMat.dispose();
    smokeGeo.dispose();
    smokeMat.dispose();
    cloudMat.dispose();
  };

  return {
    rootGroup,
    sunDirectionalLight,
    moonDirectionalLight,
    ambientLight,
    skyDome,
    setWeather,
    getWeather,
    setTimeOfDay,
    getTimeOfDay,
    setSeason,
    getSeason,
    update,
    dispose,
  };
}
