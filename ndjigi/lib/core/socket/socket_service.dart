import 'package:socket_io_client/socket_io_client.dart' as io;

class SocketService {
  static final SocketService _instance = SocketService._internal();

  late io.Socket _socket;
  bool _isConnected = false;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 10;
  static const int _initialReconnectDelay = 1000; // ms

  SocketService._internal();

  factory SocketService() {
    return _instance;
  }

  bool get isConnected => _isConnected;
  io.Socket get socket => _socket;

  Future<void> connect(String url, String token) async {
    if (_isConnected) {
      return;
    }

    try {
      _socket = io.io(
        url,
        io.OptionBuilder()
            .setTransports(['websocket'])
            .enableAutoConnect()
            .setAuth({'token': token})
            .setReconnectionDelay(
              const Duration(milliseconds: _initialReconnectDelay).inMilliseconds,
            )
            .setReconnectionDelayMax(
              const Duration(seconds: 30).inMilliseconds,
            )
            .setReconnectionAttempts(_maxReconnectAttempts)
            .build(),
      );

      _setupListeners();
      _reconnectAttempts = 0;

      // Wait for connection
      await _waitForConnection();
    } catch (e) {
      print('Socket connection error: $e');
      rethrow;
    }
  }

  Future<void> _waitForConnection({Duration timeout = const Duration(seconds: 10)}) async {
    final stopwatch = Stopwatch()..start();

    while (!_isConnected) {
      if (stopwatch.elapsed > timeout) {
        throw Exception('Socket connection timeout');
      }
      await Future.delayed(const Duration(milliseconds: 100));
    }
  }

  void _setupListeners() {
    _socket.onConnect((_) {
      _isConnected = true;
      _reconnectAttempts = 0;
      print('Socket connected');
    });

    _socket.onDisconnect((_) {
      _isConnected = false;
      print('Socket disconnected');
    });

    _socket.onReconnect((_) {
      _isConnected = true;
      _reconnectAttempts = 0;
      print('Socket reconnected');
    });

    _socket.onReconnectAttempt((_) {
      _reconnectAttempts++;
      print('Socket reconnect attempt: $_reconnectAttempts');
    });

    _socket.onConnectError((error) {
      print('Socket connection error: $error');
      _isConnected = false;
    });

    _socket.onError((error) {
      print('Socket error: $error');
    });
  }

  void on(String event, Function(dynamic data) handler) {
    _socket.on(event, (data) {
      handler(data);
    });
  }

  void once(String event, Function(dynamic data) handler) {
    _socket.once(event, (data) {
      handler(data);
    });
  }

  void emit(String event, [dynamic data]) {
    if (_isConnected) {
      if (data != null) {
        _socket.emit(event, data);
      } else {
        _socket.emit(event);
      }
    } else {
      print('Socket not connected, cannot emit event: $event');
    }
  }

  void off(String event) {
    _socket.off(event);
  }

  void offAll() {
    // Clear all event listeners
    _socket.clearListeners();
  }

  Future<void> disconnect() async {
    _isConnected = false;
    _socket.disconnect();
    await Future.delayed(const Duration(milliseconds: 500));
  }

  Future<void> reconnect() async {
    await disconnect();
    // Reconnect will be triggered automatically
  }
}
