// Phaser type declarations for TypeScript
declare global {
  namespace Phaser {
    interface Game {
      destroy(): void;
      scene: SceneManager;
      scale: ScaleManager;
      sound: SoundManager;
      input: InputManager;
    }

    interface Scene {
      add: GameObjectFactory;
      load: LoaderPlugin;
      physics: Physics;
      input: InputPlugin;
      sound: SoundManager;
      time: TimePlugin;
      scale: ScaleManager;
      destroy(): void;
      restart(): void;
      pause(): void;
      resume(): void;
    }

    interface SceneManager {
      add(key: string, scene: any): void;
      start(key: string, data?: any): void;
      pause(key: string): void;
      resume(key: string): void;
      stop(key: string): void;
    }

    interface GameObjectFactory {
      sprite(x: number, y: number, texture: string): Sprite;
      image(x: number, y: number, texture: string): Image;
      text(x: number, y: number, text: string, style?: any): Text;
      rectangle(x: number, y: number, width: number, height: number, fillColor?: number): Rectangle;
    }

    interface Sprite {
      x: number;
      y: number;
      setScale(scale: number): this;
      setOrigin(x: number, y?: number): this;
      destroy(): void;
    }

    interface Image {
      x: number;
      y: number;
      setScale(scale: number): this;
      setOrigin(x: number, y?: number): this;
      destroy(): void;
    }

    interface Text {
      x: number;
      y: number;
      text: string;
      setOrigin(x: number, y?: number): this;
      destroy(): void;
    }

    interface Rectangle {
      x: number;
      y: number;
      width: number;
      height: number;
      destroy(): void;
    }

    interface LoaderPlugin {
      image(key: string, url: string): this;
      audio(key: string, url: string): this;
      on(event: string, callback: Function): this;
    }

    interface Physics {
      world: World;
    }

    interface World {
      gravity: { x: number; y: number };
    }

    interface InputPlugin {
      keyboard: KeyboardPlugin;
      activePointer: Pointer;
      on(event: string, callback: Function): this;
    }

    interface KeyboardPlugin {
      addKeys(keys: string): any;
      on(event: string, callback: Function): this;
    }

    interface Pointer {
      x: number;
      y: number;
      isDown: boolean;
    }

    interface SoundManager {
      add(key: string): Sound;
      play(key: string, volume?: number): void;
    }

    interface Sound {
      play(volume?: number): void;
      stop(): void;
    }

    interface TimePlugin {
      addEvent(config: any): TimerEvent;
    }

    interface TimerEvent {
      remove(): void;
    }

    interface ScaleManager {
      width: number;
      height: number;
      resize(width: number, height: number): void;
    }

    interface InputManager {
      touch: TouchManager;
    }

    interface TouchManager {
      enabled: boolean;
    }
  }
}

export {};
