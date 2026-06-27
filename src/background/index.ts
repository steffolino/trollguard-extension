import browser from 'webextension-polyfill';

interface ScanRequestMessage {
  type: 'SCAN_REQUEST';
  tabId?: number;
}

interface ScanAckMessage {
  type: 'SCAN_ACK';
}

type IncomingMessage = ScanRequestMessage;
type OutgoingMessage = ScanAckMessage;

browser.runtime.onMessage.addListener(
  (message: unknown, _sender): Promise<OutgoingMessage> | undefined => {
    if (!message || typeof message !== 'object') return undefined;

    const msg = message as Partial<IncomingMessage>;
    if (msg.type === 'SCAN_REQUEST') {
      return Promise.resolve({ type: 'SCAN_ACK' });
    }

    return undefined;
  },
);
