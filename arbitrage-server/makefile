SRCDIR = Sources/PriceDataStore/
SHAREDLIB = libPriceDataStore.so

UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Linux)
	SHAREDLIBPATH = /usr/lib
endif
ifeq ($(UNAME_S),Darwin)
	SHAREDLIBPATH = /usr/local/lib
endif

build: clean install

install: $(wildcard $(SRCDIR)/*.cpp)
	clang++ -std=c++11 -shared $^ -o $(SHAREDLIB)
	cp $(SHAREDLIB) $(SHAREDLIBPATH)

clean:
	-rm -f $(SHAREDLIB)
	-rm -f $(SHAREDLIBPATH)/$(SHAREDLIB)
