@testable import App
import XCTVapor

final class AppTests: XCTestCase {
    func testUpgradeFailed() async throws {
        let app = Application(.testing)
        defer { app.shutdown() }
        try await configure(app)

        try app.test(.GET, "/", afterResponse: { res in
            XCTAssertEqual(res.status, .switchingProtocols)
//            XCTAssertEqual(res.body.string, "Upgrade failed... 0x27b4A938802b1278317eD0fC0135b6E1E14F43dC")
        })
    }
}
