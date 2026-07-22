import 'dart:developer' as developer;
import 'package:socket_io_client/socket_io_client.dart' as io;

class SocketService {
  late io.Socket _socket;
  bool _isConnected = false;
  String? _connectedUrl;
  String? _connectedToken;
  final Set<String> _joinedCourseIds = <String>{};
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 10;
  static const int _initialReconnectDelay = 1000; // ms

  SocketService();

  bool get isConnected => _isConnected;
  io.Socket get socket => _socket;

  Future<void> connect(String url, String token) async {
    if (_isConnected && _connectedUrl == url && _connectedToken == token) {
      return;
    }
    if (_connectedUrl != null &&
        (_connectedUrl != url || _connectedToken != token)) {
      await disconnect();
    }

    try {
      _socket = io.io(
        url,
        io.OptionBuilder()
            .setTransports(['websocket'])
            .enableAutoConnect()
            .setAuth({'token': token})
            .setReconnectionDelay(
              const Duration(
                milliseconds: _initialReconnectDelay,
              ).inMilliseconds,
            )
            .setReconnectionDelayMax(const Duration(seconds: 30).inMilliseconds)
            .setReconnectionAttempts(_maxReconnectAttempts)
            .build(),
      );
      _connectedUrl = url;
      _connectedToken = token;

      _setupListeners();
      _reconnectAttempts = 0;

      // Wait for connection
      await _waitForConnection();
    } catch (e) {
      developer.log('Socket connection error', error: e, name: 'SocketService');
      rethrow;
    }
  }

  Future<void> _waitForConnection({
    Duration timeout = const Duration(seconds: 10),
  }) async {
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
      _rejoindreCoursesMemorisees();
      developer.log('Socket connected', name: 'SocketService');
    });

    _socket.onDisconnect((_) {
      _isConnected = false;
      developer.log('Socket disconnected', name: 'SocketService');
    });

    _socket.onReconnect((_) {
      _isConnected = true;
      _reconnectAttempts = 0;
      _rejoindreCoursesMemorisees();
      developer.log('Socket reconnected', name: 'SocketService');
    });

    _socket.onReconnectAttempt((_) {
      _reconnectAttempts++;
      developer.log(
        'Socket reconnect attempt: $_reconnectAttempts',
        name: 'SocketService',
      );
    });

    _socket.onConnectError((error) {
      developer.log(
        'Socket connection error',
        error: error,
        name: 'SocketService',
      );
      _isConnected = false;
    });

    _socket.onError((error) {
      developer.log('Socket error', error: error, name: 'SocketService');
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
      developer.log(
        'Socket not connected, cannot emit event: $event',
        name: 'SocketService',
      );
    }
  }

  /// Mémorise la room afin de la rejoindre de nouveau après chaque
  /// reconnexion Socket.IO (les rooms serveur sont perdues à la coupure).
  void joinCourse(String idTrajet) {
    _joinedCourseIds.add(idTrajet);
    if (_isConnected) {
      _socket.emit('course:join', {'id_trajet': idTrajet});
    }
  }

  void leaveCourse(String idTrajet) {
    _joinedCourseIds.remove(idTrajet);
    if (_isConnected) {
      _socket.emit('course:leave', {'id_trajet': idTrajet});
    }
  }

  void _rejoindreCoursesMemorisees() {
    for (final idTrajet in _joinedCourseIds) {
      _socket.emit('course:join', {'id_trajet': idTrajet});
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
    if (_connectedUrl != null) _socket.disconnect();
    _connectedUrl = null;
    _connectedToken = null;
    await Future.delayed(const Duration(milliseconds: 500));
  }

  Future<void> reconnect() async {
    await disconnect();
    // Reconnect will be triggered automatically
  }
}
