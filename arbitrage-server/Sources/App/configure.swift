import Vapor
import Arbitrer

// configures your application
public func configure(_ app: Application) async throws {
    // uncomment to serve files from /Public folder
    // app.middleware.use(FileMiddleware(publicDirectory: app.directory.publicDirectory))

    Arbitrer.Environment.shared = ProcessInfo.processInfo.environment
    
    // register routes
    try await routes(app)
}
