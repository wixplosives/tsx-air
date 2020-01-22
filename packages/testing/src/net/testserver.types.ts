type MessageType = 'root' | 'set' | 'clear' | 'delay' | 'stopDelay' | 'done';
interface IPartialMessage {
    type: MessageType;
    id?: number;
}
export type Message = Root | Done | AddEndPoint | Clear | Delay | StopDelay;
export type MessageWithUrl = AddEndPoint | Delay;

export interface Delay extends IPartialMessage {
    type: 'delay';
    url: string | RegExp;
    delay: number;
}

export interface AddEndPoint extends IPartialMessage {
    type: 'set';
    url: string | RegExp;
    content: string;
}

export interface Root extends IPartialMessage {
    type: 'root';
    path: string;
}

export interface Done extends IPartialMessage {
    type: 'done';
    id: number;
}



export interface Clear extends IPartialMessage {
    type: 'clear';
}

export interface StopDelay extends IPartialMessage {
    type: 'stopDelay';
    originalId: number;
}
