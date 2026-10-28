declare module 'marzipano' {
  export interface ViewerOptions {
    stage?: {
      progressive?: boolean;
    };
    controls?: {
      mouseViewMode?: string;
    };
  }

  export class Viewer {
    constructor(domElement: HTMLElement, options?: ViewerOptions);
    destroy(): void;
    createScene(params: any): Scene;
    view(): any;
    lookTo(params: { yaw?: number; pitch?: number; fov?: number }, callback?: () => void): void;
  }

  export class ImageUrlSource {
    constructor(source: any);
    static fromString(url: string, options?: any): ImageUrlSource;
  }

  export class EquirectGeometry {
    constructor(levels: Array<{ width: number }>);
  }

  export class RectilinearView {
    constructor(params?: any, limiter?: any);
    static limit: {
      traditional: (maxResolution: number, maxFov: number, minFov?: number) => any;
      letterbox?: () => any;
    };
    setParameters(params: { yaw?: number; pitch?: number; fov?: number }): void;
    yaw(): number;
    pitch(): number;
    fov(): number;
    screenToCoordinates(coords: { x: number; y: number }): { yaw: number; pitch: number };
    coordinatesToScreen(coords: { yaw: number; pitch: number }): { x: number; y: number };
    addEventListener(event: string, callback: (...args: any[]) => void): void;
    removeEventListener(event: string, callback: (...args: any[]) => void): void;
  }

  export class Scene {
    switchTo(options?: { transitionDuration?: number }, callback?: () => void): void;
    hotspotContainer(): HotspotContainer;
    view(): RectilinearView;
  }

  export class HotspotContainer {
    createHotspot(domElement: HTMLElement, coords: { yaw: number; pitch: number }, options?: any): Hotspot;
    destroyHotspot(hotspot: Hotspot): void;
    listHotspots(): Hotspot[];
  }

  export interface Hotspot {
    domElement(): HTMLElement;
    setPosition(coords: { yaw: number; pitch: number }): void;
    position(): { yaw: number; pitch: number };
    destroy(): void;
  }

  const Marzipano: {
    Viewer: typeof Viewer;
    ImageUrlSource: typeof ImageUrlSource;
    EquirectGeometry: typeof EquirectGeometry;
    RectilinearView: typeof RectilinearView;
  };

  export default Marzipano;
}