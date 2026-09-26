/**
 * The lattice — the opening's one live element.
 *
 * A wireframe grid that begins warped and resolves into a flat, ordered
 * plane. That is the product stated as geometry: unsorted deal flow
 * becoming a structured pipeline. Scroll drives the global resolve; the
 * pointer resolves a local region, lifts it, and tints it with the signal
 * blue — the visitor doing, by hand, the thing the software does.
 *
 * Drawn as LINES, not points. "Grid" is a relationship between points and
 * only an edge states it; a point cloud at any density that performs well
 * reads as dust. It is drafted in graphite on the paper ground, so it sits
 * in the page as a technical drawing rather than glowing on top of it.
 *
 * Raw WebGL2, no 3D library: this is one draw call of one static buffer,
 * and a library would ship hundreds of kilobytes to do it. Nothing is
 * allocated per frame; all animation lives in uniforms driven by one rAF.
 */

export interface LatticeOptions {
  /**
   * Lattice sites per axis. Kept low on purpose — past roughly 60 columns
   * the cells close up in perspective and the grid reads as a gradient
   * rather than as a structure.
   */
  cols?: number;
  rows?: number;
  /** Device pixel ratio ceiling; 1.5 is indistinguishable from 2 for lines. */
  maxDpr?: number;
}

export interface Lattice {
  /** 0 = fully warped, 1 = flat and ordered. Eased internally. */
  setResolve(value: number): void;
  /** Pointer in clip space (-1..1, y up). */
  setPointer(x: number, y: number): void;
  clearPointer(): void;
  setRunning(running: boolean): void;
  dispose(): void;
}

const VERT = /* glsl */ `#version 300 es
precision highp float;

in vec3 a_target;   // resting position in the resolved lattice
in vec3 a_chaos;    // resting position while unresolved
in vec4 a_seed;     // drift phase (xyz), resolve stagger (w)

uniform mat4 u_viewProj;
uniform float u_time;
uniform float u_resolve;
uniform vec2 u_focus;
uniform float u_focusAmount;

out float v_resolve;
out float v_local;
out float v_fog;

void main() {
  // Drift, anisotropic on purpose: the wander is mostly *within* the plane.
  // Height scatter is what destroys a lattice's readability fastest, so it
  // gets a fraction of the amplitude the horizontal axes get.
  vec3 drift = a_chaos + vec3(
    sin(u_time * 0.21 + a_seed.x * 6.2831) * 0.34,
    sin(u_time * 0.17 + a_seed.y * 6.2831) * 0.07,
    cos(u_time * 0.13 + a_seed.z * 6.2831) * 0.34
  );

  // Local resolve around the pointer, falling off over ~3 lattice units.
  float d = distance(a_target.xz, u_focus);
  float local = smoothstep(3.0, 0.0, d) * u_focusAmount;

  // Stagger by seed so the field resolves as a wave, never as a snap.
  float k = clamp(u_resolve + local, 0.0, 1.0);
  k = smoothstep(0.0, 1.0, clamp(k * 1.55 - a_seed.w * 0.55, 0.0, 1.0));

  // The resolved plane breathes and lifts under the pointer, so "ordered"
  // never reads as "dead".
  vec3 target = a_target;
  target.y += sin(a_target.x * 0.55 + u_time * 0.45) * 0.10 * k;
  target.y += sin(a_target.z * 0.70 - u_time * 0.32) * 0.07 * k;
  target.y += local * 0.70;

  vec4 clip = u_viewProj * vec4(mix(drift, target, k), 1.0);
  gl_Position = clip;

  v_resolve = k;
  v_local = local;
  v_fog = 1.0 - smoothstep(9.0, 26.0, clip.w);
}
`;

