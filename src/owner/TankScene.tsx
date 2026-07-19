import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, Environment, Html } from "@react-three/drei";
import * as THREE from "three";
import { CAP, fmt } from "../theme";

/* ────────────────────────────────────────────────────────────
   THE 3D TANK — owner dashboard only, lazy loaded.

   A horizontal cylindrical steel diesel tank, cut away along the
   front, sitting in an excavated bay below a concrete parking slab.
   Built with real tank anatomy so it reads as equipment, not a
   primitive: dished end caps, saddle supports, circumferential
   ribs, a manway with bolted cover, a fill point, a vent stack and
   the level probe descending through the top boss.

   The diesel is bound to app state: level drops, fuel drops; tanker
   arrives, you watch it fill.

   INTERACTIVE: drag to turn the tank, hover the labelled parts.
   Realism budget on the STEEL. Diesel stays a standard material —
   frames beat fidelity.
   ──────────────────────────────────────────────────────────── */

const R = 0.95; // tank radius (m)
const LEN = 4.2; // barrel length (m)
const WALL = 0.045;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/* ── materials, defined once ─────────────────────────────────── */
const steelShell = {
  color: "#9aa1a9",
  metalness: 0.86,
  roughness: 0.42,
  envMapIntensity: 1.2,
};
const steelDark = {
  color: "#59606a",
  metalness: 0.8,
  roughness: 0.55,
  envMapIntensity: 0.8,
};
const steelBright = {
  color: "#c3c9d0",
  metalness: 0.95,
  roughness: 0.22,
  envMapIntensity: 1.35,
};

/* ── the diesel ──────────────────────────────────────────────── */
function Fuel({ fillFrac }: { fillFrac: number }) {
  const surfRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const target = useRef(fillFrac);
  const current = useRef(fillFrac);
  const reduced = prefersReducedMotion();
  target.current = fillFrac;

  const inner = R - WALL - 0.012;
  const surfaceY = (f: number) => -inner + 2 * inner * f;

  const clipPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, -1, 0), 0),
    []
  );

  useFrame((state) => {
    current.current = reduced
      ? target.current
      : current.current + (target.current - current.current) * 0.075;
    const y = surfaceY(current.current);
    clipPlane.constant = y;
    if (surfRef.current) {
      const t = state.clock.elapsedTime;
      surfRef.current.position.y = reduced
        ? y
        : y + Math.sin(t * 1.3) * 0.0035 + Math.sin(t * 2.1) * 0.0018;
      // width of the liquid surface follows the circular cross-section
      const f = Math.max(0.001, Math.min(0.999, current.current));
      const halfChord = Math.sqrt(Math.max(0, 1 - Math.pow(2 * f - 1, 2)));
      surfRef.current.scale.z = Math.max(0.02, halfChord);
    }
    if (bodyRef.current) bodyRef.current.visible = current.current > 0.005;
  });

  return (
    <group>
      {/* the body of the diesel, clipped at the surface */}
      <mesh ref={bodyRef} rotation={[0, 0, Math.PI / 2]} receiveShadow>
        <cylinderGeometry args={[inner, inner, LEN - WALL * 2, 72, 1]} />
        <meshStandardMaterial
          color="#39424c"
          metalness={0.22}
          roughness={0.36}
          emissive="#161d24"
          emissiveIntensity={0.55}
          clippingPlanes={[clipPlane]}
          clipShadows
          envMapIntensity={0.85}
        />
      </mesh>
      {/* the liquid surface — scaled to the chord width at this fill level */}
      <mesh
        ref={surfRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, surfaceY(fillFrac), 0]}
      >
        <planeGeometry args={[LEN - WALL * 2, 2 * inner]} />
        <meshStandardMaterial
          color="#5b6672"
          metalness={0.6}
          roughness={0.1}
          emissive="#1d252d"
          emissiveIntensity={0.5}
          envMapIntensity={2.0}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/* ── the tank shell: barrel + dished caps + ribs + fittings ──── */
