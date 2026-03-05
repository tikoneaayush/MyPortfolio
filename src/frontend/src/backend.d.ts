import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Message {
    name: string;
    email: string;
    message: string;
}
export interface backendInterface {
    getAllMessages(): Promise<Array<Message>>;
    getAllMessagesByEmail(): Promise<Array<Message>>;
    getVisitorCount(): Promise<bigint>;
    incrementVisitorCount(): Promise<void>;
    submitMessage(name: string, email: string, message: string): Promise<void>;
}
