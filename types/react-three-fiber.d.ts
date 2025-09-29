// react-three-fiber.d.ts
import type { ThreeElements } from '@react-three/fiber';

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

// Also declare the module to ensure it's recognized
declare module '@react-three/fiber' {
  export * from '@react-three/fiber';
}

export {};