function TankBody() {
  // cutaway wedge faces the camera (+Z), spanning top through front
  const openAngle = Math.PI * 0.78;
  const start = openAngle / 2;
  const sweep = Math.PI * 2 - openAngle;

  return (
    <group>
      {/* outer barrel, cut away */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[R, R, LEN, 80, 1, true, start, sweep]} />
        <meshStandardMaterial {...steelShell} side={THREE.DoubleSide} />
      </mesh>
      {/* inner liner, so the shell reads as having thickness */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry
          args={[R - WALL, R - WALL, LEN - 0.002, 80, 1, true, start, sweep]}
          />
        <meshStandardMaterial {...steelDark} side={THREE.BackSide} />
      </mesh>

      {/* dished end caps — a real tank is never flat-ended */}
      {[-1, 1].map((s) => (
        <group key={s} position={[(s * LEN) / 2, 0, 0]}>
          <mesh
            rotation={[0, 0, s === 1 ? -Math.PI / 2 : Math.PI / 2]}
            castShadow
          >
            <sphereGeometry
              args={[R, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.32]}
            />
            <meshStandardMaterial {...steelShell} side={THREE.DoubleSide} />
          </mesh>
          {/* the weld collar where the cap meets the barrel */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[R, 0.022, 12, 64]} />
            <meshStandardMaterial {...steelBright} />
          </mesh>
        </group>
      ))}

      {/* circumferential reinforcing ribs — swept to match the cutaway so they
          wrap only the steel that is actually there */}
      {[-1.05, 1.05].map((x) => (
        <mesh
          key={x}
          position={[x, 0, 0]}
          rotation={[0, Math.PI / 2, start + Math.PI / 2]}
        >
          <torusGeometry args={[R + 0.014, 0.028, 10, 48, sweep]} />
          <meshStandardMaterial {...steelDark} />
        </mesh>
      ))}

      {/* the cut lips — bright machined steel edges along the cutaway */}
      {[start, start + sweep].map((a, i) => (
        <mesh
          key={i}
          position={[0, Math.sin(a) * (R - WALL / 2), Math.cos(a) * (R - WALL / 2)]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <boxGeometry args={[LEN, WALL, 0.014]} />
          <meshStandardMaterial {...steelBright} />
        </mesh>
      ))}
    </group>
  );
}

/* saddle supports the tank rests on */
function Saddles() {
  return (
    <group>
      {[-1.35, 1.35].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, -R - 0.16, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.24, 0.34, 1.5]} />
            <meshStandardMaterial color="#4a5058" metalness={0.5} roughness={0.75} />
          </mesh>
          <mesh position={[0, -R - 0.35, 0]} receiveShadow>
            <boxGeometry args={[0.34, 0.08, 1.75]} />
            <meshStandardMaterial color="#3d434a" metalness={0.4} roughness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* top fittings: manway, fill point, vent stack */
function Fittings({
  onHover,
}: {
  onHover: (label: string | null, e?: ThreeEvent<PointerEvent>) => void;
}) {
  const hoverIn = (label: string) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = "pointer";
    onHover(label, e);
  };
  const hoverOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = "grab";
    onHover(null);
  };

  return (
    <group>
      {/* manway with bolted cover */}
      <group
        position={[-1.0, R - 0.04, 0.16]}
        onPointerOver={hoverIn("Manway — inspection access")}
        onPointerOut={hoverOut}
      >
        <mesh castShadow>
          <cylinderGeometry args={[0.26, 0.28, 0.12, 32]} />
          <meshStandardMaterial {...steelDark} />
        </mesh>
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} />
          <meshStandardMaterial {...steelShell} />
        </mesh>
        {/* bolt ring */}
        {Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.25, 0.115, Math.sin(a) * 0.25]}
            >
              <cylinderGeometry args={[0.022, 0.022, 0.03, 8]} />
              <meshStandardMaterial {...steelBright} />
            </mesh>
          );
        })}
      </group>

      {/* fill point — where the tanker couples up */}
      <group
        position={[1.35, R - 0.02, 0.1]}
        onPointerOver={hoverIn("Fill point — tanker couples here")}
        onPointerOut={hoverOut}
      >
        <mesh castShadow>
          <cylinderGeometry args={[0.13, 0.15, 0.2, 24]} />
          <meshStandardMaterial {...steelDark} />
        </mesh>
        <mesh position={[0, 0.14, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.16, 0.07, 24]} />
          <meshStandardMaterial {...steelBright} />
        </mesh>
      </group>

      {/* vent stack */}
      <group
        position={[1.75, R + 0.02, -0.28]}
        onPointerOver={hoverIn("Vent — pressure relief")}
        onPointerOut={hoverOut}
      >
        <mesh position={[0, 0.16, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.32, 16]} />
          <meshStandardMaterial {...steelShell} />
        </mesh>
        <mesh position={[0, 0.34, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.1, 16]} />
          <meshStandardMaterial {...steelDark} />
        </mesh>
      </group>
    </group>
  );
}

