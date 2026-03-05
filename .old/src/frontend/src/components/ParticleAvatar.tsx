import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParticleData {
  targetX: number;
  targetY: number;
  targetZ: number;
  currentX: number;
  currentY: number;
  currentZ: number;
  velocityX: number;
  velocityY: number;
  velocityZ: number;
  spawnX: number;
  spawnY: number;
  spawnZ: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TERMINAL_LINES = [
  { text: "$ load_profile --user aayush_tikone", color: "cyan" },
  { text: "[OK] Identity verified", color: "green" },
  { text: "[OK] Systems engineer detected", color: "green" },
  { text: "[OK] Ready for collaboration", color: "green" },
] as const;

const GREEN_COLOR = new THREE.Color("#22c55e");
const CYAN_COLOR = new THREE.Color("#06b6d4");

// ─── Shader sources ───────────────────────────────────────────────────────────

const VERTEX_SHADER = `
  attribute float aSize;
  attribute vec3 aColor;
  varying vec3 vColor;
  uniform float uGlowPulse;

  void main() {
    vColor = aColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uGlowPulse * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = `
  varying vec3 vColor;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
    float core = 1.0 - smoothstep(0.0, 0.2, dist);
    vec3 col = mix(vColor, vec3(1.0), core * 0.5);
    gl_FragColor = vec4(col, alpha * 0.5);
  }