const FRAG = /* glsl */ `#version 300 es
precision highp float;

in float v_resolve;
in float v_local;
in float v_fog;

out vec4 outColor;

void main() {
  // Graphite on paper. Resolved edges darken rather than brighten, so order
  // reads as the drawing being committed, not as it switching on.
  vec3 faint    = vec3(0.560, 0.556, 0.537);
  vec3 graphite = vec3(0.067, 0.071, 0.063);
  vec3 signal   = vec3(0.357, 0.486, 1.000);

  vec3 col = mix(faint, graphite, v_resolve * 0.92);
  col = mix(col, signal, clamp(v_local * 1.3, 0.0, 1.0));

  float alpha = v_fog * (0.16 + 0.26 * v_resolve + 0.42 * v_local);
  outColor = vec4(col * alpha, alpha); // premultiplied
}
`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/** Column-major perspective × lookAt, multiplied out rather than pulled in. */
function viewProjection(out: Float32Array, aspect: number, eye: [number, number, number]) {
  const fov = (42 * Math.PI) / 180;
  const near = 0.1;
  const far = 60;
  const f = 1 / Math.tan(fov / 2);
  const nf = 1 / (near - far);

  const [ex, ey, ez] = eye;
  let zx = ex, zy = ey, zz = ez;
  let len = Math.hypot(zx, zy, zz) || 1;
  zx /= len; zy /= len; zz /= len;
  let xx = zz, xy = 0, xz = -zx;
  len = Math.hypot(xx, xy, xz) || 1;
  xx /= len; xy /= len; xz /= len;
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;

  const tx = -(xx * ex + xy * ey + xz * ez);
  const ty = -(yx * ex + yy * ey + yz * ez);
  const tz = -(zx * ex + zy * ey + zz * ez);
  const px = f / aspect;

  out[0] = px * xx;  out[1] = f * yx;  out[2] = (far + near) * nf * zx;  out[3] = -zx;
  out[4] = px * xy;  out[5] = f * yy;  out[6] = (far + near) * nf * zy;  out[7] = -zy;
  out[8] = px * xz;  out[9] = f * yz;  out[10] = (far + near) * nf * zz; out[11] = -zz;
  out[12] = px * tx; out[13] = f * ty;
  out[14] = (far + near) * nf * tz + 2 * far * near * nf;
  out[15] = -tz;
  return out;
}