/* the level probe — the thing that makes the whole product work */
function Probe({
  onHover,
}: {
  onHover: (label: string | null) => void;
}) {
  const bossY = R - 0.02;
  const tipY = -R + 0.1;
  const rodLen = bossY - tipY; // the rod spans crown to just above the floor
  return (
    <group
      position={[0.15, 0, -0.1]}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
        onHover("Level probe — the measurement");
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "grab";
        onHover(null);
      }}
    >
      {/* gland / boss on the crown */}
      <mesh position={[0, bossY + 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.095, 0.14, 24]} />
        <meshStandardMaterial {...steelDark} />
      </mesh>
      {/* head unit */}
      <mesh position={[0, bossY + 0.26, 0]} castShadow>
        <boxGeometry args={[0.17, 0.26, 0.17]} />
        <meshStandardMaterial color="#2a2f36" metalness={0.55} roughness={0.6} />
      </mesh>
      {/* the rod — spans the tank interior only, never through the shell */}
      <mesh position={[0, (bossY + tipY) / 2, 0]}>
        <cylinderGeometry args={[0.016, 0.016, rodLen, 20]} />
        <meshStandardMaterial {...steelBright} />
      </mesh>
      <mesh position={[0, tipY, 0]}>
        <sphereGeometry args={[0.026, 16, 16]} />
        <meshStandardMaterial {...steelBright} />
      </mesh>
    </group>
  );
}

