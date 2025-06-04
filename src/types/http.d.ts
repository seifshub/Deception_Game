// This file contains type augmentations for Node.js built-in modules
import 'http';

declare module 'http' {
  interface IncomingMessage {
    sessionID?: string;
    session?: any;
    isAuthenticated?: () => boolean;
    logIn?: (user: any, callback: (err: any) => void) => void;
    user?: any;
  }
}
