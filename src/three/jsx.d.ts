// React Three Fiber declares its elements on the global JSX namespace; React 19's types read React.JSX.
import type {ThreeElements} from '@react-three/fiber';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
