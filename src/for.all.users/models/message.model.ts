export interface IMessage {
    message: string;
    messageId?: string; /** using string because in DB used big integer for identifier */
    messageDate?: string;
    senderId: number;
    isConsidered?: boolean;
}
