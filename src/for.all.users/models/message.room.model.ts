import { IRelationUsers } from './essential.user.data.model';

export  interface IMessageRoomBasic {
    roomId: number;
    roomOwner: number;
    roomTopic: string;
    countMessages: number;
    newMessages: number;
    members: IRelationUsers[];
}
