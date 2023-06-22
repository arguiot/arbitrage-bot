const std = @import("std");
const Allocator = std.mem.Allocator;
const GeneralPurposeAllocator = std.heap.GeneralPurposeAllocator;
const DataStore = @import("./adjacency/data_store.zig").DataStore;
const testing = std.testing;

var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const allocator = gpa.allocator();

// // Exported functions that use DataStore
// export fn createDataStore(ntickers: usize, nexchanges: usize) !*DataStore {
//     const data_store = try allocator.create(DataStore);
//     try data_store.init(allocator, ntickers, nexchanges);
//     return data_store;
// }

export fn cleanupDataStore(ds: *DataStore) void {
    // Call the cleanup function of your DataStore struct
    ds.deinit();

    // Clean up the GeneralPurposeAllocator
    _ = gpa.deinit();
    //fail test; can't try in defer as defer is executed after we return
    // if (deinit_status == .leak) expect(false) catch @panic("TEST FAIL");
}
