import queryString from 'query-string';
import { window, location } from 'global';

import { name, version } from '../package.json';

const OLD_INIT = 'init';
const OLD_INIT_DATA = 'initData';
const OLD_READY = 'ready';
const OLD_SEND_TO_CHAT = 'sendToChat';
const OLD_SEND_TO_SHARE = 'sendToShare';
const OLD_CLOSE_WIDGET = 'closeWebview';

const deprecation = name =>
  `This event name is deprecated and likely will be removed in the future versions. Please use ${name} instead!`;

const INIT = '@osome/init';
const INIT_DATA = '@osome/initData';
const READY = '@osome/ready';
const SEND_TO_CHAT = '@osome/sendToChat';
const SEND_TO_SHARE = '@osome/sendToShare';
const CLOSE_WIDGET = '@osome/closeWebview';

const iframeWarn = () =>
  console.warn('This event could be sent only from iframe');

const parentWarn = () =>
  console.warn('This event could be sent only from parent');

class Channel {
  handlers = {};

  on = (event, cb) => {
    if (!this.handlers[event]) this.handlers[event] = [];
    if (!this.handlers[event].includes(cb)) this.handlers[event].push(cb);
  }

  off = (event, cb) => {
    const handlers = this.handlers[event];
    if (!handlers) return;
    const i = handlers.indexOf(cb);
    if (i >= 0) handlers.splice(i, 1);
  }

  emit = (event, payload) => {
    const handlers = this.handlers[event];
    if (!handlers) return;
    for (const cb of handlers) cb(payload);
  }

  _peer = null;

  _isWidget = false;

  _initCb = () => {};

  _initDataCb = () => {};

  _readyCb = () => {};

  _dataCb = data => console.info('data', data);

  _shareCb = data => console.info('share', data);

  _closeCb = () => console.info('close');

  initData = null;

  constructor({ peer, isWidget }) {
    this._peer = peer;
    this._isWidget = isWidget;

    window.addEventListener('message', this._handleMessageParse);
    window.versions = window.versions || {};
    window.versions.channel = `${name}@${version} (${
      this._isWidget ? 'widget' : 'parent'
    })`;

    this.initData = queryString.parse(location.search);
    window.channel = {
      setTransport: this.setTransport,
      passMessage: this.passMessage,
    };
  }

  unsubscribe = () => {
    window.removeEventListener('message', this._handleMessageParse);
  };

  _transport = data =>
    this._peer.postMessage(JSON.stringify(data), '*') || true;

  _overrideTransport = cb => {
    this._transport = data => cb(JSON.stringify(data)) || true;
  };

  _handleMessageParse = event => {
    try {
      const data =
        typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      this._handleMessage({ data });
    } catch (err) {
      console.warn(err, event);
    }
  };

  _handleMessage = ({ data: { event, payload } }) => {
    const handler = {
      [OLD_INIT]: this._initCb,
      [OLD_READY]: this._readyCb,
      [OLD_SEND_TO_CHAT]: this._dataCb,
      [OLD_SEND_TO_SHARE]: this._shareCb,
      [OLD_CLOSE_WIDGET]: this._closeCb,
      [OLD_INIT_DATA]: this._initDataCb,

      // TODO: don't invoke events twice
      // [INIT]: this._initCb,
      // [READY]: this._readyCb,
      // [SEND_TO_CHAT]: this._dataCb,
      // [SEND_TO_SHARE]: this._shareCb,
      // [CLOSE_WIDGET]: this._closeCb,
      // [INIT_DATA]: this._initDataCb,
    }[event];
    if (handler) return handler(payload);
    return this.emit(event, payload);
  }

  sendInit = () =>
    (this._isWidget &&
      this._transport({ event: INIT }) &&
      this._transport({ event: OLD_INIT, warning: deprecation(INIT) })) ||
    iframeWarn();

  sendReady = () =>
    (this._isWidget &&
      this._transport({ event: READY }) &&
      this._transport({ event: OLD_READY, warning: deprecation(READY) })) ||
    iframeWarn();

  sendToChat = payload =>
    (this._isWidget &&
      this._transport({ event: SEND_TO_CHAT, payload }) &&
      this._transport({
        event: OLD_SEND_TO_CHAT,
        payload,
        warning: deprecation(SEND_TO_CHAT),
      })) ||
    iframeWarn();

  sendEvent = (event, payload) =>
    this._isWidget
      ? this._transport({ event, payload })
      : iframeWarn();

  shareData = payload =>
    (this._isWidget &&
      this._transport({ event: SEND_TO_SHARE, payload }) &&
      this._transport({
        event: OLD_SEND_TO_SHARE,
        payload,
        warning: deprecation(SEND_TO_SHARE),
      })) ||
    iframeWarn();

  sendClose = () =>
    (this._isWidget &&
      this._transport({ event: CLOSE_WIDGET }) &&
      this._transport({
        event: OLD_CLOSE_WIDGET,
        warning: deprecation(CLOSE_WIDGET),
      })) ||
    iframeWarn();

  sendInitData = payload =>
    (!this._isWidget &&
      this._transport({ event: INIT_DATA, payload }) &&
      this._transport({
        event: OLD_INIT_DATA,
        payload,
        warning: deprecation(INIT_DATA),
      })) ||
    parentWarn();

  onInit = cb => {
    if (this._isWidget) {
      iframeWarn();
      return;
    }
    this._initCb = cb;
  };

  onReady = cb => {
    if (this._isWidget) {
      iframeWarn();
      return;
    }
    this._readyCb = cb;
  };

  onChatData = cb => {
    if (this._isWidget) {
      iframeWarn();
      return;
    }
    this._dataCb = cb;
  };

  onShareData = cb => {
    if (this._isWidget) {
      iframeWarn();
      return;
    }
    this._shareCb = cb;
  };

  onClose = cb => {
    if (this._isWidget) {
      iframeWarn();
      return;
    }
    this._closeCb = cb;
  };

  onInitData = (cb, bypassOnInit) => {
    if (!this._isWidget) {
      parentWarn();
      return;
    }
    this._initDataCb = payload => {
      this.initData = {
        ...this.initData,
        ...payload,
      };
      cb(this.initData);
    };
    if (this.initData && !bypassOnInit) {
      this._initDataCb(this.initData);
    }
  };

  setTransport = cb => {
    this._overrideTransport(cb);
    this.sendInit();
  };

  passMessage = data => this._handleMessageParse({ data });
}

let widgetChannel;

export const getWidgetChannel = () => {
  widgetChannel =
    widgetChannel || new Channel({ peer: window.parent, isWidget: true });
  return widgetChannel;
};

export const getParentChannel = iframe =>
  new Channel({ peer: iframe.contentWindow });
