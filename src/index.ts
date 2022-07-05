import { MqttClient, connect } from 'mqtt';
import * as regexp from 'path-to-regexp';

export async function initMqttClient(
    host: string,
    port?: number,
    clientId?: string,
    username?: string,
    password?: string
): Promise<MqttClient> {
    return new Promise((resolve, reject) => {
        const mqttClient = connect({
            host,
            port,
            clientId,
            username,
            password,
        });

        mqttClient.once('connect', () => {
            resolve(mqttClient);
        });
        mqttClient.once('error', (error) => {
            reject(error);
        });
    });
}

function paramToWildcard(topic: string) {
    const splittedTopic = topic.split('/');

    const mappedTopic = splittedTopic.map((item) => {
        if (item.startsWith(':')) return '+';
        return item;
    });

    return mappedTopic.join('/');
}

interface IRouteCallback {
    (message: Buffer, params?: any, context?: any): void;
}

export class MqttRouter {
    private mqttClient: MqttClient;

    private context: any | undefined;

    private topicListeners: Array<{
        keys: regexp.Key[];
        topicRegexp: RegExp;
        listener: IRouteCallback;
    }>;

    constructor(client: MqttClient, context?: any) {
        this.mqttClient = client;
        this.topicListeners = [];
        this.context = context;

        this.mqttClient.on('message', this.onMessage.bind(this));
    }

    /** @description callback that is called when any MQTT message arrives */
    private async onMessage(topic: string, message: Buffer) {
        for (let i = 0; i < this.topicListeners.length; i++) {
            const item = this.topicListeners[i];
            const regexpResult = item.topicRegexp.exec(topic);
            if (regexpResult) {
                const params: any = {};

                // get params names and associates it's value
                for (let j = 0; j < item.keys.length; j++) {
                    const key = item.keys[j];
                    params[key.name] = regexpResult[j + 1];
                }

                item.listener(message, params, this.context);
                return;
            }
        }
    }

    /**
     * @description subscribe to a MQTT topic, it's possible to use route params like express
     * @param topicName topic you are subscribing
     * @param listener listener callback, it will be called when a message arrives in this topic
     */
    public topic(_topicName: string, listener: IRouteCallback) {
        const keys: [] = []; // params names saved

        // checks if the topic has a shared subscription modifier, and replaces it
        // to generate a topic regexp, but subscribes the client with the modifier
        const topicName = _topicName.replace(/\$queue\/|\$share\/.*\//g, '');

        const topicRegexp = regexp.pathToRegexp(topicName, keys); // topic's regex
        const subscribeTopic = paramToWildcard(_topicName); // converts topic params to MQTT + wildcard
        this.mqttClient.subscribe(subscribeTopic);

        // arrow functions doesn't have a prototype,
        // so it we need to create one if the function doesn't have it defined
        // ? this have some uncentainty if it works 100%
        // ? it'll be in this way until I find a better way to do it
        if (!listener.prototype) {
            listener.prototype = {};
        }

        listener.prototype.id = Date.now();

        this.topicListeners.push({
            keys,
            topicRegexp,
            listener,
        });
    }

    public removeListeners() {
        this.mqttClient.removeAllListeners('message');
    }

    public removeListener(topic: string, listener: IRouteCallback) {
        const listenerIndex = this.topicListeners.findIndex(
            (item) => item.listener.prototype.id === listener.prototype.id
        );

        if (listenerIndex !== -1) this.topicListeners.splice(listenerIndex, 1);

        this.mqttClient.unsubscribe(paramToWildcard(topic));
    }
}
