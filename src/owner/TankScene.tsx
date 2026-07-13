import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  OrbitControls,
  Html,
} from "@react-three/drei";
import * as THREE from "three";
import { CAP, fmt } from "../theme";

/* ────────────────────────────────────────────────────────────
   THE 3D TANK — owner dashboard only, lazy loaded.
   A horizontal cylindrical steel tank, cut away, buried under a
   concrete parking slab. The diesel inside is bound to app state:
   when the level drops the fuel drops; when a tanker arrives you
   watch it fill. This is the product, not decoration.

   Realism budget spent on the STEEL (metalness/roughness, env
   reflections, contact shadows). The diesel is a dark, slightly
   glossy standard material with a subtle animated surface —
   NOT MeshTransmissionMaterial. Frames beat fidelity.
   Monochrome only; the single status tint is allowed on the
   measured-delta callout and nowhere else.
   ──────────────────────────────────────────────────────────── */

// tank geometry (metres) — believable ~10,000 L: Ø1.9m × ~4m
const R = 0.95;
const LEN = 4.0;
const WALL = 0.04;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/* the fuel body: a cylinder clipped to the current fill height.
   Fill fraction maps directly to level/capacity. The clip plane is
   the fuel surface. A gentle animated ripple sells "liquid" cheaply. */
