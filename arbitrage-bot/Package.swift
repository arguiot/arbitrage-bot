// swift-tools-version:5.8
import PackageDescription

let package = Package(
    name: "ArbitrageBot",
    platforms: [
        .macOS(.v13),
    ],
    products: [
        .library(
            name: "Arbitrage_Bot",
            targets: ["Arbitrage_Bot"]),
    ],
    dependencies: [
        .package(url: "https://github.com/Boilertalk/Web3.swift.git", from: "0.6.0"),
        .package(url: "https://github.com/OpenCombine/OpenCombine.git", from: "0.14.0"),
        .package(url: "https://github.com/arguiot/Euler.git", .upToNextMajor(from: "0.3.9")),
        .package(url: "https://github.com/JohnSundell/CollectionConcurrencyKit.git", from: "0.2.0")
    ],
    targets: [
        .systemLibrary(
            name: "FastSockets",
            path: "FastSockets"
        ),
        .target(
            name: "Aggregator",
            dependencies: [
                .product(name: "Web3", package: "Web3.swift"),
                .product(name: "Web3ContractABI", package: "Web3.swift"),
                .product(name: "Web3PromiseKit", package: "Web3.swift"),
                .product(name: "OpenCombine", package: "OpenCombine"),
                .product(name: "OpenCombineDispatch", package: "OpenCombine"),
                .product(name: "OpenCombineFoundation", package: "OpenCombine"),
                "Euler",
                "CollectionConcurrencyKit"
            ],
            path: "Arbitrage Bot/Aggregator/"
        ),
        .target(
            name: "Arbitrage_Bot",
            dependencies: [
                "Aggregator",
                "FastSockets"
            ],
            path: "Arbitrage Bot/Arbitrager/",
            linkerSettings: [
                .unsafeFlags(["-L", "FastSockets/", "-lFastSockets", "-luSockets",
                              "-lz",
                             ])
            ]
        ),
        .testTarget(
            name: "Arbitrage-BotTests",
            dependencies: ["Arbitrage_Bot"],
            path: "Arbitrage-BotTests"
        )
    ],
    cLanguageStandard: .gnu99
)
