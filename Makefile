all:
	cd FastSockets && make clean && make
	xcodebuild docbuild -scheme Arbitrage\ Bot -derivedDataPath docs
	swift build -c release
	swift build -c release --show-bin-path

clean:
	cd FastSockets && make clean
	rm -rf .build

.PHONY: all clean
