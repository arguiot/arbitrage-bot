import Vapor
import Arbitrer

func routes(_ app: Application) async throws {
    app.webSocket { req, ws in
//        let i = PriceDataStore.BigInteger
        app.logger.log(level: .info, "New socket, id")
        ws.onText { ws, text in
            do {
                let botRequest = try BotRequest.fromJSON(jsonString: text)
                try await RealtimeServerController.shared.handleRequest(request: botRequest, ws: ws)
            } catch {
                app.logger.error("Error: \(error)");
                // Send it back to the client
                let response = BotResponse(status: .error, topic: .none, error: error.localizedDescription)
                guard let json = try? response.toJSON() else {
                    try? await ws.send("Unknown JSON error while encoding the error message.")
                    return
                }
                try? await ws.send(json)
            }
        }
    }
}
