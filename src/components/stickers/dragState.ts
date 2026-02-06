export type StickerId = "snail" | "butterfly";
export const dragState: {
  dragging: StickerId | null;
  pos: { x: number; y: number } | null;
  size: { w: number; h: number } | null;
} = {
  dragging: null,
  pos: null,
  size: null,
};
