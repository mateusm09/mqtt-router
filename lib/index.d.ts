/// <reference types="node" />
import { MqttClient } from 'mqtt';
export declare function initMqttClient(host: string, port?: number, clientId?: string, username?: string, password?: string): Promise<MqttClient>;
interface IRouteCallback {
    (message: Buffer, params?: any, context?: any): void;
}
export declare class MqttRouter {
    private mqttClient;
    private context;
    private topicListeners;
    constructor(client: MqttClient, context?: any);
    /** @description callback that is called when any MQTT message arrives */
    private onMessage;
    /**
     * @description subscribe to a MQTT topic, it's possible to use route params like express
     * @param topicName topic you are subscribing
     * @param listener listener callback, it will be called when a message arrives in this topic
     */
    topic(_topicName: string, listener: IRouteCallback): void;
    removeListeners(): void;
    removeListener(topic: string, listener: IRouteCallback): void;
}
export {};
