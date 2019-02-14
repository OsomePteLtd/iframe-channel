import queryString from 'query-string';
import { window, location } from 'global';

import { name, version } from '../package.json';

const INIT = 'init';
const INIT_DATA = 'initData';
const READY = 'ready';
const SEND_TO_CHAT = 'sendToChat';
const CLOSE_WIDGET = 'closeWebview';

const iframeWarn = () =>
  console.warn('This event could be sent only from iframe');

const parentWarn = () =>
  console.warn('This event could be sent only from parent');

const eventErr = eventName => payload => {};

class Channel {
  _peer = null;

  _isWidget = false;

  _initCb = () => {};

  _initDataCb = () => {};

  _readyCb = () => {};

  _dataCb = data => console.info('data', data);

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
  }

  _transport = data =>
    this._peer.postMessage(JSON.stringify(data), '*') || true;

  _handleMessageParse = event => {
    try {
      const data =
        typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      this._handleMessage({ data });
    } catch (err) {
      console.warn(err, event);
    }
  };

  _handleMessage = ({ data: { event, payload } }) =>
    (({
      [INIT]: this._initCb,
      [READY]: this._readyCb,
      [SEND_TO_CHAT]: this._dataCb,
      [CLOSE_WIDGET]: this._closeCb,
      [INIT_DATA]: this._initDataCb,
    }[event] || eventErr(event))(payload));

  sendInit = () =>
    (this._isWidget && this._transport({ event: INIT })) || iframeWarn();

  sendReady = () =>
    (this._isWidget && this._transport({ event: READY })) || iframeWarn();

  sendToChat = payload =>
    (this._isWidget && this._transport({ event: SEND_TO_CHAT, payload })) ||
    iframeWarn();

  sendClose = () =>
    (this._isWidget && this._transport({ event: CLOSE_WIDGET })) ||
    iframeWarn();

  sendInitData = payload =>
    (!this._isWidget && this._transport({ event: INIT_DATA, payload })) ||
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
      this.initData = payload;
      cb(payload);
    };
    if (this.initData && !bypassOnInit) {
      this._initDataCb(this.initData);
    }
  };
}

let widgetChannel;

export const getWidgetChannel = () => {
  widgetChannel =
    widgetChannel || new Channel({ peer: window.parent, isWidget: true });
  return widgetChannel;
};

export const getParentChannel = iframe =>
  new Channel({ peer: iframe.contentWindow });
