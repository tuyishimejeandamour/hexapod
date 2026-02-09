import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line, Box, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

// Colors matching the reference image (Dark Grey + Red Accents)
const BODY_COLOR = "#2d3436"; // Dark grey/black body
const SERVO_COLOR = "#d63031"; // Red anodized joints (the red rings in the photo)
const BRACKET_COLOR = "#636e72"; // Dark metallic grey for brackets
const ROD_COLOR = "#2d3436"; // Dark grey rod
const FOOT_COLOR = "#1e272e"; // Black rubber foot tip
const GROUND_COLOR = "#1a2a3a";
const PAPER_BG_COLOR = "#0d1520";

// Helper to calculate orientation and length
const useSegmentCalculations = (start, end) => {
    return useMemo(() => {
        const midPoint = [
            (start[0] + end[0]) / 2,
            (start[1] + end[1]) / 2,
            (start[2] + end[2]) / 2
        ];

        const direction = new THREE.Vector3(
            end[0] - start[0],
            end[1] - start[1],
            end[2] - start[2]
        );
        const length = direction.length();

        const quaternion = new THREE.Quaternion();
        if (length > 0.001) {
            quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
        }

        return { midPoint, quaternion, length };
    }, [start, end]);
};

// Coxa: Short segment, mostly a servo horn/bracket
const CoxaSegment = ({ start, end }) => {
    const { midPoint, quaternion, length } = useSegmentCalculations(start, end);

    if (length < 0.1) return null;

    return (
        <group position={midPoint} quaternion={quaternion}>
            {/* Main Bracket/Servo housing */}
            <Box args={[4, length, 6]} position={[0, 0, 0]}>
                <meshStandardMaterial color={SERVO_COLOR} />
            </Box>
            {/* Top detail */}
            <Box args={[5, 2, 5]} position={[0, length / 2, 0]}>
                <meshStandardMaterial color={BRACKET_COLOR} />
            </Box>
        </group>
    );
};

// Femur: The thigh, distinct servo/bracket structure
const FemurSegment = ({ start, end }) => {
    const { midPoint, quaternion, length } = useSegmentCalculations(start, end);

    if (length < 0.1) return null;

    return (
        <group position={midPoint} quaternion={quaternion}>
            {/* Main Arm Structure (Bracket) */}
            <Box args={[3, length, 8]} position={[0, 0, 0]}>
                <meshStandardMaterial color={BRACKET_COLOR} />
            </Box>

            {/* Servo visuals at ends (simulated) */}
            <Box args={[5, 12, 6]} position={[0, length / 2 - 6, 0]}>
                <meshStandardMaterial color={SERVO_COLOR} />
            </Box>
            <Box args={[5, 12, 6]} position={[0, -length / 2 + 6, 0]}>
                <meshStandardMaterial color={SERVO_COLOR} />
            </Box>
        </group>
    );
};

// Tibia: The lower leg, upper mechanical part, lower rod part
const TibiaSegment = ({ start, end }) => {
    const { midPoint, quaternion, length } = useSegmentCalculations(start, end);

    // Split tibia into upper mechanical part (30%) and lower rod (70%)
    const mechanicalLen = length * 0.4;
    const rodLen = length * 0.6;

    if (length < 0.1) return null;

    return (
        <group position={midPoint} quaternion={quaternion}>
            {/* Upper Mechanical Part */}
            <group position={[0, length / 2 - mechanicalLen / 2, 0]}>
                <Box args={[4, mechanicalLen, 6]}>
                    <meshStandardMaterial color={BRACKET_COLOR} />
                </Box>
                <Box args={[5, 8, 5]} position={[0, mechanicalLen / 2 - 4, 0]}>
                    <meshStandardMaterial color={SERVO_COLOR} />
                </Box>
            </group>

            {/* Lower Rod Part */}
            <group position={[0, -length / 2 + rodLen / 2, 0]}>
                <Cylinder args={[1, 1, rodLen, 8]}>
                    <meshStandardMaterial color={ROD_COLOR} metalness={0.6} roughness={0.2} />
                </Cylinder>
            </group>

            {/* Foot Tip */}
            <group position={[0, -length / 2, 0]}>
                <Cylinder args={[1.5, 0.5, 2, 16]}>
                    <meshStandardMaterial color={FOOT_COLOR} />
                </Cylinder>
            </group>
        </group>
    );
};


