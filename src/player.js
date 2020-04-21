import { EMessageId, EBusinessMessageId } from './config';
import eventful from './eventful';

class Player {
  _containerId;

  _container$;

  set containerId(containerId) {
    this._containerId = containerId;
  }

  get containerId() {
    if (this._containerId) {
      return this._containerId;
    } else {
      throw new ReferenceError('this._containerId is not defined.');
    }
  }

  set container$(container$) {
    this._container$ = container$;
  }

  get container$() {
    if (this._container$) {
      return this._container$;
    } else {
      throw new ReferenceError('this._container$ is not defined.');
    }
  }

  static ENDED = 'ended';

  static STATE = 'getPlayerState';

  constructor(containerId, config) {
    eventful(this);
    this.containerId = containerId;
    this.container$ = document.getElementById(this.containerId);
    this.player$ = this._createPlayer(config);
    this.container$.appendChild(this.player$);
    this.init();
  }

  init() {
    window.addEventListener('message', this.handleWndMessage);
  }

  dispose() {
    window.removeEventListener('message', this.handleWndMessage);
    this.player$ = null;
    this.container$ = null;
    this.containerId = null;
  }

  handleWndMessage = (evt) => {
    const { data: evtData } = evt;
    const { messageId, _uuid, data: config } = evtData || {};

    if (_uuid !== this.containerId) {
      return;
    }

    if (messageId === EMessageId.DISPATCH_PLAYER_EVENT) {
      const { eventType, data } = config || {};
      this.emit(eventType, data);
    }
  };

  play = () => {
    this.sendBizMsg(EBusinessMessageId.INVOKE_PLAYER_PLAY);
  };

  pause = () => {
    this.sendBizMsg(EBusinessMessageId.INVOKE_PLAYER_PAUSE);
  };

  getState = () => {
    return new Promise((resolve, reject) => {
      const handler = data => {
        resolve(data);
        this.off(Player.STATE, handler);
      }
      this.on(Player.STATE, handler);
      this.sendBizMsg(EBusinessMessageId.INVOKE_PLAYER_GET_PLAYER_STATE);
    })
  };

  sendBizMsg(messageId, data) {
    this._send('biz_msg', {
      messageId,
      data,
    });
  }

  _send(type, data) {
    const otherWindow = this.player$.contentWindow;
    if (otherWindow && typeof otherWindow.postMessage === 'function') {
      otherWindow.postMessage(
        {
          ...data,
          type,
          _uuid: this.containerId,
        },
        '*'
      );
    }
  }

  _createPlayer(config) {
    const { width, height, resourceId } = config || {};
    const player$ = document.createElement('iframe');
    player$.setAttribute('src', this._getUrl(resourceId));
    player$.setAttribute('style', `width: ${width}px;height: ${height}px;`);
    return player$;
  }

  _getUrl(resourceId) {
    return `http://www.nimo.tv/embed/${resourceId}?_uuid=${this.containerId}`;
  }
}

export default Player;