function Fuel({ fillFrac }: { fillFrac: number }) {
  const surfRef = useRef<THREE.Mesh>(null);
  const target = useRef(fillFrac);
  const current = useRef(fillFrac);
  const reduced = prefersReducedMotion();
  target.current = fillFrac;

  // fuel surface Y within the tank (tank centre at y=0, radius R)
  const surfaceY = (frac: number) => -R + WALL + (2 * R - 2 * WALL) * frac;

  const clipPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, -1, 0), 0),
    []
  );

  useFrame((state) => {
    // ease the fill toward target (snaps under reduced motion)
    current.current = reduced
      ? target.current
      : current.current + (target.current - current.current) * 0.08;
    const y = surfaceY(current.current);
    clipPlane.constant = y;
    if (surfRef.current) {
      surfRef.current.position.y = y;
      // subtle ripple on the surface, very low amplitude
      if (!reduced) {
        const t = state.clock.elapsedTime;
        surfRef.current.position.y =
          y + Math.sin(t * 1.4) * 0.004 + Math.sin(t * 2.3) * 0.002;
      }
    }
  });

  // fuel body: the inner cylinder, clipped from above at the surface plane.
  // The surface is a plane sized to span the tank, clipped to the same level,
  // catching light so the diesel reads as a liquid top, not a black void.
  const rr = R - WALL - 0.01;
  return (
    <group>
      <mesh castShadow={false} receiveShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[rr, rr, LEN - WALL * 2, 64, 1]} />
        <meshStandardMaterial
          color="#3b454f"
          metalness={0.25}
          roughness={0.38}
          emissive="#151b21"
          emissiveIntensity={0.6}
          clippingPlanes={[clipPlane]}
          clipShadows
          envMapIntensity={0.9}
        />
      </mesh>
      {/* the fuel surface — spans the full width, glossy so it reads as liquid */}
      <mesh
        ref={surfRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, surfaceY(fillFrac), 0]}
      >
        <planeGeometry args={[LEN - WALL * 2, 2 * rr * 0.985]} />
        <meshStandardMaterial
          color="#525d68"
          metalness={0.55}
          roughness={0.12}
          emissive="#1a2128"
          emissiveIntensity={0.55}
          envMapIntensity={1.8}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function SteelTank() {
  // Cutaway: draw the tank as a near-full cylinder with the top-front wedge
  // omitted via thetaLength, so we look down into the fuel.
  //
  // CylinderGeometry arc lives in the local XZ plane; theta=0 points +Z,
  // increasing toward +X. After the group's z-rotation of π/2 the axis lies
  // along X and this arc becomes the vertical YZ cross-section we see. We
  // remove the wedge centred on the up/front direction so the opening faces
  // the camera (which sits front-right-above).
  // Remove a large wedge covering the top AND the front-facing lower quarter,
  // so the fuel sitting low in the tank is visible through the front, not
  // hidden behind the lower shell. Gap centred on +Z (straight at the camera).
  const openAngle = Math.PI * 0.92; // wide wedge: top through front
  const center = 0; // +Z — straight toward the camera, spanning up and down
  const start = center + openAngle / 2;
  const sweep = Math.PI * 2 - openAngle;

  return (
    <group>
      {/* outer steel shell (cutaway) */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry
          args={[R, R, LEN, 72, 1, true, start, sweep]}
        />
        <meshStandardMaterial
          color="#8a9099"
          metalness={0.92}
          roughness={0.4}
          side={THREE.DoubleSide}
          envMapIntensity={1.15}
        />
      </mesh>
      {/* inner wall (slightly darker) to give the shell thickness */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry
          args={[R - WALL, R - WALL, LEN - 0.001, 72, 1, true, start, sweep]}
        />
        <meshStandardMaterial
          color="#3f454d"
          metalness={0.7}
          roughness={0.55}
          side={THREE.BackSide}
          envMapIntensity={0.7}
        />
      </mesh>
      {/* end caps */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[(s * LEN) / 2, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <circleGeometry args={[R, 64]} />
          <meshStandardMaterial
            color="#7c828b"
            metalness={0.9}
            roughness={0.45}
            side={THREE.DoubleSide}
            envMapIntensity={1.0}
          />
        </mesh>
      ))}
      {/* cut edges — thin steel rings at the two lips of the cutaway */}
      {[start, start + sweep].map((a, i) => {
        const y = Math.sin(a) * R;
        const z = Math.cos(a) * R;
        return (
          <mesh
            key={i}
            position={[0, y, z]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <boxGeometry args={[LEN, WALL, 0.012]} />
            <meshStandardMaterial
              color="#aeb4bc"
              metalness={0.95}
              roughness={0.3}
              envMapIntensity={1.2}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/* the sensor probe descending from the tank top into the fuel */
function Probe({ fillFrac }: { fillFrac: number }) {
  const bossY = R + 0.02;
  const tipY = -R + 0.08 + (2 * R) * 0.05; // reaches near the bottom
  const height = bossY - tipY;
  const midY = (bossY + tipY) / 2;
  void fillFrac;
  return (
    <group position={[0.2, 0, 0]}>
      {/* boss / gland on the tank top */}
      <mesh position={[0, R + 0.03, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.1, 24]} />
        <meshStandardMaterial color="#2b2f35" metalness={0.8} roughness={0.5} />
      </mesh>
      {/* the probe rod */}
      <mesh position={[0, midY, 0]}>
        <cylinderGeometry args={[0.014, 0.014, height, 20]} />
        <meshStandardMaterial
          color="#c2c7cd"
          metalness={0.95}
          roughness={0.25}
          envMapIntensity={1.1}
        />
      </mesh>
      {/* probe tip */}
      <mesh position={[0, tipY, 0]}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial color="#e6e9ec" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

/* The concrete parking slab and the ground the tank is buried in.
   A single ground plane sits at the tank crown height, BEHIND the cutaway,
   so it reads as the parking surface the tank is sunk under — never a plank
   slicing through the model. A darker soil wall behind grounds it as buried. */
function Slab() {
  const groundY = R + 0.02; // parking surface, just above the tank crown
  return (
    <group>
      {/* the parking slab — only the BACK half, so the excavated front stays
          open for us to look down into the tank. The cut edge faces us. */}
      <mesh
        position={[0, groundY, -2.3]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[LEN + 4, 3.2]} />
        <meshStandardMaterial color="#6e7178" metalness={0.03} roughness={0.97} />
      </mesh>
      {/* the slab's cut edge facing us — a thin concrete lip, the trench wall */}
      <mesh position={[0, groundY - 0.16, -0.7]} receiveShadow castShadow>
        <boxGeometry args={[LEN + 4, 0.32, 0.14]} />
        <meshStandardMaterial color="#7a7d83" metalness={0.03} roughness={0.95} />
      </mesh>
      {/* excavation / soil wall behind, dark, so the tank reads as sunk in */}
      <mesh position={[0, groundY - 1.1, -3.85]}>
        <boxGeometry args={[LEN + 6, 2.4, 0.1]} />
        <meshStandardMaterial color="#2a2d32" metalness={0} roughness={1} />
      </mesh>
    </group>
  );
}

/* the measured-delta callout on the model during a fill — the ONE place
   a status tint touches the 3D */
function DeltaBadge({
  fillFrac,
  delta,
}: {
  fillFrac: number;
  delta: number | null;
}) {
  if (delta == null) return null;
  const y = -R + WALL + (2 * R - 2 * WALL) * fillFrac;
  return (
    <Html position={[LEN / 2 + 0.15, y, 0]} distanceFactor={6} center>
      <div
        style={{
          background: "#B3261E",
          color: "#fff",
          padding: "4px 9px",
          borderRadius: 4,
          fontSize: 13,
          fontWeight: 800,
          fontFamily: "'Space Grotesk', sans-serif",
          whiteSpace: "nowrap",
          boxShadow: "0 6px 18px rgba(0,0,0,.35)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        +{fmt(delta)} L measured
      </div>
    </Html>
  );
}

/* the pre-fill reference line, shown during a fill */
function ReferenceLine({ frac }: { frac: number | null }) {
  if (frac == null) return null;
  const y = -R + WALL + (2 * R - 2 * WALL) * frac;
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[LEN - WALL * 2, 2 * (R - WALL)]} />
      <meshBasicMaterial
        color="#B3261E"
        transparent
        opacity={0.18}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* gently sway the camera across the front of the tank — a slow arc, clamped
   so the cutaway never rotates out of view. Snaps to a fixed 3/4 view under
   reduced motion. */
function SwayRig() {
  const reduced = prefersReducedMotion();
  const radius = Math.hypot(3.4, 4.6); // keep the initial framing distance
  const height = 3.6;
  useFrame((state) => {
    const cam = state.camera;
    const base = 0.62; // centre azimuth (front-right 3/4 view), radians
    const amp = reduced ? 0 : 0.28; // gentle sway amplitude
    const a = base + Math.sin(state.clock.elapsedTime * 0.12) * amp;
    cam.position.x = Math.sin(a) * radius;
    cam.position.z = Math.cos(a) * radius;
    cam.position.y = height;
    cam.lookAt(0, -0.1, 0);
  });
  return null;
}

function Scene({
  fillFrac,
  preFillFrac,
  delta,
}: {
  fillFrac: number;
  preFillFrac: number | null;
  delta: number | null;
}) {
  return (
    <>
      {/* studio monochrome lighting: strong key + soft fill + rim, plus a
          dedicated fill aimed into the cutaway so the diesel reads */}
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[4, 7, 5]}
        intensity={2.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-6, 4, -2]} intensity={0.7} />
      <directionalLight position={[0, 3, 7]} intensity={0.9} />
      {/* soft light dropped into the open front of the tank to lift the fuel */}
      <pointLight position={[1.5, 1.2, 2.2]} intensity={0.9} distance={8} decay={2} />

      {/* baked, in-code environment — no HDRI download. Sells the steel. */}
      <Environment resolution={128} background={false}>
        <mesh scale={40}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial side={THREE.BackSide} color="#2c3138" />
        </mesh>
        <mesh position={[3, 6, 3]} scale={8}>
          <planeGeometry />
          <meshBasicMaterial color="#f2f4f7" />
        </mesh>
        <mesh position={[-6, 3, -3]} scale={6}>
          <planeGeometry />
          <meshBasicMaterial color="#9aa1a8" />
        </mesh>
        <mesh position={[0, 2, 6]} scale={7}>
          <planeGeometry />
          <meshBasicMaterial color="#c7ccd2" />
        </mesh>
      </Environment>

      <group position={[0, 0.1, 0]}>
        <Slab />
        {/* the tank is tilted a touch on its long axis so the camera looks
            down INTO the cutaway and sees the fuel surface, not just the rim */}
        <group rotation={[0, 0, 0]}>
          <SteelTank />
          <Fuel fillFrac={fillFrac} />
          <Probe fillFrac={fillFrac} />
          <ReferenceLine frac={preFillFrac} />
          <DeltaBadge fillFrac={fillFrac} delta={delta} />
        </group>
      </group>

      <ContactShadows
        position={[0, -R - 0.04, 0]}
        opacity={0.5}
        scale={9}
        blur={2.6}
        far={4}
        resolution={512}
        color="#000000"
      />

      {/* A slow, restrained sway across the FRONT of the tank — never a full
          spin, so the cutaway always faces the viewer. Azimuth is clamped and
          gently oscillated; feels like a display model turning on a desk. */}
      <SwayRig />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableRotate={false}
        target={[0, -0.1, 0]}
        enableDamping
        dampingFactor={0.06}
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
  const [failed, setFailed] = useState(false);
  const fillFrac = Math.max(0.01, Math.min(1, level / CAP));
  const preFillFrac =
    preFillLevel != null ? Math.max(0.01, Math.min(1, preFillLevel / CAP)) : null;

  if (failed) return null; // OwnerView shows the 2D silhouette fallback

  return (
    <div
      style={{
        width: "100%",
        height: 340,
        borderRadius: 6,
        overflow: "hidden",
        background:
          "linear-gradient(180deg, #3a4048 0%, #262b31 55%, #1b1f24 100%)",
      }}
    >
      <Canvas
        shadows
        dpr={[1, 1.75]}
        gl={{ antialias: true, localClippingEnabled: true }}
        camera={{ position: [3.4, 3.6, 4.6], fov: 40 }}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true;
        }}
        onError={() => setFailed(true)}
      >
        <Suspense fallback={null}>
          <Scene
            fillFrac={fillFrac}
            preFillFrac={preFillFrac}
            delta={deltaLitres ?? null}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
