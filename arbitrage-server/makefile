SRCDIR = Sources/PriceDataStore/
SHAREDLIB = price_data_store.so

UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Linux)
	SHAREDLIBPATH = /usr/lib
endif
ifeq ($(UNAME_S),Darwin)
	SHAREDLIBPATH = /usr/local/lib
endif

build: clean install

install: create_symlink $(wildcard $(SRCDIR)/*.cpp)
	# clang++ -std=c++11 -shared $^ -o $(SHAREDLIB)
	# cp $(SHAREDLIB) $(SHAREDLIBPATH)
	- zig build-lib "$(SRCDIR)/src/main.zig" -femit-bin="$(SRCDIR)/product/$(SHAREDLIB)" -ofmt=macho -femit-h="$(SRCDIR)/product/price_data_store.h" -fstrip

create_symlink:
	- ./create_zig_symlink.sh

clean:
	- rm -f $(SRCDIR)/product/*
	# -rm -f $(SHAREDLIBPATH)/$(SHAREDLIB)
