import * as THREE from 'three';

export class Tsunami {
  public mesh: THREE.Mesh;
  public speed: number = 8;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    // A massive wall
    const geometry = new THREE.PlaneGeometry(200, 100, 20, 10);
    
    // Custom shader-like material for the "Brainrot" effect
    const loader = new THREE.TextureLoader();
    const texture = loader.load('https://picsum.photos/seed/brainrot/512/512?blur=1');
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      emissive: 0xff00ff,
      emissiveMap: texture,
      emissiveIntensity: 2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.z = 50; // Start behind the player
    this.mesh.rotation.y = 0;
    
    this.scene.add(this.mesh);
  }

  public update(delta: number, playerZ: number) {
    // Move towards the player
    this.mesh.position.z -= this.speed * delta;
    
    // Scroll texture
    if (this.mesh.material instanceof THREE.MeshStandardMaterial && this.mesh.material.map) {
      this.mesh.material.map.offset.y += delta * 0.5;
      this.mesh.material.map.offset.x += Math.sin(Date.now() * 0.001) * 0.1 * delta;
    }

    // Keep it centered horizontally with the player
    this.mesh.position.x = THREE.MathUtils.lerp(this.mesh.position.x, 0, 0.1);

    // Increase speed over time
    this.speed += 0.01 * delta;

    // Visual glitch effect
    this.mesh.scale.y = 1 + Math.sin(Date.now() * 0.01) * 0.1;
    this.mesh.position.y = Math.sin(Date.now() * 0.005) * 2;
  }

  public checkCollision(playerPos: THREE.Vector3): boolean {
    // If player is behind the tsunami wall
    return playerPos.z > this.mesh.position.z - 2;
  }
}
