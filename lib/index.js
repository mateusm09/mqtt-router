"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MqttRouter = exports.initMqttClient = void 0;
const mqtt_1 = require("mqtt");
const regexp = __importStar(require("path-to-regexp"));
function initMqttClient(host, port, clientId, username, password) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const mqttClient = (0, mqtt_1.connect)({
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
    });
}
exports.initMqttClient = initMqttClient;
function paramToWildcard(topic) {
    const splittedTopic = topic.split('/');
    const mappedTopic = splittedTopic.map((item) => {
        if (item.startsWith(':'))
            return '+';
        return item;
    });
    return mappedTopic.join('/');
}
class MqttRouter {
    constructor(client, context) {
        this.mqttClient = client;
        this.topicListeners = [];
        this.context = context;
        this.mqttClient.on('message', this.onMessage.bind(this));
    }
    /** @description callback that is called when any MQTT message arrives */
    onMessage(topic, message) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < this.topicListeners.length; i++) {
                const item = this.topicListeners[i];
                const regexpResult = item.topicRegexp.exec(topic);
                if (regexpResult) {
                    const params = {};
                    // get params names and associates it's value
                    for (let j = 0; j < item.keys.length; j++) {
                        const key = item.keys[j];
                        params[key.name] = regexpResult[j + 1];
                    }
                    item.listener(message, params, this.context);
                    return;
                }
            }
        });
    }
    /**
     * @description subscribe to a MQTT topic, it's possible to use route params like express
     * @param topicName topic you are subscribing
     * @param listener listener callback, it will be called when a message arrives in this topic
     */
    topic(_topicName, listener) {
        const keys = []; // params names saved
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
    removeListeners() {
        this.mqttClient.removeAllListeners('message');
    }
    removeListener(topic, listener) {
        const listenerIndex = this.topicListeners.findIndex((item) => item.listener.prototype.id === listener.prototype.id);
        if (listenerIndex !== -1)
            this.topicListeners.splice(listenerIndex, 1);
        this.mqttClient.unsubscribe(paramToWildcard(topic));
    }
}
exports.MqttRouter = MqttRouter;
//# sourceMappingURL=index.js.map