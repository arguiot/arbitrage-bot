const std = @import("std");
const Allocator = std.mem.Allocator;
const BigInt = std.math.big.int.Managed;
const assert = std.debug.assert;

pub const DataStore = struct {
    allocator: *Allocator,
    data: [][][]BigInt,
    xcapacity: usize,
    ycapacity: usize,
    ntickers: usize,
    nexchanges: usize,

    pub fn init(allocator: *const Allocator, ntickers: usize, nexchanges: usize) !DataStore {
        const data = try allocator.alloc([][]BigInt, nexchanges);
        for (data) |*exchange| {
            exchange.* = try allocator.alloc([]BigInt, ntickers * ntickers);
        }

        return DataStore{
            .allocator = allocator,
            .data = data,
            .xcapacity = ntickers * ntickers,
            .ycapacity = nexchanges,
            .ntickers = ntickers,
            .nexchanges = nexchanges,
        };
    }

    pub fn deinit(self: *DataStore) void {
        for (self.data) |exchange| {
            self.allocator.free(exchange);
        }
        self.allocator.free(self.data);
    }

    // MARK: - Resizing methods

    fn resizeTickers(self: *DataStore, new_tickers: usize) !void {
        const new_xcapacity = new_tickers * new_tickers;
        for (self.data) |*exchange| {
            exchange.* = try self.allocator.reallocAtLeast(exchange.*, new_xcapacity);
        }
        self.xcapacity = new_xcapacity;
        self.ntickers = new_tickers;
    }

    fn resizeExchanges(self: *DataStore, new_exchanges: usize) !void {
        const new_data = try self.allocator.reallocAtLeast(self.data, new_exchanges);
        for (new_data[self.nexchanges..]) |*exchange| {
            exchange.* = try self.allocator.alloc([]BigInt, self.xcapacity);
        }
        self.data = new_data;
        self.ycapacity = new_exchanges;
        self.nexchanges = new_exchanges;
    }

    // MARK: - Methods for adding/retreiving data

    pub fn setData(self: *DataStore, ticker1: usize, ticker2: usize, exchange: usize, value: BigInt) !void {
        if (ticker1 >= self.ntickers or ticker2 >= self.ntickers) {
            const new_tickers = std.math.max(ticker1, ticker2) + 1;
            try self.resizeTickers(new_tickers);
        }
        if (exchange >= self.nexchanges) {
            try self.resizeExchanges(exchange + 1);
        }
        self.data[exchange][ticker1 * self.ntickers + ticker2] = value;
    }

    pub fn getData(self: *DataStore, ticker1: usize, ticker2: usize, exchange: usize) BigInt {
        assert(ticker1 < self.ntickers);
        assert(ticker2 < self.ntickers);
        assert(exchange < self.nexchanges);
        return self.data[exchange][ticker1 * self.ntickers + ticker2];
    }
};
