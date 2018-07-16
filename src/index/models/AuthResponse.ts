export interface AuthResponse {
    result: boolean;
    accessToken: string;
    expire: number;
    username: string;
    type: string;
    id: number;
    avatar: string;
    data?: string;
}
