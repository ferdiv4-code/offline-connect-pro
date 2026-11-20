export type NearbyPeer = { id:string; name:string; host:string; port:number; roomCode:string; roomName:string; members:number; maxMembers:number; isPrivate:boolean; seenAt:number };
export type ChatMessage = { id:string; conversationId:string; senderId:string; senderName:string; body:string; type:'text'|'file'|'system'; fileName?:string; fileMime?:string; fileBase64?:string; createdAt:string; mine:boolean };
export type RoomInfo = { id:string; name:string; code:string; hostId:string; hostName:string; host:string; port:number; members:number; maxMembers:number; isPrivate:boolean };
export type NetworkStatus = 'idle'|'discovering'|'hosting'|'connected';
export type WirePacket = { type:string; [key:string]:any };