/* the excavation the tank sits in, and the parking slab above */
function Groundworks() {
  const slabY = R + 0.5; // ground level, just clear of the tank crown fittings
  return (
    <group>
      {/* concrete parking slab, back half only — the front is the cutaway view */}
      <mesh position={[0, slabY, -2.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[LEN + 14, 3.2]} />
        <meshStandardMaterial color="#6f747b" metalness={0.02} roughness={0.98} />
      </mesh>
      {/* the slab's cut edge, facing us — the trench lip */}
      <mesh position={[0, slabY - 0.1, -0.82]} castShadow receiveShadow>
        <boxGeometry args={[LEN + 14, 0.2, 0.26]} />
        <meshStandardMaterial color="#7e838a" metalness={0.02} roughness={0.95} />
      </mesh>
      {/* bay floor the saddles sit on */}
      <mesh position={[0, -R - 0.4, -0.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[LEN + 12, 5]} />
        <meshStandardMaterial color="#4c5157" metalness={0.02} roughness={1} />
      </mesh>
      {/* back wall of the excavation — oversized so its edges never cut
          across the frame at a glancing angle */}
      <mesh position={[0, 0.1, -2.2]} receiveShadow>
        <boxGeometry args={[LEN + 14, 5.2, 0.12]} />
        <meshStandardMaterial color="#33383e" metalness={0} roughness={1} />
      </mesh>
    </group>
  );
}

/* measured-delta callout during a fill — the one place a status tint
   is allowed to touch the 3D */
function DeltaBadge({
  fillFrac,
  delta,
}: {
  fillFrac: number;
  delta: number | null;
}) {
  if (delta == null) return null;
  const inner = R - WALL - 0.012;
  const y = -inner + 2 * inner * fillFrac;
  return (
    <Html position={[LEN / 2 + 0.35, y + 0.1, 0]} center distanceFactor={7}>
      <div
        style={{
          background: "#B3261E",
          color: "#fff",
          padding: "5px 10px",
          borderRadius: 4,
          fontSize: 13,
          fontWeight: 800,
          fontFamily: "'Space Grotesk', sans-serif",
          whiteSpace: "nowrap",
          boxShadow: "0 8px 22px rgba(0,0,0,.4)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        +{fmt(delta)} L measured
      </div>
    </Html>
  );
}

/* pre-fill reference line shown during a delivery */
function ReferenceLine({ frac }: { frac: number | null }) {
  if (frac == null) return null;
  const inner = R - WALL - 0.012;
  const y = -inner + 2 * inner * frac;
  const f = Math.max(0.001, Math.min(0.999, frac));
  const halfChord = Math.sqrt(Math.max(0, 1 - Math.pow(2 * f - 1, 2)));
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[LEN - WALL * 2, 2 * inner * halfChord]} />
      <meshBasicMaterial
        color="#B3261E"
        transparent
        opacity={0.22}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ── the turntable: drag to rotate, gentle idle sway ─────────── */
function Turntable({
  children,
  dragging,
  angle,
}: {
  children: React.ReactNode;
  dragging: React.MutableRefObject<boolean>;
  angle: React.MutableRefObject<number>;
}) {
  const g = useRef<THREE.Group>(null);
  const reduced = prefersReducedMotion();
  useFrame((state) => {
    if (!g.current) return;
    const idle =
      reduced || dragging.current
        ? 0
        : Math.sin(state.clock.elapsedTime * 0.14) * 0.16;
    g.current.rotation.y = angle.current + idle;
  });
  return <group ref={g}>{children}</group>;
}

function Scene({
  fillFrac,
  preFillFrac,
  delta,
  dragging,
  angle,
  onHover,
}: {
  fillFrac: number;
  preFillFrac: number | null;
  delta: number | null;
  dragging: React.MutableRefObject<boolean>;
  angle: React.MutableRefObject<number>;
  onHover: (label: string | null) => void;
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 8, 6]}
        intensity={2.0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-6, 4, -2]} intensity={0.55} />
      <directionalLight position={[0, 3, 8]} intensity={0.75} />
      <pointLight position={[1.2, 0.9, 2.4]} intensity={0.7} distance={9} decay={2} />

      <Environment resolution={128} background={false}>
        <mesh scale={45}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial side={THREE.BackSide} color="#2f343b" />
        </mesh>
        <mesh position={[4, 7, 4]} scale={9}>
          <planeGeometry />
          <meshBasicMaterial color="#f4f6f8" />
        </mesh>
        <mesh position={[-7, 3, -3]} scale={6}>
          <planeGeometry />
          <meshBasicMaterial color="#99a0a8" />
        </mesh>
        <mesh position={[0, 2, 7]} scale={7}>
          <planeGeometry />
          <meshBasicMaterial color="#ccd2d8" />
        </mesh>
      </Environment>

      <group position={[0, 0.05, 0]}>
        <Groundworks />
        <Turntable dragging={dragging} angle={angle}>
          <TankBody />
          <Fuel fillFrac={fillFrac} />
          <Saddles />
          <Fittings onHover={onHover} />
          <Probe onHover={onHover} />
          <ReferenceLine frac={preFillFrac} />
          <DeltaBadge fillFrac={fillFrac} delta={delta} />
        </Turntable>
      </group>

      <ContactShadows
        position={[0, -R - 0.42, 0]}
        opacity={0.5}
        scale={11}
        blur={2.8}
        far={5}
        resolution={512}
        color="#000000"
      />
    </>
  );
}

export default function TankScene({
  level,
  preFillLevel,
  deltaLitres,
}: {
  level: number;
  preFillLevel?: number | null;
  deltaLitres?: number | null;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  const dragging = useRef(false);
  const angle = useRef(0);
  const lastX = useRef(0);

  const fillFrac = Math.max(0, Math.min(1, level / CAP));
  const preFillFrac =
    preFillLevel != null ? Math.max(0, Math.min(1, preFillLevel / CAP)) : null;

  const onDown = (e: React.PointerEvent) => {
    dragging.current = true;
    lastX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    angle.current += dx * 0.008;
    if (Math.abs(dx) > 1 && !hasDragged) setHasDragged(true);
  };
  const onUp = (e: React.PointerEvent) => {
    dragging.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        // sized against viewport HEIGHT too, so on a short laptop screen the
        // panel does not push the rest of the dashboard below the fold
        height: "clamp(240px, min(38vw, 34vh), 360px)",
        borderRadius: 8,
        overflow: "hidden",
        background:
          "linear-gradient(180deg, #3d434b 0%, #282d34 55%, #1d2126 100%)",
        cursor: "grab",
        touchAction: "pan-y",
      }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    >
      <Canvas
        shadows
        dpr={[1, 1.75]}
        gl={{ antialias: true, localClippingEnabled: true }}
        camera={{ position: [3.5, 2.3, 4.6], fov: 40 }}
        onCreated={({ gl, camera }) => {
          gl.localClippingEnabled = true;
          camera.lookAt(0, -0.05, 0);
        }}
      >
        <Suspense fallback={null}>
          <Scene
            fillFrac={fillFrac}
            preFillFrac={preFillFrac}
            delta={deltaLitres ?? null}
            dragging={dragging}
            angle={angle}
            onHover={setHover}
          />
        </Suspense>
      </Canvas>

      {/* part label on hover */}
      {hover && (
        <div
          style={{
            position: "absolute",
            left: 14,
            bottom: 14,
            background: "rgba(10,11,13,.88)",
            color: "#fff",
            padding: "7px 12px",
            borderRadius: 5,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.3,
            pointerEvents: "none",
            border: "1px solid rgba(255,255,255,.14)",
          }}
        >
          {hover}
        </div>
      )}

      {/* live fill readout, always on */}
      <div
        style={{
          position: "absolute",
          right: 14,
          top: 14,
          background: "rgba(10,11,13,.82)",
          color: "#fff",
          padding: "8px 12px",
          borderRadius: 6,
          border: "1px solid rgba(255,255,255,.14)",
          pointerEvents: "none",
          textAlign: "right",
        }}
      >
        <div
          className="tnum"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 20,
            fontWeight: 800,
            lineHeight: 1.1,
          }}
        >
          {Math.round(fillFrac * 100)}%
        </div>
        <div style={{ fontSize: 10.5, color: "#A9AEB5", marginTop: 1 }}>
          of {fmt(CAP)} L
        </div>
      </div>

      {/* drag affordance, retires once used */}
      {!hasDragged && (
        <div
          style={{
            position: "absolute",
            left: 14,
            top: 14,
            background: "rgba(10,11,13,.7)",
            color: "#C9CCD1",
            padding: "6px 11px",
            borderRadius: 5,
            fontSize: 11,
            fontWeight: 600,
            pointerEvents: "none",
          }}
        >
          Drag to turn · hover the parts
        </div>
      )}
    </div>
  );
}
