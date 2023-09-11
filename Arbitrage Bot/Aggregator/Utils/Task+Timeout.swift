//
//  Task+Timeout.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 31/08/2023.
//

import Foundation

extension Task where Failure == Error {
    
    /// Start a new Task with a timeout. If the timeout expires before the operation is
    /// completed then the task is cancelled and an error is thrown.
    init(priority: TaskPriority? = nil, timeout: TimeInterval, operation: @escaping @Sendable () async throws -> Success, deferred: @escaping @Sendable (Error?) -> Void) {
        self = Task(priority: priority) {
            do {
                let r = try await withThrowingTaskGroup(of: Success.self) { group -> Success in
                    group.addTask(operation: operation)
                    group.addTask {
                        try await _Concurrency.Task.sleep(nanoseconds: UInt64(timeout * 1_000_000_000))
                        throw TimeoutError()
                    }
                    guard let success = try await group.next() else {
                        throw _Concurrency.CancellationError()
                    }
                    group.cancelAll()
                    return success
                }
                deferred(nil)
                return r
            } catch {
                deferred(error)
                throw error
            }
        }
    }
}

private struct TimeoutError: LocalizedError {
    var errorDescription: String? = "Task timed out before completion"
}
