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

Channel sends data in stringified JSON:

```json
{
  "event": "event_type",
  "payload": "event_data"
}
```

### Events from iframe to parent:

`init` (optional) - widget's html and js is loaded and widget is ready to receive init data from parent (see `onInit` event in #events-from-parent-to-iframe)

`ready` (required) - widget is ready to be displayed

`sendToChat` - widget sends data for chat. Payload should have:

1. `message` - to be sent to chat **behalf of current user**
2. `data` - should have `widget` field with the widget code and any fields with widget specific information

For example, SSIC Widget will send:

```json
{
  "event": "sendToChat",
  "payload": {
    "message": "46900 - Wholesale trade of a variety of goods without a dominant product;\n62090 - Other information technology and computer service activities",
    "data": {
      "action": "submitCodes",
      "widget": "SSIC",
      "parameters": { "codes": ["46900", "62090"], "ids": [10229, 10408] }
    }
  }
}
```

with the appropriate backend data:

```json
({
  "id": 9679,
  "code": "01492",
  "title": "Bird breeding",
  "name": "Bird breeding, 01492",
  "status": "active"
},
{
  "id": 9680,
  "code": "01493",
  "title": "Crocodile farms",
  "name": "Crocodile farms, 01493",
  "status": "active"
})
```

`closeWebview` - iframe should be closed

### Events from parent to iframe

`initData` (optional) - initial data for widget. `payload` could be : `{"themeColor": "blue"}`

`initData` could also be set by query string: http://localhost:3000/?themeColor=blue (if you send then initData event it will be overridden)

initData is available as `channel.initData`

