import * as THREE from 'three';
import { PlayerControls } from '../types';

export class Player {
  public mesh: THREE.Group;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public isGrounded: boolean = false;
  private jumpCount: number = 0;
  private maxJumps: number = 2;
  private speed: number = 15;
  private jumpForce: number = 12;
  private gravity: number = 30;
  
  // Camera control
  public pitch: number = 0;
  public yaw: number = 0;

  constructor(scene: THREE.Scene) {
    this.mesh = new THREE.Group();
    
    // Simple stylized player: a glowing core
    const geometry = new THREE.IcosahedronGeometry(0.5, 2);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 2,
      wireframe: true
    });
    const core = new THREE.Mesh(geometry, material);
    this.mesh.add(core);

    // Add a small light to the player
    const light = new THREE.PointLight(0x00ffff, 1, 10);
    this.mesh.add(light);

    this.mesh.position.y = 5;
    scene.add(this.mesh);
  }

  private lastJumpPressed: boolean = false;

  public update(delta: number, controls: PlayerControls, platforms: THREE.Object3D[]) {
    // Rotation from controls
    this.yaw -= controls.lookX * 0.05; // Adjusted sensitivity
    this.pitch -= controls.lookY * 0.05;
    this.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.pitch));

    this.mesh.rotation.y = this.yaw;

    // Movement direction
    const moveDir = new THREE.Vector3();
    if (controls.forward) moveDir.z -= 1;
    if (controls.backward) moveDir.z += 1;
    if (controls.left) moveDir.x -= 1;
    if (controls.right) moveDir.x += 1;
    
    moveDir.normalize();
    moveDir.applyQuaternion(this.mesh.quaternion);

    this.velocity.x = moveDir.x * this.speed;
    this.velocity.z = moveDir.z * this.speed;

    // Gravity
    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * delta;
    }

    // Jump logic with double jump
    if (controls.jump && !this.lastJumpPressed) {
      if (this.isGrounded) {
        this.velocity.y = this.jumpForce;
        this.isGrounded = false;
        this.jumpCount = 1;
      } else if (this.jumpCount < this.maxJumps) {
        this.velocity.y = this.jumpForce;
        this.jumpCount++;
      }
    }
    this.lastJumpPressed = controls.jump;

    // Apply velocity
    const nextPos = this.mesh.position.clone().add(this.velocity.clone().multiplyScalar(delta));
    
    // Simple collision detection with platforms
    this.isGrounded = false;
    const playerBox = new THREE.Box3().setFromCenterAndSize(
      nextPos,
      new THREE.Vector3(1, 2, 1)
    );

    for (const platform of platforms) {
      const platformBox = new THREE.Box3().setFromObject(platform);
      if (playerBox.intersectsBox(platformBox)) {
        // If falling and hit top of platform
        if (this.velocity.y <= 0 && this.mesh.position.y >= platformBox.max.y - 0.5) {
          nextPos.y = platformBox.max.y + 1;
          this.velocity.y = 0;
          this.isGrounded = true;
          this.jumpCount = 0;
        } else {
          // Horizontal collision
          nextPos.x = this.mesh.position.x;
          nextPos.z = this.mesh.position.z;
        }
      }
    }

    this.mesh.position.copy(nextPos);

    // Fall off detection
    if (this.mesh.position.y < -20) {
      // Reset or game over logic handled by GameEngine/App
    }
  }
}
