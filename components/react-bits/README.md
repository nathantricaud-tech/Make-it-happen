# React Bits components

Source: https://github.com/DavidHDev/react-bits
Commit: 2139cb3098d4fedc6264f13e50dcb4694224ba7c
License: MIT + Commons Clause, full text in LICENSE.md and public/licenses/react-bits.txt. Used as part of Make it happen.

Current integration:
- TextAnimations/TechText: original TS/CSS, Canvas2D. Fixed parent heights; automatic sweep. Used selectively in home, Studio and progress headings.
- Animations/Cubes: original TS/CSS, WebGL2. Local addition: onRenderError callback for missing context/shader. Explicit height, direct pointer events, automatic idle animation and click ripple.
- Backgrounds/ShapeWaves: original TS/CSS with vgpu 0.3.1, matching upstream dependency. Lazy-loaded only on the client. On unsupported WebGPU or rendering failure, app/animation-fallbacks.tsx provides a separate Canvas2D compatibility animation.
- TextAnimations/CountUp: retained for numeric statistics.

Previous BlurText, Magnet, MagnetLines and ClickSpark files are retained as source history but no longer imported by the application. No CSS imitation is substituted for the official components on supported devices. Cubes has a CSS 3D compatibility fallback when WebGL2 is unavailable. Reduced-motion preferences are respected.
