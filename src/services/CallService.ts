import {
  mediaDevices,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription
} from 'react-native-webrtc';
import { lanNetwork } from './LanNetwork';

// Calls are intentionally LAN-only. Host candidates are sufficient when both
// devices can reach one another on the same local network.
const config = { iceServers: [] as any[] };

type CallKind = 'audio' | 'video';
type CallState = {
  peerId: string;
  peerName: string;
  kind: CallKind;
  incoming: boolean;
};

class CallService {
  private pc: RTCPeerConnection | null = null;
  private local: any = null;
  private remote: any = null;
  private current: CallState | null = null;
  private pendingCandidates: any[] = [];
  private onChange: (state: any) => void = () => {};

  setListener(fn: (state: any) => void) {
    this.onChange = fn;
  }

  get streams() {
    return { local: this.local, remote: this.remote };
  }

  get state() {
    return this.current;
  }

  private publish(status: string, extra: Record<string, any> = {}) {
    this.onChange({
      status,
      ...(this.current || {}),
      local: this.local,
      remote: this.remote,
      ...extra
    });
  }

  async start(peerId: string, peerName: string, kind: CallKind) {
    if (!peerId) throw new Error('The other phone could not be identified. Reopen the chat and try again.');
    if (this.current) this.end(false);

    this.current = { peerId, peerName, kind, incoming: false };
    this.pendingCandidates = [];
    this.publish('preparing');

    try {
      await this.setup(kind);
      const offer = await this.pc!.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: kind === 'video'
      });
      await this.pc!.setLocalDescription(offer);
      lanNetwork.send({
        type: 'signal',
        to: peerId,
        signal: { type: 'offer', sdp: offer.sdp, kind }
      });
      this.publish('ringing');
    } catch (error) {
      this.end(false);
      throw error;
    }
  }

  async accept(peerId: string, peerName: string, kind: CallKind, offer: any) {
    if (!offer?.sdp) throw new Error('The incoming call offer is incomplete. Ask the caller to try again.');
    if (this.current) this.end(false);

    this.current = { peerId, peerName, kind, incoming: true };
    // Keep ICE candidates received while the incoming-call screen was opening.
    this.publish('preparing');

    try {
      await this.setup(kind);
      await this.pc!.setRemoteDescription(
        new RTCSessionDescription({ type: 'offer', sdp: offer.sdp })
      );
      await this.flushCandidates();
      const answer = await this.pc!.createAnswer();
      await this.pc!.setLocalDescription(answer);
      lanNetwork.send({
        type: 'signal',
        to: peerId,
        signal: { type: 'answer', sdp: answer.sdp }
      });
      this.publish('connecting');
    } catch (error) {
      this.end(false);
      throw error;
    }
  }


  private async setup(kind: CallKind) {
    this.local = await mediaDevices.getUserMedia({
      audio: true,
      video: kind === 'video'
        ? { facingMode: 'user', width: 640, height: 480, frameRate: 24 }
        : false
    });

    this.pc = new RTCPeerConnection(config);
    this.local.getTracks().forEach((track: any) => {
      this.pc!.addTrack(track, this.local);
    });

    (this.pc as any).ontrack = (event: any) => {
      this.remote = event.streams?.[0] || this.remote;
      this.publish('connected');
    };

    (this.pc as any).onicecandidate = (event: any) => {
      if (!event.candidate || !this.current) return;
      try {
        lanNetwork.send({
          type: 'signal',
          to: this.current.peerId,
          signal: { type: 'candidate', candidate: event.candidate }
        });
      } catch (error) {
        console.warn('Could not send local ICE candidate:', error);
      }
    };

    (this.pc as any).onconnectionstatechange = () => {
      const state = this.pc?.connectionState;
      if (state === 'connected') this.publish('connected');
      else if (state === 'failed') this.publish('failed');
      else if (state === 'disconnected') this.publish('reconnecting');
      else if (state === 'closed') this.publish('ended');
    };

    (this.pc as any).oniceconnectionstatechange = () => {
      const state = this.pc?.iceConnectionState;
      if (state === 'failed') this.publish('failed');
      else if (state === 'disconnected') this.publish('reconnecting');
    };
  }

  private async flushCandidates() {
    const pc = this.pc;
    if (!pc?.remoteDescription) return;
    const candidates = this.pendingCandidates.splice(0);
    for (const candidate of candidates) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.warn('Could not apply queued local ICE candidate:', error);
      }
    }
  }

  async handleSignal(from: string, signal: any, peerName = 'Nearby user') {
    if (!signal) return;

    if (signal.type === 'offer') {
      this.current = {
        peerId: from,
        peerName,
        kind: signal.kind === 'video' ? 'video' : 'audio',
        incoming: true
      };
      // Preserve candidates that may have arrived just before this offer over TCP.
      this.publish('incoming', { offer: signal });
      return;
    }

    if (signal.type === 'answer' && this.pc) {
      await this.pc.setRemoteDescription(
        new RTCSessionDescription({ type: 'answer', sdp: signal.sdp })
      );
      await this.flushCandidates();
      this.publish('connecting');
      return;
    }

    if (signal.type === 'candidate') {
      if (!this.pc || !this.pc.remoteDescription) {
        this.pendingCandidates.push(signal.candidate);
      } else {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch (error) {
          console.warn('Could not apply local ICE candidate:', error);
        }
      }
      return;
    }

    if (signal.type === 'hangup') {
      this.end(false);
      return;
    }

    if (signal.type === 'reject') {
      this.end(false);
      this.publish('failed', { message: signal.reason || 'The other member is unavailable.' });
    }
  }

  setMicrophoneEnabled(enabled: boolean) {
    this.local?.getAudioTracks?.().forEach((track: any) => {
      track.enabled = enabled;
    });
  }

  end(notifyPeer = true) {
    const previous = this.current;
    const pc = this.pc;
    this.pc = null;
    this.pendingCandidates = [];

    try {
      this.local?.getTracks?.().forEach((track: any) => track.stop());
      this.remote?.getTracks?.().forEach((track: any) => track.stop());
      pc?.close();
    } catch (error) {
      console.warn('Call cleanup issue:', error);
    }

    this.local = null;
    this.remote = null;
    this.current = null;

    if (notifyPeer && previous) {
      try {
        lanNetwork.send({
          type: 'signal',
          to: previous.peerId,
          signal: { type: 'hangup' }
        });
      } catch (error) {
        console.warn('Could not notify the other phone that the call ended:', error);
      }
    }

    this.onChange({ status: 'ended' });
  }
}

export const callService = new CallService();
