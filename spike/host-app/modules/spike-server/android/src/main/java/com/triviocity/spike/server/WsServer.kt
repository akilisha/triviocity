package com.triviocity.spike.server

import org.java_websocket.WebSocket
import org.java_websocket.handshake.ClientHandshake
import org.java_websocket.server.WebSocketServer
import java.net.InetSocketAddress

/** Java-WebSocket transport. It only hands events to the game loop; it holds no state. */
class WsServer(
  port: Int,
  private val post: (() -> Unit) -> Unit,
  private val game: Game,
  private val log: EventLog,
) : WebSocketServer(InetSocketAddress(port)) {
  init {
    isReuseAddr = true
    isTcpNoDelay = true
    // Server-side ping; a client that stops answering is closed after this many seconds.
    connectionLostTimeout = 15
  }

  override fun onStart() {
    log.write("ws_listening", mapOf("port" to port))
  }

  override fun onOpen(conn: WebSocket, handshake: ClientHandshake) {
    val remote = conn.remoteSocketAddress?.address?.hostAddress ?: "unknown"
    post { game.onOpen(conn, remote) }
  }

  override fun onClose(conn: WebSocket, code: Int, reason: String?, remote: Boolean) {
    post { game.onClose(conn, code, reason, remote) }
  }

  override fun onMessage(conn: WebSocket, message: String) {
    post { game.onMessage(conn, message) }
  }

  override fun onError(conn: WebSocket?, ex: Exception) {
    log.write("ws_error", mapOf("error" to ex.toString()))
  }
}
