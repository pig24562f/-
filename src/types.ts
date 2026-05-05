export interface PlayerState {
  id: string;
  name: string;
  pos: [number, number, number];
  rot: [number, number, number];
  health: number;
}

export interface VoxelData {
  pos: [number, number, number];
  type: string;
}

export interface RoomState {
  players: Record<string, PlayerState>;
  map: VoxelData[];
}
