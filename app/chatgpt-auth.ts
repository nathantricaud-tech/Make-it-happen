// Standalone app: never trust external identity headers.
export async function getChatGPTUser():Promise<{userId:string;email:string;fullName:string|null}|null>{return null;}
