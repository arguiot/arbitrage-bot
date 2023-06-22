// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "arbitrage-server",
    platforms: [
       .macOS(.v12)
    ],
    products: [
//        .library(name: "PriceDataStore", type: .static, targets: ["PriceDataStore"]),
        .library(name: "Arbitrer", targets: ["Arbitrer"]),
    ],
    dependencies: [
        // 💧 A server-side Swift web framework.
        .package(url: "https://github.com/vapor/vapor.git", from: "4.76.0"),
        .package(url: "https://github.com/Boilertalk/Web3.swift.git", from: "0.6.0"),
        .package(url: "https://github.com/arguiot/Euler.git", from: "0.3.9"),
        .package(url: "https://github.com/OpenCombine/OpenCombine.git", from: "0.14.0")
    ],
    targets: [
        .systemLibrary(name: "PriceDataStore"),
        .target(name: "Arbitrer", dependencies: [
            .product(name: "Web3", package: "Web3.swift"),
            .product(name: "Web3PromiseKit", package: "Web3.swift"),
            .product(name: "Web3ContractABI", package: "Web3.swift"),
            .product(name: "Euler", package: "Euler"),
            .product(name: "OpenCombine", package: "OpenCombine"),
            .product(name: "OpenCombineFoundation", package: "OpenCombine"),
            .product(name: "OpenCombineDispatch", package: "OpenCombine")
        ]),
        .executableTarget(
            name: "App",
            dependencies: [
                .product(name: "Vapor", package: "vapor"),
                .target(name: "PriceDataStore"),
                .byName(name: "Arbitrer")
            ],
            swiftSettings: [
                // Enable better optimizations when building in Release configuration. Despite the use of
                // the `.unsafeFlags` construct required by SwiftPM, this flag is recommended for Release
                // builds. See <https://www.swift.org/server/guides/building.html#building-for-production> for details.
                .unsafeFlags(["-cross-module-optimization"], .when(configuration: .release))
            ],
            linkerSettings: [
//                .linkedLibrary("PriceDataStore"),
//                .unsafeFlags(["-L/usr/local/lib"]) // Set library search path
            ]
        ),
        .testTarget(name: "AppTests", dependencies: [
            .target(name: "App"),
            .product(name: "XCTVapor", package: "vapor"),
        ])
    ],
    cLanguageStandard: .c99
)
