import * as THREE from 'three';

export class GameEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private onUpdate: (delta: number) => void;

  constructor(container: HTMLElement, onUpdate: (delta: number) => void) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050505);
    this.scene.fog = new THREE.FogExp2(0x050505, 0.01);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();
    this.onUpdate = onUpdate;

    this.setupLights();
    this.setupBackground();
    this.animate();

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private setupBackground() {
    // Grid floor
    const gridHelper = new THREE.GridHelper(2000, 100, 0xff00ff, 0x222222);
    gridHelper.position.y = -10;
    this.scene.add(gridHelper);

    // Distant "mountains"
    const mountainGeom = new THREE.ConeGeometry(100, 200, 4);
    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      wireframe: true,
      emissive: 0x330033,
    });

    for (let i = 0; i < 10; i++) {
      const mountain = new THREE.Mesh(mountainGeom, mountainMat);
      mountain.position.set(
        (Math.random() - 0.5) * 1000,
        -50,
        -500 - Math.random() * 500
      );
      this.scene.add(mountain);
    }

    // Retro Sun
    const sunGeom = new THREE.CircleGeometry(100, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xff5500,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const sun = new THREE.Mesh(sunGeom, sunMat);
    sun.position.set(0, 50, -800);
    this.scene.add(sun);
  }

  private setupLights() {
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 10);
    this.scene.add(directionalLight);
    
    // Add some neon point lights for atmosphere
    const blueLight = new THREE.PointLight(0x00ffff, 2, 50);
    blueLight.position.set(-10, 10, -10);
    this.scene.add(blueLight);

    const pinkLight = new THREE.PointLight(0xff00ff, 2, 50);
    pinkLight.position.set(10, 10, -10);
    this.scene.add(pinkLight);
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate() {
    requestAnimationFrame(this.animate.bind(this));
    const delta = this.clock.getDelta();
    this.onUpdate(delta);
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    this.renderer.dispose();
    // Clean up geometries and materials if needed
  }
}
