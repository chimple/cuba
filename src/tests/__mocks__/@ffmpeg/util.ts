/* Manual Jest mock for @ffmpeg/util
   - Exports `fetchFile` and `toBlobURL` used by the codebase
   - `fetchFile` returns a Uint8Array (suitable for `ffmpeg.writeFile`)
   - `toBlobURL` is synchronous and returns the provided URL (works for tests)
*/

export const fetchFile = jest.fn(async (input: any) => {
  // If given a Blob/File with arrayBuffer(), use it
  if (input && typeof (input as any).arrayBuffer === "function") {
    const ab = await (input as any).arrayBuffer();
    return new Uint8Array(ab);
  }

  // If already an ArrayBuffer, wrap it
  if (input instanceof ArrayBuffer) return new Uint8Array(input);

  // Default dummy data
  return new Uint8Array([0]);
});

export const toBlobURL = jest.fn((url: string) => url);
