
import TcpSocket from 'react-native-tcp-socket';
import dgram from 'react-native-udp';
import { Buffer } from 'buffer';
import { Platform } from 'react-native';
import type { NearbyPeer, WirePacket } from '@/types/network';

const TCP_PORT = 45454;
const UDP_PORT = 45455;
const BEACON = 'OCP_DISCOVER_V2';

type Listener = (packet: WirePacket) => void;
type PeerListener = (peers: NearbyPeer[]) => void;

class LanNetwork {
  private server: any = null;
  private discovery: any = null;
  private socket: any = null;

  private clients = new Map<string, any>();
  private clientNames = new Map<string, string>();

  private listeners = new Set<Listener>();
  private peerListeners = new Set<PeerListener>();
  private peerMap = new Map<string, NearbyPeer>();

  private bufferMap = new WeakMap<object, string>();

  private self: any = null;
  private hostAddress = '';
  private roomCode = '';
  private localIp = '';

  private active = false;
  private discoveryBound = false;
  private discoveryTimer: any = null;

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  subscribePeers(fn: PeerListener) {
    this.peerListeners.add(fn);
    fn([...this.peerMap.values()]);
    return () => this.peerListeners.delete(fn);
  }

  private emit(p: WirePacket) {
    this.listeners.forEach(fn => {
      try {
        fn(p);
      } catch (e) {
        console.warn('LAN listener error:', e);
      }
    });
  }

  private emitPeers() {
    const list = [...this.peerMap.values()].filter(
      p => Date.now() - p.seenAt < 15000
    );

    this.peerListeners.forEach(fn => {
      try {
        fn(list);
      } catch (e) {
        console.warn('Peer listener error:', e);
      }
    });
  }

  private sendSocket(s: any, p: WirePacket) {
    if (!s) return;

    try {
      s.write(JSON.stringify(p) + '\n');
    } catch (e) {
      console.warn('LAN send failed:', e);
    }
  }

