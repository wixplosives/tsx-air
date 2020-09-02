type MessageType = 'root' | 'set' | 'clear' | 'delay' | 'stopDelay' | 'done' | 'log';
interface PartialMessage {
    type: MessageType;
    id?: number;
}
export type Message = Root | Done | AddEndPoint | Clear | Delay | StopDelay;
export type MessageWithUrl = AddEndPoint | Delay;

export interface Delay extends PartialMessage {
    type: 'delay';
    url: string | RegExp;
    delay: number;
}

export interface AddEndPoint extends PartialMessage {
    type: 'set';
    url: string | RegExp;
    content: string;
}

export interface Root extends PartialMessage {
    type: 'root';
    path: string;
}

export interface Done extends PartialMessage {
    type: 'done';
    id: number;
}

export interface Log extends PartialMessage { 
    type: 'log';
    result: 'fail'|'success';
    url: string;
 }

export interface Clear extends PartialMessage {
    type: 'clear';
}

export interface StopDelay extends PartialMessage {
    type: 'stopDelay';
    originalId: number;
}