`;

// ─── Oval/face-silhouette particle positions ──────────────────────────────────

function generateFaceParticles(count: number): { x: number; y: number }[] {
  const particles: { x: number; y: number }[] = [];
  const rng = (min: number, max: number) => min + Math.random() * (max - min);

  // Build a face-silhouette shape: head oval + neck + shoulders outline
  while (particles.length < count) {
    const zone = Math.random();

    if (zone < 0.6) {
      // Head oval – centered, taller than wide
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()); // sqrt for uniform area fill
      const rx = 0.38;
      const ry = 0.48;
      const x = Math.cos(angle) * r * rx + rng(-0.04, 0.04);
      const y = Math.sin(angle) * r * ry + 0.18 + rng(-0.04, 0.04);
      if (Math.abs(x) < 0.42 && y > -0.34 && y < 0.72) {
        particles.push({ x, y });
      }
    } else if (zone < 0.78) {
      // Hair / top of head – cluster above center
      const angle = Math.random() * Math.PI; // top half
      const r = 0.32 + Math.random() * 0.1;
      particles.push({
        x: Math.cos(angle) * r * 0.36 + rng(-0.03, 0.03),
        y: 0.2 + Math.sin(angle) * r * 0.44 + rng(-0.02, 0.02),
      });
    } else if (zone < 0.9) {
      // Neck – narrow strip
      particles.push({
        x: rng(-0.1, 0.1),
        y: rng(-0.38, -0.22),
      });
    } else {
      // Shoulders – wide strip below neck
      const side = Math.random() < 0.5 ? -1 : 1;
      particles.push({
        x: side * rng(0.08, 0.46) + rng(-0.04, 0.04),
        y: rng(-0.56, -0.36),
      });
    }
  }
  return particles.slice(0, count);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ParticleAvatar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const particleDataRef = useRef<ParticleData[]>([]);
  const animFrameRef = useRef<number>(0);
  const clockRef = useRef(new THREE.Clock());
  const spawnProgressRef = useRef(0);
  const isHoveredRef = useRef(false);
  const dispersedRef = useRef(false);
  const mouseNormRef = useRef({ x: 0, y: 0 });
  const rotXRef = useRef(0);
  const rotYRef = useRef(0);

  const [isHovered, setIsHovered] = useState(false);
  const [terminalLines, setTerminalLines] = useState<number[]>([]);

  // Responsive particle count — keep low since it's decorative overlay only
  const PARTICLE_COUNT =
    typeof window !== "undefined" && window.innerWidth < 768 ? 400 : 900;

  // ── Build Three.js decorative particle overlay ─────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(container.clientWidth, container.clientHeight);

    const scene = new THREE.Scene();

    const w = container.clientWidth;
    const h = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.01, 100);
    camera.position.z = 3.5;

    // Generate face-silhouette particle positions (no image sampling)
    const faceParticles = generateFaceParticles(PARTICLE_COUNT);
    const count = faceParticles.length;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const pData: ParticleData[] = [];

    for (let i = 0; i < count; i++) {
      const fp = faceParticles[i];
      const tx = fp.x * 3.0;
      const ty = fp.y * 3.8;
      const tz = (Math.random() - 0.5) * 0.12;

      // Spawn: random scatter
      const r = 6 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const sx = r * Math.sin(phi) * Math.cos(theta);
      const sy = r * Math.sin(phi) * Math.sin(theta);
      const sz = r * Math.cos(phi);

      pData.push({
        targetX: tx,
        targetY: ty,
        targetZ: tz,
        currentX: sx,
        currentY: sy,
        currentZ: sz,
        velocityX: 0,
        velocityY: 0,
        velocityZ: 0,
        spawnX: sx,
        spawnY: sy,
        spawnZ: sz,
      });

      positions[i * 3] = sx;
      positions[i * 3 + 1] = sy;
      positions[i * 3 + 2] = sz;

      const t = i / count;
      const c = new THREE.Color().lerpColors(GREEN_COLOR, CYAN_COLOR, t);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = 0.013 + Math.random() * 0.007;
    }

    particleDataRef.current = pData;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: { uGlowPulse: { value: 1.0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);
    particlesRef.current = points;
    clockRef.current.start();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const elapsed = clockRef.current.getElapsedTime();
      const delta = Math.min(clockRef.current.getDelta(), 0.05);

      const SPAWN_DURATION = 2.2;
      if (spawnProgressRef.current < 1) {
        spawnProgressRef.current = Math.min(1, elapsed / SPAWN_DURATION);
      }

      const prog = spawnProgressRef.current;
      const eased = 1 - (1 - prog) ** 3;

      const pArr = particleDataRef.current;
      const posAttr = points.geometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;

      if (!isHoveredRef.current) {
        for (let i = 0; i < pArr.length; i++) {
          const p = pArr[i];
          if (prog < 1) {
            p.currentX = p.spawnX + (p.targetX - p.spawnX) * eased;
            p.currentY = p.spawnY + (p.targetY - p.spawnY) * eased;
            p.currentZ = p.spawnZ + (p.targetZ - p.spawnZ) * eased;
          } else {
            p.velocityX *= 0.88;
            p.velocityY *= 0.88;
            p.velocityZ *= 0.88;
            p.currentX += (p.targetX - p.currentX) * 0.06 + p.velocityX * delta;
            p.currentY += (p.targetY - p.currentY) * 0.06 + p.velocityY * delta;
            p.currentZ += (p.targetZ - p.currentZ) * 0.06 + p.velocityZ * delta;
          }
          posAttr.setXYZ(i, p.currentX, p.currentY, p.currentZ);
        }
        dispersedRef.current = false;
      } else {
        if (!dispersedRef.current) {
          for (let i = 0; i < pArr.length; i++) {
            const p = pArr[i];
            const nx = p.targetX === 0 ? Math.random() - 0.5 : p.targetX;
            const ny = p.targetY === 0 ? Math.random() - 0.5 : p.targetY;
            const nz = p.targetZ === 0 ? Math.random() - 0.5 : p.targetZ;
            const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
            const speed = 0.6 + Math.random() * 1.2;
            p.velocityX = (nx / len) * speed;
            p.velocityY = (ny / len) * speed;
            p.velocityZ = (nz / len) * speed;
          }
          dispersedRef.current = true;
        }

        for (let i = 0; i < pArr.length; i++) {
          const p = pArr[i];
          p.velocityX *= 0.94;
          p.velocityY *= 0.94;
          p.velocityZ *= 0.94;
          p.currentX += p.velocityX * delta;
          p.currentY += p.velocityY * delta;
          p.currentZ += p.velocityZ * delta;

          // Cursor pull
          const mouseX = mouseNormRef.current.x * 1.5;
          const mouseY = mouseNormRef.current.y * 1.9;
          const dx = mouseX - p.currentX;
          const dy = mouseY - p.currentY;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < 0.16) {
            const pull = 0.4 * (1 - dist2 / 0.16);
            p.velocityX += dx * pull * delta;
            p.velocityY += dy * pull * delta;
          }

          posAttr.setXYZ(i, p.currentX, p.currentY, p.currentZ);
        }
      }

      posAttr.needsUpdate = true;

      if (prog >= 1 && material.uniforms) {
        material.uniforms.uGlowPulse.value =
          1.0 + Math.sin(elapsed * 1.2) * 0.18;
      }

      // Camera tilt
      const targetRotX = mouseNormRef.current.y * 0.18;
      const targetRotY = mouseNormRef.current.x * 0.18;
      rotXRef.current += (targetRotX - rotXRef.current) * 0.08;
      rotYRef.current += (targetRotY - rotYRef.current) * 0.08;
      points.rotation.x = rotXRef.current;
      points.rotation.y = rotYRef.current;

      renderer.render(scene, camera);
    };

    animate();

    const ro = new ResizeObserver(() => {
      if (!container || !renderer || !camera) return;
      const rw = container.clientWidth;
      const rh = container.clientHeight;
      camera.aspect = rw / rh;
      camera.updateProjectionMatrix();
      renderer.setSize(rw, rh);
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      ro.disconnect();
      particlesRef.current?.geometry.dispose();
      if (particlesRef.current?.material instanceof THREE.ShaderMaterial) {
        particlesRef.current.material.dispose();
      }
      renderer.dispose();
      particlesRef.current = null;
    };
  }, [PARTICLE_COUNT]);

  // ── Hover handlers ────────────────────────────────────────────────────────
  const handleMouseEnter = () => {
    isHoveredRef.current = true;
    dispersedRef.current = false;
    setIsHovered(true);
    setTerminalLines([]);
    TERMINAL_LINES.forEach((_, i) => {
      setTimeout(() => {
        setTerminalLines((prev) => [...prev, i]);
      }, i * 220);
    });
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    setIsHovered(false);
    setTerminalLines([]);
    mouseNormRef.current = { x: 0, y: 0 };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    mouseNormRef.current = { x: nx, y: ny };
  };

  const handleTouchStart = () => handleMouseEnter();
  const handleTouchEnd = () => handleMouseLeave();

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Base layer: always-visible photo ─────────────────────────────── */}
      {/* Glow border behind the photo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          borderRadius: "16px",
          boxShadow: isHovered
            ? "0 0 30px rgba(34,197,94,0.5), 0 0 60px rgba(6,182,212,0.3), inset 0 0 0 2px rgba(34,197,94,0.7)"
            : "0 0 16px rgba(34,197,94,0.25), 0 0 32px rgba(6,182,212,0.12), inset 0 0 0 1px rgba(34,197,94,0.35)",
          transition: "all 0.5s ease",
        }}
      />

      {/* Actual photo — fills the container absolutely */}
      <img
        src="/assets/uploads/MyImageFinal-1.png"
        alt="Aayush Tikone"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center top",
          borderRadius: "16px",
          display: "block",
          filter: isHovered
            ? "brightness(1.05) contrast(1.05) saturate(1.1)"
            : "brightness(1) contrast(1.02)",
          transition: "filter 0.4s ease",
        }}
      />

      {/* Scanline grid overlay on top of photo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 3,
          borderRadius: "16px",
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(34,197,94,0.03) 19px), repeating-linear-gradient(90deg, transparent, transparent 18px, rgba(6,182,212,0.03) 19px)",
        }}
      />

      {/* Bottom gradient fade for depth */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          zIndex: 4,
          height: "80px",
          borderRadius: "0 0 16px 16px",
          background:
            "linear-gradient(to top, rgba(11,15,20,0.75) 0%, transparent 100%)",
        }}
      />

      {/* Status badge */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "12px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "rgba(11,15,20,0.88)",
          border: "1px solid rgba(34,197,94,0.4)",
          borderRadius: "20px",
          padding: "4px 12px",
          backdropFilter: "blur(8px)",
          whiteSpace: "nowrap",
        }}
      >
        <span
          className="animate-pulse"
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#22c55e",
            boxShadow: "0 0 6px #22c55e",
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "0.6rem",
            color: "rgba(34,197,94,0.9)",
            letterSpacing: "0.08em",
          }}
        >
          AVAILABLE
        </span>
      </div>

      {/* ── Three.js particle overlay (decorative, behind photo) ──────── */}
      <canvas
        ref={canvasRef}
        data-ocid="hero.avatar.canvas_target"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1, display: "block", opacity: 0.35 }}
      />

      {/* Ambient outer glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isHovered
            ? "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(34,197,94,0.08) 0%, transparent 70%)"
            : "radial-gradient(ellipse 55% 65% at 50% 50%, rgba(34,197,94,0.03) 0%, transparent 70%)",
          transition: "all 0.5s ease",
          zIndex: 8,
        }}
      />

      {/* Scan-line sweep on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            key="scanline"
            className="absolute left-0 right-0 pointer-events-none"
            style={{ height: "2px", zIndex: 9 }}
            initial={{ top: "0%", opacity: 0 }}
            animate={{ top: "100%", opacity: [0, 0.7, 0.7, 0] }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.4,
              ease: "linear",
              repeat: Number.POSITIVE_INFINITY,
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(34,197,94,0.85) 30%, rgba(6,182,212,0.85) 70%, transparent 100%)",
                boxShadow:
                  "0 0 8px rgba(34,197,94,0.5), 0 0 16px rgba(34,197,94,0.25)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Corner HUD brackets */}
      {(["tl", "tr", "bl", "br"] as const).map((corner) => (
        <div
          key={corner}
          className="absolute pointer-events-none"
          style={{
            width: "20px",
            height: "20px",
            zIndex: 10,
            top: corner.startsWith("t") ? "8px" : undefined,
            bottom: corner.startsWith("b") ? "8px" : undefined,
            left: corner.endsWith("l") ? "8px" : undefined,
            right: corner.endsWith("r") ? "8px" : undefined,
            borderTop: corner.startsWith("t")
              ? "2px solid rgba(34,197,94,0.7)"
              : undefined,
            borderBottom: corner.startsWith("b")
              ? "2px solid rgba(34,197,94,0.7)"
              : undefined,
            borderLeft: corner.endsWith("l")
              ? "2px solid rgba(34,197,94,0.7)"
              : undefined,
            borderRight: corner.endsWith("r")
              ? "2px solid rgba(34,197,94,0.7)"
              : undefined,
            opacity: isHovered ? 1 : 0.5,
            transition: "opacity 0.3s ease",
          }}
        />
      ))}

      {/* Terminal overlay (hover) */}
      <AnimatePresence>
        {isHovered && terminalLines.length > 0 && (
          <motion.div
            key="terminal-overlay"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-4 left-4 right-4 pointer-events-none"
            style={{
              zIndex: 11,
              background: "rgba(11,15,20,0.93)",
              border: "1px solid rgba(34,197,94,0.35)",
              borderRadius: "8px",
              padding: "12px 14px",
              backdropFilter: "blur(8px)",
              boxShadow:
                "0 0 20px rgba(34,197,94,0.15), 0 4px 24px rgba(0,0,0,0.6)",
            }}
          >
            <div className="flex gap-1.5 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
              <span
                className="ml-2 font-mono text-xs"
                style={{ color: "rgba(156,163,175,0.7)", fontSize: "0.6rem" }}
              >
                identity.sh
              </span>
            </div>

            <div className="space-y-1">
              {TERMINAL_LINES.map((line, i) => (
                <AnimatePresence key={line.text}>
                  {terminalLines.includes(i) && (
                    <motion.div
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.18 }}
                      className="font-mono"
                      style={{
                        fontSize: "0.65rem",
                        color:
                          line.color === "cyan"
                            ? "rgba(6,182,212,0.95)"
                            : "rgba(34,197,94,0.95)",
                        lineHeight: "1.4",
                        textShadow:
                          line.color === "green"
                            ? "0 0 8px rgba(34,197,94,0.5)"
                            : "0 0 8px rgba(6,182,212,0.5)",
                      }}
                    >
                      {line.text}
                    </motion.div>
                  )}
                </AnimatePresence>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