  private attach(s: any, onPacket: (p: WirePacket) => void) {
    s.on('data', (chunk: any) => {
      const all =
        (this.bufferMap.get(s as any) || '') +
        Buffer.from(chunk).toString('utf8');

      const lines = all.split('\n');
      this.bufferMap.set(s as any, lines.pop() || '');

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          onPacket(JSON.parse(line));
        } catch {
          this.emit({
            type: 'error',
            message: 'Received an invalid local-network packet'
          });
        }
      }
    });

    s.on('error', (e: any) => {
      this.emit({
        type: 'error',
        message: e?.message || 'Socket error'
      });
    });

    s.on('close', () => {
      this.emit({ type: 'peer-left' });
    });
  }

  private setupDiscoveryErrorHandler(socket: any) {
    socket.on('error', (e: any) => {
      console.warn('UDP discovery error:', e);

      if (this.discovery === socket) {
        this.discoveryBound = false;
      }

      this.emit({
        type: 'error',
        message:
          'Local network discovery is unavailable. You can still connect using an IP address.'
      });
    });

    socket.on('close', () => {
      if (this.discovery === socket) {
        this.discoveryBound = false;
      }
    });
  }

  private sendUdp(data: any, port: number, address: string) {
    const socket = this.discovery;

    // Never send UDP data before binding has completed.
    if (!socket || !this.discoveryBound) {
      return;
    }

    try {
      const buffer = Buffer.isBuffer(data)
        ? data
        : Buffer.from(data);

      socket.send(
        buffer,
        0,
        buffer.length,
        port,
        address
      );
    } catch (e) {
      console.warn('UDP send failed:', e);
    }
  }

  // Returns the general broadcast address and, where possible,
  // the typical /24 subnet broadcast address.
  private getBroadcastAddresses(ip?: string): string[] {
    const addresses = new Set<string>([
      '255.255.255.255'
    ]);

    if (
      !ip ||
      ip === '0.0.0.0' ||
      ip === '127.0.0.1'
    ) {
      return [...addresses];
    }

    const parts = ip.split('.').map(Number);

    const validIp =
      parts.length === 4 &&
      parts.every(
        n =>
          Number.isInteger(n) &&
          n >= 0 &&
          n <= 255
      );

    if (
      validIp &&
      parts[0] !== 127 &&
      parts[0] !== 169
    ) {
      addresses.add(
        `${parts[0]}.${parts[1]}.${parts[2]}.255`
      );
    }

    return [...addresses];
  }

  private sendDiscoveryBroadcast(data: any) {
    const addresses = this.getBroadcastAddresses(
      this.localIp
    );

    for (const address of addresses) {
      this.sendUdp(data, UDP_PORT, address);
    }
  }

  async hostRoom(info: {
    id: string;
    hostId: string;
    hostIp?: string;
    name: string;
    displayName: string;
    maxMembers: number;
    isPrivate: boolean;
    code: string;
  }) {
    await this.stop();

    this.self = info;
    this.roomCode = info.code;
    this.localIp = info.hostIp || '';
    this.active = true;

    this.server = TcpSocket.createServer((s: any) => {
      let peerId = '';

      this.attach(s, (p) => {
        if (p.type === 'hello') {
          if (
            this.self.isPrivate &&
            p.code !== this.roomCode
          ) {
            this.sendSocket(s, {
              type: 'rejected',
              reason: 'Incorrect room code'
            });

            s.destroy();
            return;
          }

          if (
            this.clients.size + 1 >=
            Number(this.self.maxMembers || 8)
          ) {
            this.sendSocket(s, {
              type: 'rejected',
              reason: 'This room is full'
            });

            s.destroy();
            return;
          }

          peerId = String(p.peerId || '');

          this.clients.set(peerId, s);
          this.clientNames.set(
            peerId,
            String(p.name || 'Nearby user')
          );

          const members = [
            {
              id: this.self.hostId,
              name: this.self.displayName
            },
            ...Array.from(this.clientNames.entries()).map(
              ([id, name]) => ({ id, name })
            )
          ];

          this.sendSocket(s, {
            type: 'welcome',
            room: {
              ...this.self,
              host: this.self.hostIp,
              port: TCP_PORT,
              hostId: this.self.hostId
            },
            host: this.self.displayName,
            hostId: this.self.hostId,
            members
          });

          this.broadcast({
            type: 'member-joined',
            peerId,
            name: p.name
          });

          this.emit({
            type: 'member-joined',
            peerId,
            name: p.name
          });
        } else {
          if (
            p.type === 'chat' ||
            p.type === 'signal' ||
            p.type === 'file' ||
            p.type === 'typing'
          ) {
            if (p.to) {
              if (p.to === this.self?.hostId) {
                this.emit({
                  ...p,
                  from: peerId,
                  fromName: this.clientNames.get(peerId) || p.fromName || 'Nearby user'
                });
              } else {
                const target = this.clients.get(
                  String(p.to)
                );

                if (target) {
                  this.sendSocket(target, {
                    ...p,
                    from: peerId,
                    fromName: this.clientNames.get(peerId) || p.fromName || 'Nearby user'
                  });
                } else {
                  this.sendSocket(s, {
                    type: 'signal',
                    to: peerId,
                    from: this.self?.hostId,
                    fromName: this.self?.displayName || 'Room host',
                    signal: { type: 'reject', reason: 'That member is no longer connected to the room.' }
                  });
                }
              }
            } else {
              this.broadcast(
                {
                  ...p,
                  from: peerId
                },
                s
              );

              this.emit({
                ...p,
                from: peerId,
                fromName: this.clientNames.get(peerId) || p.fromName || 'Nearby user'
              });
            }
          }
        }
      });

      s.on('close', () => {
        if (peerId) {
          this.clients.delete(peerId);
          this.clientNames.delete(peerId);

          this.broadcast({
            type: 'member-left',
            peerId
          });

          this.emit({
            type: 'member-left',
            peerId
          });
        }
      });
    });

    await new Promise<void>((resolve, reject) => {
      this.server.once('error', reject);

      this.server.listen(
        {
          port: TCP_PORT,
          host: '0.0.0.0'
        },
        () => resolve()
      );
    });

    this.startDiscovery();

    this.emit({
      type: 'hosting',
      port: TCP_PORT,
      roomCode: this.roomCode
    });

    return TCP_PORT;
  }

  private broadcast(p: WirePacket, except?: any) {
    const data = JSON.stringify(p) + '\n';

    for (const s of this.clients.values()) {
      if (s !== except) {
        try {
          s.write(data);
        } catch (e) {
          console.warn('Broadcast failed:', e);
        }
      }
    }
  }

  private startDiscovery() {
    try {
      const socket = dgram.createSocket({
        type: 'udp4'
      }) as any;

      this.discovery = socket;
      this.discoveryBound = false;

      this.setupDiscoveryErrorHandler(socket);

      socket.on('message', (msg: any, rinfo: any) => {
        if (this.discovery !== socket) return;

        const text = Buffer.from(msg).toString('utf8');

        if (text === BEACON) {
          const response = {
            tag: 'OCP_ROOM_V2',
            id: this.self.hostId,
            roomId: this.self.id,
            name: this.self.displayName,
            host: this.self.name,
            port: TCP_PORT,
            code: this.self.isPrivate
              ? ''
              : this.roomCode,
            roomName: this.self.name,
            maxMembers: this.self.maxMembers,
            isPrivate: this.self.isPrivate,
            members: this.clients.size + 1
          };

          // Reply directly to the device that requested discovery.
          this.sendUdp(
            Buffer.from(JSON.stringify(response)),
            rinfo.port,
            rinfo.address
          );
        } else {
          try {
            const p = JSON.parse(text);

            if (
              p.tag === 'OCP_ROOM_V2' &&
              p.id !== this.self.hostId
            ) {
              this.peerMap.set(p.id, {
                id: p.id,
                name: p.name,
                host: rinfo.address,
                port: p.port,
                roomCode: p.code,
                roomName: p.roomName,
                members: p.members,
                maxMembers: p.maxMembers,
                isPrivate: p.isPrivate,
                seenAt: Date.now()
              });

              this.emitPeers();
            }
          } catch {
            // Ignore unrelated UDP messages.
          }
        }
      });

      // Wait for bind before sending discovery messages.
      socket.bind(UDP_PORT, () => {
        if (this.discovery !== socket) return;

        this.discoveryBound = true;

        try {
          socket.setBroadcast(true);
        } catch (e) {
          console.warn('UDP broadcast setup failed:', e);
        }

        this.beaconLoop();
      });
    } catch (e) {
      console.warn('Discovery startup failed:', e);

      this.emit({
        type: 'error',
        message:
          'Room hosting started, but automatic discovery could not start. Share the host IP and room code.'
      });
    }
  }

  private beaconLoop() {
    if (
      !this.discovery ||
      !this.discoveryBound ||
      !this.active
    ) {
      return;
    }

    const payload = {
      tag: 'OCP_ROOM_V2',
      id: this.self.hostId,
      roomId: this.self.id,
      name: this.self.displayName,
      host: this.self.name,
      port: TCP_PORT,
      code: this.self.isPrivate
        ? ''
        : this.roomCode,
      roomName: this.self.name,
      maxMembers: this.self.maxMembers,
      isPrivate: this.self.isPrivate,
      members: this.clients.size + 1
    };

    this.sendDiscoveryBroadcast(
      Buffer.from(JSON.stringify(payload))
    );

    if (this.discoveryTimer) {
      clearTimeout(this.discoveryTimer);
    }

    this.discoveryTimer = setTimeout(
      () => this.beaconLoop(),
      2500
    );
  }

  async discover(localIp = '') {
    if (this.discovery) return;

    this.localIp = localIp;

    try {
      const socket = dgram.createSocket({
        type: 'udp4'
      }) as any;

      this.discovery = socket;
      this.discoveryBound = false;

      this.setupDiscoveryErrorHandler(socket);

      socket.on('message', (msg: any, rinfo: any) => {
        if (this.discovery !== socket) return;

        try {
          const p = JSON.parse(
            Buffer.from(msg).toString('utf8')
          );

          if (p.tag === 'OCP_ROOM_V2') {
            this.peerMap.set(p.id, {
              id: p.id,
              name: p.name,
              host: rinfo.address,
              port: p.port,
              roomCode: p.code,
              roomName: p.roomName,
              members: p.members,
              maxMembers: p.maxMembers,
              isPrivate: p.isPrivate,
              seenAt: Date.now()
            });

            this.emitPeers();
          }
        } catch {
          // Ignore invalid discovery packets.
        }
      });

      // Do not send the first beacon until bind succeeds.
      socket.bind(UDP_PORT, () => {
        if (this.discovery !== socket) return;

        this.discoveryBound = true;

        try {
          socket.setBroadcast(true);
        } catch (e) {
          console.warn('UDP broadcast setup failed:', e);
        }

        this.sendDiscoveryBroadcast(
          Buffer.from(BEACON)
        );

        this.repeatDiscovery();
      });
    } catch (e) {
      console.warn('Room discovery failed:', e);

      this.emit({
        type: 'error',
        message:
          'Automatic discovery is unavailable on this network. Use Join by IP instead.'
      });
    }
  }

  private repeatDiscovery() {
    if (
      !this.discovery ||
      !this.discoveryBound
    ) {
      return;
    }

    this.sendDiscoveryBroadcast(
      Buffer.from(BEACON)
    );

    if (this.discoveryTimer) {
      clearTimeout(this.discoveryTimer);
    }

    this.discoveryTimer = setTimeout(
      () => this.repeatDiscovery(),
      3000
    );
  }

  async connect(
    host: string,
    code: string,
    profile: { id: string; name: string }
  ) {
    await this.disconnectClient();

    return new Promise<void>((resolve, reject) => {
      let settled = false;

      const finishReject = (error: any) => {
        if (settled) return;

        settled = true;

        reject(
          error instanceof Error
            ? error
            : new Error('Could not connect to room host')
        );
      };

      const s = TcpSocket.createConnection(
        {
          port: TCP_PORT,
          host,
          connectTimeout: 8000,
          ...(Platform.OS === 'android'
            ? { interface: 'wifi' }
            : {})
        },
        () => {
          this.socket = s;

          this.attach(s, (p) => {
            if (p.type === 'welcome') {
              this.emit(p);

              if (!settled) {
                settled = true;
                resolve();
              }
            } else if (p.type === 'rejected') {
              finishReject(
                new Error(
                  p.reason ||
                  'Room rejected the connection'
                )
              );

              s.destroy();
            } else {
              this.emit(p);
            }
          });

          this.sendSocket(s, {
            type: 'hello',
            peerId: profile.id,
            name: profile.name,
            code
          });
        }
      );

      s.once('error', (e: any) => {
        finishReject(
          new Error(
            e?.message ||
            'Could not connect to room host'
          )
        );
      });
    });
  }

  send(p: WirePacket) {
    if (this.socket) {
      this.sendSocket(this.socket, p);
      return;
    }

    if (this.server) {
      if (p.to) {
        if (p.to === this.self?.hostId) {
          this.emit({
            ...p,
            from: this.self?.hostId,
            fromName: this.self?.displayName || 'Room host'
          });
        } else {
          const target = this.clients.get(
            String(p.to)
          );

          if (!target) {
            throw new Error('That member is no longer connected to the room.');
          }
          this.sendSocket(target, {
            ...p,
            from: this.self?.hostId,
            fromName: this.self?.displayName || 'Room host'
          });
        }
      } else {
        this.broadcast(p);

        this.emit({
          ...p,
          from: this.self?.hostId,
          fromName: this.self?.displayName || 'Room host'
        });
      }

      return;
    }

    throw new Error('Connect to a room before sending.');
  }

  async disconnectClient() {
    if (this.socket) {
      const oldSocket = this.socket;
      this.socket = null;

      try {
        oldSocket.destroy();
      } catch (e) {
        console.warn('Disconnect failed:', e);
      }
    }
  }

  async stop() {
    this.active = false;

    if (this.discoveryTimer) {
      clearTimeout(this.discoveryTimer);
      this.discoveryTimer = null;
    }

    this.discoveryBound = false;

    if (this.discovery) {
      const oldDiscovery = this.discovery;
      this.discovery = null;

      try {
        oldDiscovery.close();
      } catch (e) {
        console.warn('UDP close failed:', e);
      }
    }

    await this.disconnectClient();

    for (const s of this.clients.values()) {
      try {
        s.destroy();
      } catch (e) {
        console.warn('Client close failed:', e);
      }
    }

    this.clients.clear();
    this.clientNames.clear();

    if (this.server) {
      const oldServer = this.server;
      this.server = null;

      await new Promise<void>(resolve => {
        try {
          oldServer.close(() => resolve());
        } catch {
          resolve();
        }
      });
    }

    this.peerMap.clear();
    this.emitPeers();
    this.emit({ type: 'disconnected' });
  }
}

export const lanNetwork = new LanNetwork();
