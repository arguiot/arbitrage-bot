all:
	cd FastSockets && make clean && make
	# Conditional statement to check if on macOS
ifeq ($(shell uname -s), Darwin)
	xcodebuild docbuild -scheme Arbitrage\ Bot -derivedDataPath docs
endif
	swift build -c release
	swift build -c release --show-bin-path

clean:
	cd FastSockets && make clean
	rm -rf .build

.PHONY: all clean
