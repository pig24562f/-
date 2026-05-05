import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { io, Socket } from 'socket.io-client';
import { PlayerState, VoxelData } from '../types';

export class Engine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private world: CANNON.World;
  private socket: Socket | null = null;
  private players: Map<string, THREE.Group> = new Map();
  private localPlayerId: string = '';
  private voxelInstances: THREE.InstancedMesh | null = null;
  private voxels: VoxelData[] = [];
  
  // Physics bodies
  private playerBody: CANNON.Body;
  private playerMesh: THREE.Group;
  
  // Controls
  private keys: Record<string, boolean> = {};
  private mouse = new THREE.Vector2();
  private pitch = new THREE.Object3D();
  private yaw = new THREE.Object3D();
  
  private isLocked = false;
  private moveSpeed = 15;
  private jumpForce = 8;
  private canJump = false;

  private onStateUpdate: (state: any) => void;

  constructor(container: HTMLElement, onStateUpdate: (state: any) => void) {
    this.onStateUpdate = onStateUpdate;
    
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
    this.scene.fog = new THREE.Fog(0x87ceeb, 20, 100);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    // Physics setup
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -19.6, 0)
    });

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(50, 100, 50);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    this.scene.add(sun);

    // Initial Floor (Physics only for now, visuals via voxels later)
    const groundMat = new CANNON.Material('ground');
    const groundBody = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Plane(),
        material: groundMat
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(groundBody);

    // Grid Visual
    const grid = new THREE.GridHelper(100, 100, 0x000000, 0x000000);
    (grid.material as THREE.Material).opacity = 0.2;
    (grid.material as THREE.Material).transparent = true;
    this.scene.add(grid);

    // Player Physics Body
    const playerMat = new CANNON.Material('player');
    this.playerBody = new CANNON.Body({
      mass: 70,
      shape: new CANNON.Box(new CANNON.Vec3(0.4, 0.9, 0.4)),
      fixedRotation: true,
      material: playerMat
    });
    this.playerBody.position.set(0, 5, 0);
    this.world.addBody(this.playerBody);

    // Contact material
    const contact = new CANNON.ContactMaterial(groundMat, playerMat, {
        friction: 0.1,
        restitution: 0
    });
    this.world.addContactMaterial(contact);

    // Camera rig
    this.yaw.add(this.pitch);
    this.pitch.add(this.camera);
    this.scene.add(this.yaw);
    
    this.playerMesh = new THREE.Group(); // Visual representation if seen by others

    this.setupEvents();
    this.animate();
  }

  public connect(roomId: string, name: string) {
    this.socket = io({
        path: '/socket.io'
    });

    this.socket.on('connect', () => {
        this.localPlayerId = this.socket!.id!;
        this.socket!.emit('join-room', { roomId, playerInfo: { name } });
    });

    this.socket.on('room-state', (state) => {
        this.voxels = state.map || [];
        this.updateVoxelVisuals();
        this.updatePlayers(state.players);
    });

    this.socket.on('player-joined', (p) => this.addOtherPlayer(p));
    this.socket.on('player-updated', (p) => this.handlePlayerUpdate(p));
    this.socket.on('player-left', (id) => this.removePlayer(id));
    this.socket.on('remote-action', (action) => {
        if (action.type === 'hit') {
            const victim = this.players.get(action.targetId);
            if (victim) this.spawnBlood(victim.position.clone().add(new THREE.Vector3(0, 1, 0)));
        }
    });
  }

  private setupEvents() {
    window.addEventListener('keydown', (e) => this.keys[e.code] = true);
    window.addEventListener('keyup', (e) => this.keys[e.code] = false);

    window.addEventListener('mousemove', (e) => {
      if (!this.isLocked) return;
      const sensitivity = 0.002;
      this.yaw.rotation.y -= e.movementX * sensitivity;
      this.pitch.rotation.x -= e.movementY * sensitivity;
      this.pitch.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.pitch.rotation.x));
    });

    this.playerBody.addEventListener('collide', (e: any) => {
        // Simple jump reset
        if (e.contact.ni.y > 0.5) this.canJump = true;
    });

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  public lockPointer() {
    this.renderer.domElement.requestPointerLock();
    this.isLocked = true;
    // listener for unlock
    document.addEventListener('pointerlockchange', () => {
        this.isLocked = document.pointerLockElement === this.renderer.domElement;
    });
  }

  private addOtherPlayer(p: PlayerState) {
    if (p.id === this.localPlayerId) return;
    if (this.players.has(p.id)) return;
    
    const group = new THREE.Group();
    // Voxel Character style
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
    head.position.y = 1.6;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.0, 0.4), new THREE.MeshStandardMaterial({ color: 0x0000ff }));
    body.position.y = 0.9;
    group.add(head, body);

    // Nametag
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(p.name || 'Player', 128, 44);
    
    const tex = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.y = 2.2;
    sprite.scale.set(1, 0.25, 1);
    group.add(sprite);
    
    this.scene.add(group);
    this.players.set(p.id, group);
  }

  private handlePlayerUpdate(p: PlayerState) {
    const mesh = this.players.get(p.id);
    if (mesh) {
        mesh.position.set(p.pos[0], p.pos[1], p.pos[2]);
        mesh.rotation.set(0, p.rot[1], 0); // Only yaw for player mesh
    }
  }

  private removePlayer(id: string) {
    const mesh = this.players.get(id);
    if (mesh) {
        this.scene.remove(mesh);
        this.players.delete(id);
    }
  }

  private updatePlayers(players: Record<string, PlayerState>) {
    Object.values(players).forEach(p => this.addOtherPlayer(p));
  }

  private updateVoxelVisuals() {
    if (this.voxelInstances) {
        this.scene.remove(this.voxelInstances);
        this.voxelInstances.dispose();
    }

    if (this.voxels.length === 0) return;

    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    this.voxelInstances = new THREE.InstancedMesh(geo, mat, this.voxels.length);
    
    const dummy = new THREE.Object3D();
    this.voxels.forEach((v, i) => {
        dummy.position.set(v.pos[0], v.pos[1], v.pos[2]);
        dummy.updateMatrix();
        this.voxelInstances!.setMatrixAt(i, dummy.matrix);
    });

    this.scene.add(this.voxelInstances);

    // Also update physics for voxels? 
    // Ideally we'd use a heightmap or optimized shapes but for this demo:
    // This is skipped for now to focus on movement.
  }

  private updateMovement(delta: number) {
    if (!this.isLocked) return;

    const direction = new THREE.Vector3();
    if (this.keys['KeyW']) direction.z -= 1;
    if (this.keys['KeyS']) direction.z += 1;
    if (this.keys['KeyA']) direction.x -= 1;
    if (this.keys['KeyD']) direction.x += 1;

    direction.applyQuaternion(this.yaw.quaternion);
    direction.normalize();

    this.playerBody.velocity.x = direction.x * this.moveSpeed;
    this.playerBody.velocity.z = direction.z * this.moveSpeed;

    if (this.keys['Space'] && this.canJump) {
        this.playerBody.velocity.y = this.jumpForce;
        this.canJump = false;
    }

    // Update camera rig position from physics
    this.yaw.position.copy(this.playerBody.position as any);
    
    // Sync with server (throttled would be better)
    if (this.socket) {
        this.socket.emit('update-player', {
            pos: [this.playerBody.position.x, this.playerBody.position.y, this.playerBody.position.z],
            rot: [this.pitch.rotation.x, this.yaw.rotation.y, 0]
        });
    }
  }

  public placeVoxel() {
    // Combat check first!
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    
    // Check for players first
    const playerMeshes = Array.from(this.players.values());
    const playerHits = raycaster.intersectObjects(playerMeshes, true);
    
    if (playerHits.length > 0 && playerHits[0].distance < 3) {
        // Find which player was hit
        for (const [id, group] of this.players.entries()) {
            if (group.getObjectById(playerHits[0].object.id) || group.id === playerHits[0].object.id) {
                this.socket?.emit('player-action', { type: 'hit', targetId: id });
                this.spawnBlood(playerHits[0].point);
                return;
            }
        }
    }

    const intersects = raycaster.intersectObjects(this.scene.children);
    if (intersects.length > 0) {
        const intersect = intersects[0];
        const pos = intersect.point.clone().add(intersect.face!.normal.clone().multiplyScalar(0.5));
        const gridPos: [number, number, number] = [
            Math.round(pos.x),
            Math.round(pos.y),
            Math.round(pos.z)
        ];
        
        this.voxels.push({ pos: gridPos, type: 'default' });
        this.updateVoxelVisuals();
        this.socket?.emit('map-change', this.voxels);
    } else {
        // Just place in front
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.getWorldQuaternion(new THREE.Quaternion()));
        const pos = this.camera.getWorldPosition(new THREE.Vector3()).add(dir.multiplyScalar(4));
        const gridPos: [number, number, number] = [
            Math.round(pos.x),
            Math.round(pos.y),
            Math.round(pos.z)
        ];
        this.voxels.push({ pos: gridPos, type: 'default' });
        this.updateVoxelVisuals();
        this.socket?.emit('map-change', this.voxels);
    }
  }

  private spawnBlood(pos: THREE.Vector3) {
    const count = 10;
    const geo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const mat = new THREE.MeshBasicMaterial({ color: 0x990000 });
    
    for (let i = 0; i < count; i++) {
        const p = new THREE.Mesh(geo, mat);
        p.position.copy(pos);
        this.scene.add(p);
        
        const vel = new THREE.Vector3(
            (Math.random() - 0.5) * 5,
            Math.random() * 5,
            (Math.random() - 0.5) * 5
        );
        
        // Simple particle animation
        const startTime = Date.now();
        const anim = () => {
             const elapsed = (Date.now() - startTime) / 1000;
             if (elapsed > 1) {
                 this.scene.remove(p);
                 return;
             }
             p.position.add(vel.clone().multiplyScalar(0.016));
             vel.y -= 9.8 * 0.016; // gravity
             requestAnimationFrame(anim);
        };
        anim();
    }
  }

  public removeVoxel() {
     const raycaster = new THREE.Raycaster();
     raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
     const intersects = raycaster.intersectObjects(this.voxelInstances ? [this.voxelInstances] : []);
     
     if (intersects.length > 0) {
         const index = (intersects[0] as any).instanceId;
         if (index !== undefined) {
             this.voxels.splice(index, 1);
             this.updateVoxelVisuals();
             this.socket?.emit('map-change', this.voxels);
         }
     }
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    const delta = 1 / 60;
    
    this.world.step(delta);
    this.updateMovement(delta);
    
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    this.socket?.disconnect();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    // remove events...
  }
}
