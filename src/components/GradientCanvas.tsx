import { useRef, useEffect } from 'react';
import { useApp } from '@/store/AppContext';

function hexToVec3(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

const VERTEX_SHADER = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform float u_time;
uniform vec2 u_res;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

mat2 rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

float gradient(vec2 uv, float t, float scale, float speed, vec2 offset) {
  vec2 p = uv * scale + offset;
  p += noise(p * 0.5 + t * 0.1) * 0.3;
  float d = length(p);
  return smoothstep(1.0, 0.0, d) * 0.5 + 0.5;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - u_res * 0.5) / min(u_res.x, u_res.y);
  float t = u_time * 0.15;

  vec2 uv1 = rot(t * 0.2) * uv;
  float g1 = gradient(uv1, t, 2.5, 0.5, vec2(sin(t*0.3)*0.3, cos(t*0.2)*0.3));

  vec2 uv2 = rot(-t * 0.15) * uv;
  float g2 = gradient(uv2, t*1.2, 2.0, 0.7, vec2(cos(t*0.25)*0.4, sin(t*0.35)*0.4));

  vec2 uv3 = rot(t * 0.1) * uv;
  float g3 = gradient(uv3, t*0.8, 1.5, 0.3, vec2(0.0, 0.0));
  float blend = smoothstep(0.3, 0.7, g3);

  vec3 c1 = mix(vec3(0.9, 0.92, 0.95), u_color1, g1);
  vec3 c2 = mix(vec3(0.92, 0.94, 0.96), u_color2, g2);
  vec3 col = mix(c1, c2, blend);

  float vignette = 1.0 - smoothstep(0.5, 1.5, length(uv));
  col = mix(vec3(0.96, 0.96, 0.97), col, vignette);

  gl_FragColor = vec4(col, 1.0);
}
`;

export function GradientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state } = useApp();
  const { settings } = state;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) return;

    function compileShader(src: string, type: number): WebGLShader | null {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, src);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        console.error(gl!.getShaderInfoLog(shader));
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = compileShader(VERTEX_SHADER, gl.VERTEX_SHADER);
    const fs = compileShader(FRAGMENT_SHADER, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return;
    }

    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'u_time');
    const uRes = gl.getUniformLocation(program, 'u_res');
    const uColor1 = gl.getUniformLocation(program, 'u_color1');
    const uColor2 = gl.getUniformLocation(program, 'u_color2');
    const uColor3 = gl.getUniformLocation(program, 'u_color3');

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      canvas!.width = canvas!.clientWidth * dpr;
      canvas!.height = canvas!.clientHeight * dpr;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }

    resize();
    window.addEventListener('resize', resize);

    const primaryColor = hexToVec3(settings.general.primaryColor);
    let animId: number;
    const startTime = performance.now();

    function render() {
      const elapsed = (performance.now() - startTime) * 0.001;
      gl!.uniform1f(uTime, elapsed);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform3f(uColor1, primaryColor[0], primaryColor[1], primaryColor[2]);
      gl!.uniform3f(uColor2, 0.9, 0.9, 0.92);
      gl!.uniform3f(uColor3, 0.94, 0.95, 0.96);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(render);
    }

    render();

    // BUG FIX: Properly clean up all WebGL resources on unmount/color change.
    // Previously only cancelled the animation frame and removed the resize listener,
    // which caused GPU memory leaks on every color change.
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      gl.deleteBuffer(buffer);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteProgram(program);
    };
  }, [settings.general.primaryColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  );
}
