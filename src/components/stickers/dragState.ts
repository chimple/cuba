// export type StickerId = "snail";

// export const dragState: {
//   dragging: StickerId | null;
//   pos: { x: number; y: number } | null;
// } = {
//   dragging: null,
//   pos: null,
// };

export type StickerId = "snail";
export const dragState: {
  dragging: StickerId | null;
  pos: { x: number; y: number } | null;
  size: { w: number; h: number } | null;
} = {
  dragging: null,
  pos: null,
  size: null,
};
