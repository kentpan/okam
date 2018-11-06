/**
 * @file Make component support broadcast ability
 * @author sparklewhy@gmail.com
 */

'use strict';

/* eslint-disable fecs-export-on-declare */

import eventCenter from '../helper/eventCenter';

const ONCE_LISTEN_REGEXP = /^(.*)\.once$/;

const broadcastAPIs = {

    /**
     * Send broadcast event
     *
     * @param  {...any} args the broadcast args
     */
    $broadcast(...args) {
        eventCenter.emit.apply(eventCenter, args);
    },

    /**
     * Listen broadcast event
     *
     * @param {string} eventName the event name to broadcast
     * @param {Function} handler the listen handler
     * @param {boolean=} isOnce whether is once listen, optional, by default false
     */
    $onBroadcast(eventName, handler, isOnce) {
        let bindEvents = this._bindBroadcastEvents;
        if (!bindEvents) {
            bindEvents = this._bindBroadcastEvents = [];
        }

        bindEvents.push([eventName, handler]);

        if (isOnce) {
            eventCenter.once(eventName, handler);
        }
        else {
            eventCenter.on(eventName, handler);
        }
    },

    /**
     * Remove broadcast event listener
     *
     * @param {string} eventName the event to remove
     * @param {Function} handler the handler to remove
     */
    $offBroadcast(eventName, handler) {
        eventCenter.off(eventName, handler);
    },

    /**
     * Bind the declaration broadcast events
     *
     * @private
     */
    __bindBroadcastEvents() {
        let events = this.$rawBroadcastEvents;
        if (typeof events === 'function') {
            events = this.$rawBroadcastEvents = events();
        }

        if (!events) {
            return;
        }

        let bindEvents = this._bindBroadcastEvents;
        if (!bindEvents) {
            bindEvents = this._bindBroadcastEvents = [];
        }

        Object.keys(events).forEach(k => {
            let result = ONCE_LISTEN_REGEXP.exec(k);
            let eventName = result ? result[1] : k;
            let handler = events[k].bind(this);
            bindEvents.push([eventName, handler]);

            if (result) {
                eventCenter.once(eventName, handler);
            }
            else {
                eventCenter.on(eventName, handler);
            }
        });
        this._bindBroadcastEvents = bindEvents;
    },

    /**
     * Remove the bind broadcast events
     *
     * @private
     */
    __removeBroadcastEventListeners() {
        let bindEvents = this._bindBroadcastEvents;
        if (!bindEvents) {
            return;
        }

        bindEvents.forEach(item => eventCenter.off(item[0], item[1]));
        this._bindBroadcastEvents = [];
    }
};

export default {
    app: Object.assign({

        /**
         * The hook when app launch
         *
         * @private
         */
        onLaunch() {
            this.__bindBroadcastEvents();
        }
    }, broadcastAPIs),

    component: {

        /**
         * The instance initialization before the instance is normalized and created.
         *
         * @param {boolean} isPage whether is page component
         * @private
         */
        $init(isPage) {
            let events = this.broadcastEvents;
            if (events) {
                this.$rawBroadcastEvents = isPage ? events : () => events;
                delete this.broadcastEvents;
            }
        },

        /**
         * The hook when component created
         *
         * @private
         */
        created() {
            this.__bindBroadcastEvents();
        },

        /**
         * The hook when component detached
         *
         * @private
         */
        detached() {
            this.__removeBroadcastEventListeners();
        },

        methods: broadcastAPIs
    }
};
