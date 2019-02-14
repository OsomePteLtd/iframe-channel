# Channel

Provides communication between iFrame and parent window (or web app) via postMessage

## Package API

init channel:

```js
import { getWidgetChannel, getParentChannel } from '@osome/channel';

// in widget:
const channel = getWidgetChannel();

// in parent:
const widgetIFrame = document.getElementById('widget-iframe');
const channel = getParentChannel(widgetIFrame);
```

methods & events:

```js
// on widget side:
channel.sendInit();
channel.sendReady();
channel.sendToChat(payload);
channel.sendClose();
channel.onInitData();
const initData = channel.initData;

// on parent side:
channel.onInit(console.log);
channel.onReady(console.log);
channel.onChatData(console.log);
channel.onClose(console.log);
channel.sendInitData();
```

## Channel API

see https://reallyosome.atlassian.net/wiki/spaces/OW/pages/298287171/IFrame+Channel+Format