export function createLattice(
  canvas: HTMLCanvasElement,
  { cols = 44, rows = 26, maxDpr = 1.5 }: LatticeOptions = {},
): Lattice | null {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: true,
    depth: false,
    powerPreference: "high-performance",
  });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  // ── Geometry, built once ────────────────────────────────────────────
  /*
    Two passes. Every lattice site gets its resting place, its displaced
    place and its seed; then edges are emitted by copying those per-site
    values into pairs, so the two ends of an edge always move identically
    and the mesh can never tear.
  */
  const sites = cols * rows;
  const siteTarget = new Float32Array(sites * 3);
  const siteChaos = new Float32Array(sites * 3);
  const siteSeed = new Float32Array(sites * 4);

  const spanX = 18;
  const spanZ = 13;
  // Lifted above the camera's target so it composes into the upper half of
  // the viewport, leaving the lower half to the headline.
  const lift = 1.4;

  for (let j = 0, i = 0; j < rows; j++) {
    for (let c = 0; c < cols; c++, i++) {
      const u = cols === 1 ? 0.5 : c / (cols - 1);
      const v = rows === 1 ? 0.5 : j / (rows - 1);

      siteTarget[i * 3] = (u - 0.5) * spanX;
      siteTarget[i * 3 + 1] = lift;
      siteTarget[i * 3 + 2] = (v - 0.5) * spanZ;

      // Disorder grows toward the edges, so the field resolves centre-out
      // and the frame always has a settled core to read.
      const edge = 0.3 + Math.hypot(u - 0.5, v - 0.5) * 1.5;
      const a = Math.random() * Math.PI * 2;
      const rad = Math.random() * 0.55 * edge;
      siteChaos[i * 3] = siteTarget[i * 3] + Math.cos(a) * rad;
      siteChaos[i * 3 + 1] = lift + (Math.random() - 0.35) * 1.05 * edge;
      siteChaos[i * 3 + 2] = siteTarget[i * 3 + 2] + Math.sin(a) * rad;

      siteSeed[i * 4] = Math.random();
      siteSeed[i * 4 + 1] = Math.random();
      siteSeed[i * 4 + 2] = Math.random();
      // Weighted toward the far edge, so resolve sweeps toward the viewer.
      siteSeed[i * 4 + 3] = Math.random() * 0.7 + v * 0.3;
    }
  }

  const count = ((cols - 1) * rows + cols * (rows - 1)) * 2;
  const targets = new Float32Array(count * 3);
  const chaos = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 4);

  let w = 0;
  const emit = (site: number) => {
    for (let k = 0; k < 3; k++) {
      targets[w * 3 + k] = siteTarget[site * 3 + k];
      chaos[w * 3 + k] = siteChaos[site * 3 + k];
    }
    for (let k = 0; k < 4; k++) seeds[w * 4 + k] = siteSeed[site * 4 + k];
    w++;
  };
  for (let j = 0; j < rows; j++)
    for (let c = 0; c < cols - 1; c++) {
      emit(j * cols + c);
      emit(j * cols + c + 1);
    }
  for (let c = 0; c < cols; c++)
    for (let j = 0; j < rows - 1; j++) {
      emit(j * cols + c);
      emit((j + 1) * cols + c);
    }

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buffers: WebGLBuffer[] = [];
  const bind = (name: string, data: Float32Array, size: number) => {
    const buf = gl.createBuffer()!;
    buffers.push(buf);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  };
  bind("a_target", targets, 3);
  bind("a_chaos", chaos, 3);
  bind("a_seed", seeds, 4);
  gl.bindVertexArray(null);

  const u = {
    viewProj: gl.getUniformLocation(program, "u_viewProj"),
    time: gl.getUniformLocation(program, "u_time"),
    resolve: gl.getUniformLocation(program, "u_resolve"),
    focus: gl.getUniformLocation(program, "u_focus"),
    focusAmount: gl.getUniformLocation(program, "u_focusAmount"),
  };

  gl.useProgram(program);
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // premultiplied
  gl.clearColor(0, 0, 0, 0);

  // ── Animation state ─────────────────────────────────────────────────
  const matrix = new Float32Array(16);
  let width = 0;
  let height = 0;
  let targetResolve = 0.5;
  let resolve = 0.5;
  let pointerX = 0;
  let pointerY = 0;
  let targetFocus = 0;
  let focus = 0;
  let camX = 0;
  let camY = 0;
  let raf = 0;
  let running = false;
  let startedAt = 0;
  let lastFrame = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width * dpr));
    height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
  };

  const frame = (now: number) => {
    raf = running ? requestAnimationFrame(frame) : 0;
    if (!startedAt) startedAt = now;
    // Clamp dt so a backgrounded tab does not jump the easing on return.
    const dt = Math.min((now - (lastFrame || now)) / 1000, 0.05);
    lastFrame = now;
    const t = (now - startedAt) / 1000;

    const ease = 1 - Math.pow(0.0015, dt);
    resolve += (targetResolve - resolve) * ease;
    focus += (targetFocus - focus) * ease;
    camX += (pointerX - camX) * ease;
    camY += (pointerY - camY) * ease;

    const orbit = camX * 0.5;
    viewProjection(matrix, width / height, [
      Math.sin(orbit) * 12.5,
      8.2 + camY * 1.1,
      Math.cos(orbit) * 12.5,
    ]);

    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.uniformMatrix4fv(u.viewProj, false, matrix);
    gl.uniform1f(u.time, t);
    gl.uniform1f(u.resolve, resolve);
    // The pointer projected onto the lattice plane — close enough that the
    // lifted region tracks the cursor convincingly.
    gl.uniform2f(u.focus, camX * (spanX * 0.42), -camY * (spanZ * 0.5));
    gl.uniform1f(u.focusAmount, focus);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.LINES, 0, count);
  };

  resize();
  window.addEventListener("resize", resize);

  return {
    setResolve(value) {
      targetResolve = Math.min(1, Math.max(0, value));
    },
    setPointer(x, y) {
      pointerX = x;
      pointerY = y;
      targetFocus = 1;
    },
    clearPointer() {
      targetFocus = 0;
    },
    setRunning(next) {
      if (next === running) return;
      running = next;
      if (next) {
        lastFrame = 0;
        raf = requestAnimationFrame(frame);
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    dispose() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      buffers.forEach((b) => gl.deleteBuffer(b));
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    },
  };
}