// Body plate component (filled hexagon)
const BodyPlate = ({ body }) => {
    const vertices = body?.closedPointsList || [];

    // Create shape from vertices for filled hexagon
    const shape = useMemo(() => {
        if (vertices.length < 3) return null;
        const s = new THREE.Shape();
        s.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length - 1; i++) {
            s.lineTo(vertices[i].x, vertices[i].y);
        }
        s.closePath();
        return s;
    }, [vertices]);

    const avgZ = useMemo(() => {
        if (!vertices.length) return 0;
        return vertices.reduce((sum, v) => sum + v.z, 0) / vertices.length;
    }, [vertices]);

    if (!body || !shape) return null;

    return (
        <group>
            {/* Top face of body plate */}
            <mesh position={[0, 0, avgZ + 2]} rotation={[0, 0, 0]}>
                <shapeGeometry args={[shape]} />
                <meshStandardMaterial
                    color={BODY_COLOR}
                    side={THREE.DoubleSide}
                    metalness={0.5}
                    roughness={0.4}
                />
            </mesh>

            {/* Bottom face */}
            <mesh position={[0, 0, avgZ - 2]} rotation={[0, 0, 0]}>
                <shapeGeometry args={[shape]} />
                <meshStandardMaterial
                    color={BODY_COLOR}
                    side={THREE.DoubleSide}
                    metalness={0.5}
                    roughness={0.4}
                />
            </mesh>

            {/* Body outline/Side walls - simulated by a thick line or we could extrude */}
            <Line
                points={vertices.map(v => [v.x, v.y, avgZ])}
                color="#2a5a8a"
                lineWidth={3}
            />

            {/* Central electronics box (simulated) */}
            <Box args={[40, 40, 15]} position={[0, 0, avgZ - 8]}>
                <meshStandardMaterial color="#2d3436" />
            </Box>
        </group>
    );
};

// Single leg component
const Leg = ({ leg }) => {
    if (!leg || !leg.allPointsList || leg.allPointsList.length < 4) return null;

    const [p0, p1, p2, p3] = leg.allPointsList;

    // Convert points to position arrays
    const pos0 = [p0.x, p0.y, p0.z];
    const pos1 = [p1.x, p1.y, p1.z];
    const pos2 = [p2.x, p2.y, p2.z];
    const pos3 = [p3.x, p3.y, p3.z];

    return (
        <group>
            {/* Segments */}
            <CoxaSegment start={pos0} end={pos1} />
            <FemurSegment start={pos1} end={pos2} />
            <TibiaSegment start={pos2} end={pos3} />
        </group>
    );
};

// Main robot component
const RobotToThree = ({ hexapod }) => {
    const { body, legs } = hexapod || {};

    if (!hexapod) return null;

    return (
        <group>
            {/* Body Plate */}
            <BodyPlate body={body} />

            {/* Legs */}
            {legs && legs.map((leg, i) => (
                <Leg key={i} leg={leg} />
            ))}
        </group>
    );
};

// Main Hexapod3D component
const Hexapod3D = ({ hexapod }) => {
    return (
        <div style={{ width: '100%', height: '100%', background: PAPER_BG_COLOR }}>
            <Canvas camera={{ position: [400, 400, 400], up: [0, 0, 1], fov: 50 }}>
                {/* Lighting */}
                <ambientLight intensity={0.5} />
                <pointLight position={[200, 200, 500]} intensity={1} />
                <directionalLight position={[-100, -200, 200]} intensity={0.8} />

                {/* Robot */}
                <RobotToThree hexapod={hexapod} />

                {/* Ground Plane */}
                <mesh position={[0, 0, -5]} rotation={[0, 0, 0]} receiveShadow>
                    <circleGeometry args={[1000, 64]} />
                    <meshStandardMaterial color={GROUND_COLOR} opacity={0.8} transparent />
                </mesh>

                {/* Grid helper */}
                <gridHelper args={[2000, 40, '#333355', '#222244']} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -4.9]} />

                {/* Controls */}
                <OrbitControls makeDefault />

                {/* Axes Helper */}
                <axesHelper args={[50]} />
            </Canvas>
        </div>
    );
};

export default Hexapod3D;
