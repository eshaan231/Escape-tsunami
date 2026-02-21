import * as THREE from 'three';

export class World {
  public platforms: THREE.Group[] = [];
  private scene: THREE.Scene;
  private lastZ: number = 0;
  private chunkSize: number = 50;
  private renderDistance: number = 300;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    // Initial platforms
    this.generateChunk(0);
    this.generateChunk(this.chunkSize);
  }

  public update(playerZ: number) {
    // Generate new chunks ahead
    if (playerZ < this.lastZ + this.renderDistance) {
      this.generateChunk(this.lastZ - this.chunkSize);
    }

    // Remove old chunks far behind
    this.platforms = this.platforms.filter(chunk => {
      if (chunk.position.z > playerZ + 100) {
        this.scene.remove(chunk);
        return false;
      }
      return true;
    });
  }

  private generateChunk(zOffset: number) {
    const chunk = new THREE.Group();
    chunk.position.z = zOffset;

    const brainrotWords = ['SKIBIDI', 'RIZZ', 'GYATT', 'SIGMA', 'BASED', 'FR FR', 'ON GOD', 'NO CAP'];

    // Create a few platforms in this chunk
    for (let i = 0; i < 5; i++) {
      const width = 5 + Math.random() * 10;
      const depth = 10 + Math.random() * 15;
      const x = (Math.random() - 0.5) * 30;
      const y = (Math.random() - 0.5) * 5;
      const z = (Math.random() - 0.5) * this.chunkSize;

      const geometry = new THREE.BoxGeometry(width, 1, depth);
      
      // Glitchy material
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
        emissive: new THREE.Color().setHSL(Math.random(), 0.7, 0.2),
        roughness: 0.1,
        metalness: 0.8,
      });

      const platform = new THREE.Mesh(geometry, material);
      platform.position.set(x, y, z);
      chunk.add(platform);

      // Floating Brainrot Text
      if (Math.random() > 0.6) {
        const word = brainrotWords[Math.floor(Math.random() * brainrotWords.length)];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = 256;
        canvas.height = 64;
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, 256, 64);
        ctx.font = 'bold 40px monospace';
        ctx.fillStyle = '#ff00ff';
        ctx.textAlign = 'center';
        ctx.fillText(word, 128, 45);
        
        const textTex = new THREE.CanvasTexture(canvas);
        const textMat = new THREE.MeshBasicMaterial({ map: textTex, transparent: true, side: THREE.DoubleSide });
        const textPlane = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), textMat);
        textPlane.position.set(x + (Math.random() - 0.5) * 5, y + 3 + Math.random() * 2, z);
        chunk.add(textPlane);
      }

      // Add Focus Shards
      if (Math.random() > 0.7) {
        const shardGeom = new THREE.OctahedronGeometry(0.3);
        const shardMat = new THREE.MeshStandardMaterial({
          color: 0x00ffff,
          emissive: 0x00ffff,
          emissiveIntensity: 2,
        });
        const shard = new THREE.Mesh(shardGeom, shardMat);
        shard.position.set(x, y + 1.5, z);
        (shard as any).isCollectible = true;
        chunk.add(shard);
      }

      // Add Focus Burst power-ups
      if (Math.random() > 0.95) {
        const burstGeom = new THREE.TorusGeometry(0.4, 0.1, 8, 16);
        const burstMat = new THREE.MeshStandardMaterial({
          color: 0xfff000,
          emissive: 0xfff000,
          emissiveIntensity: 3,
        });
        const burst = new THREE.Mesh(burstGeom, burstMat);
        burst.position.set(x, y + 2, z);
        (burst as any).isPowerUp = true;
        chunk.add(burst);
      }

      // Clickbait Barriers
      if (Math.random() > 0.9) {
        const wallGeom = new THREE.BoxGeometry(30, 10, 1);
        const wallMat = new THREE.MeshStandardMaterial({
          color: 0xff0000,
          emissive: 0xff0000,
          emissiveIntensity: 1,
          transparent: true,
          opacity: 0.7
        });
        const wall = new THREE.Mesh(wallGeom, wallMat);
        wall.position.set(0, 5, z - 5);
        // Create a gap in the wall
        const gapX = (Math.random() - 0.5) * 20;
        // This is a simple implementation, ideally we'd use multiple meshes for the wall parts
        // For now, let's just make it a solid wall that the player must jump over or go around
        chunk.add(wall);
      }

      // Add some "Engagement Traps" - platforms that flicker
      if (Math.random() > 0.8) {
        (platform as any).isTrap = true;
        platform.material.transparent = true;
      }
    }

    this.scene.add(chunk);
    this.platforms.push(chunk);
    this.lastZ = zOffset;
  }

  public getAllPlatformObjects(): THREE.Object3D[] {
    const all: THREE.Object3D[] = [];
    this.platforms.forEach(chunk => {
      chunk.children.forEach(child => all.push(child));
    });
    return all;
  }
}
