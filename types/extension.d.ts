// Extension Development Patterns
declare global {
  interface ExtensionConfig {
    name: string;
    entryPoint: string;
    permissions: string[];
    version: string;
    author: string;
  }

  interface MountManager {
    mount: (el: HTMLElement, sdk: any) => void;
    unmount: () => void;
  }

  interface ExtensionManifest {
    entrypoints: string[];
    styles: string;
    name: string;
    description: string;
    version: string;
    author: string;
    icon: string;
    permissions: string[];
  }
}

export {}; 