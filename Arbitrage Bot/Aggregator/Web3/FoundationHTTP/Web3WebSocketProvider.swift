import Foundation
import Dispatch
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif
//import NIOPosix

public class Web3WebSocketProvider: Web3Provider, Web3BidirectionalProvider {
    
    // MARK: - Properties
    
    let encoder = JSONEncoder()
    let decoder = JSONDecoder()
    
    private let receiveQueue: DispatchQueue
    private let reconnectQueue: DispatchQueue
    
    public private(set) var closed: Bool = false
    
    public let wsUrl: URL
    
    public let timeoutNanoSeconds: UInt64
    
    private var webSocketTask: URLSessionWebSocketTask!
    
    // Stores ids and notification groups
    private let pendingRequests: SynchronizedDictionary<Int, (timeoutItem: DispatchWorkItem, responseCompletion: (_ response: String?) -> Void)> = [:]
    
    // Stores subscription ids and semaphores
    private let currentSubscriptions: SynchronizedDictionary<String, (onCancel: () -> Void, onNotification: (_ notification: String) -> Void)> = [:]
    
    // Maintain sync current id
    private let nextIdQueue = DispatchQueue(label: "Web3WebSocketProvider_nextIdQueue", attributes: .concurrent)
    private var currentId = 1
    private var nextId: Int {
        get {
            var retId: Int!
            
            nextIdQueue.sync(flags: .barrier) {
                retId = currentId
                
                if currentId < UInt16.max {
                    currentId += 1
                } else {
                    currentId = 1
                }
            }
            
            return retId
        }
    }
    
    public enum Error: Swift.Error {
        case invalidUrl
        
        case timeoutError
        case unexpectedResponse
        case webSocketClosedRetry
        
        case subscriptionCancelled
    }
    
    // MARK: - Initialization
    
    public init(wsUrl: String, timeout: DispatchTimeInterval = .seconds(120)) throws {
        // Concurrent queue for faster concurrent requests
        self.receiveQueue = DispatchQueue(label: "Web3WebSocketProvider_Receive", attributes: .concurrent)
        self.reconnectQueue = DispatchQueue(label: "Web3WebSocketProvider_Reconnect", attributes: .concurrent)
        
        guard let url = URL(string: wsUrl) else {
            throw Error.invalidUrl
        }
        self.wsUrl = url
        
        // Timeout in ns
        switch timeout {
        case .seconds(let int):
            self.timeoutNanoSeconds = UInt64(int * 1_000_000_000)
        case .milliseconds(let int):
            self.timeoutNanoSeconds = UInt64(int * 1_000_000)
        case .microseconds(let int):
            self.timeoutNanoSeconds = UInt64(int * 1_000)
        case .nanoseconds(let int):
            self.timeoutNanoSeconds = UInt64(int)
        default:
            self.timeoutNanoSeconds = UInt64(120 * 1_000_000_000)
        }
        
        // Initial connect
        try reconnect(firstTime: true)
    }
    
    deinit {
        closed = true
        self.closeWebSocketConnection()
    }
    
    // MARK: - Web3Provider
    
    public func send<Params, Result>(request: RPCRequest<Params>, response: @escaping Web3ResponseCompletion<Result>) {
        let replacedIdRequest = RPCRequest(id: self.nextId, jsonrpc: request.jsonrpc, method: request.method, params: request.params)
        
        let requestData: Data
        do {
            requestData = try self.encoder.encode(replacedIdRequest)
        } catch {
            let respError = Web3Response<Result>(error: .requestFailed(error))
            response(respError)
            return
        }
        
        let requestMessage = URLSessionWebSocketTask.Message.data(requestData)
        
        // Generic failure handler
        let failure: (_ error: Error) -> () = { error in
            let respError = Web3Response<Result>(error: .serverError(error))
            response(respError)
        }
        
        // Setup timeout handler
        let timeoutItem = DispatchWorkItem {
            self.pendingRequests[replacedIdRequest.id] = nil
            failure(Error.timeoutError)
        }
        self.receiveQueue.asyncAfter(deadline: DispatchTime(uptimeNanoseconds: DispatchTime.now().uptimeNanoseconds + self.timeoutNanoSeconds), execute: timeoutItem)
        
        // The response handler
        let responseCompletion: (_ response: String?) -> Void = { responseString in
            defer {
                // Remove from pending requests
                self.pendingRequests[replacedIdRequest.id] = nil
            }
            
            timeoutItem.cancel()
            
            self.pendingRequests.getValueAsync(key: replacedIdRequest.id) { value in
                guard value != nil else {
                    // Timeout happened already. Rare. Timeout sent the timeout error. Do nothing.
                    return
                }
                
                self.receiveQueue.async {
                    guard let responseString = responseString else {
                        failure(Error.webSocketClosedRetry)
                        return
                    }
                    
                    // Parse response
                    guard let responseData = responseString.data(using: .utf8), let decoded = try? self.decoder.decode(RPCResponse<Result>.self, from: responseData) else {
                        failure(Error.unexpectedResponse)
                        return
                    }
                    
                    // Put back original request id
                    let idReplacedDecoded = RPCResponse<Result>(id: request.id, jsonrpc: decoded.jsonrpc, result: decoded.result, error: decoded.error)
                    
                    // Return result
                    let res = Web3Response(rpcResponse: idReplacedDecoded)
                    response(res)
                }
            }
        }
        
        // Add the pending request
        self.pendingRequests[replacedIdRequest.id] = (timeoutItem: timeoutItem, responseCompletion: responseCompletion)
        
        // Send Request through WebSocket once the responseCompletion was set
        Task {
            do {
                try await self.webSocketTask.send(requestMessage)
#if DEBUG
                print("Request: ")
                print(String(data: requestData, encoding: .utf8) ?? "Sent request")
#endif
                // Start reading messages once we have successfully sent the request
                self.readMessage()
            } catch {
                let err = Web3Response<Result>(error: .requestFailed(error))
                response(err)
            }
        }
    }
    
    
    // MARK: - Web3BidirectionalProvider
    
    public func subscribe<Params, Result>(request: RPCRequest<Params>, response: @escaping Web3ResponseCompletion<String>, onEvent: @escaping Web3ResponseCompletion<Result>) {
        self.send(request: request) { (_ resp: Web3Response<String>) -> Void in
            guard let subscriptionId = resp.result else {
                let err = Web3Response<String>(error: .serverError(resp.error))
                response(err)
                return
            }
            
            // Return subscription id
            let res = Web3Response(status: .success(subscriptionId))
            response(res)
            
            let queue = self.receiveQueue
            
            // Subscription cancelled by us or the server, not the User.
            let onCancel: () -> Void = {
                queue.async {
                    // We are done, the subscription was cancelled. We don't care why
                    self.currentSubscriptions[subscriptionId] = nil
                    
                    // Notify client
                    let err = Web3Response<Result>(error: .subscriptionCancelled(Error.subscriptionCancelled))
                    onEvent(err)
                }
            }
            
            let notificationReceived: (_ notification: String) -> Void = { notification in
                queue.async {
                    // Generic failure sender
                    let failure: (_ error: Error) -> () = { error in
                        let err = Web3Response<Result>(error: .serverError(error))
                        onEvent(err)
                        return
                    }
                    
                    // Parse notification
                    guard let notificationData = notification.data(using: .utf8), let decoded = try? self.decoder.decode(RPCEventResponse<Result>.self, from: notificationData) else {
                        failure(Error.unexpectedResponse)
                        return
                    }
                    
                    // Return result
                    let res = Web3Response(rpcEventResponse: decoded)
                    onEvent(res)
                }
            }
            
            // Now we need to register the subscription id to our internal subscription id register
            self.currentSubscriptions[subscriptionId] = (onCancel: onCancel, onNotification: notificationReceived)
        }
    }
    
    public func unsubscribe(subscriptionId: String, completion: @escaping (_ success: Bool) -> Void) {
        let unsubscribe = BasicRPCRequest(id: 1, jsonrpc: Web3.jsonrpc, method: "eth_unsubscribe", params: [subscriptionId])
        
        self.send(request: unsubscribe) { (_ resp: Web3Response<Bool>) -> Void in
            let success = resp.result ?? false
            if success {
                self.currentSubscriptions.getValueAsync(key: subscriptionId) { value in
                    self.receiveQueue.async {
                        value?.onCancel()
                    }
                }
            }
            
            completion(success)
        }
    }
    
    // MARK: - Helpers
    
    private struct WebSocketOnTextTmpCodable: Codable {
        let id: Int?
        
        let params: Params?
        
        fileprivate struct Params: Codable {
            let subscription: String
        }
    }
    
    // Maintain the similar to WebSocketKit handler for the URLSessionWebSocketTask
    
    private func readMessage() {
        Task {
            let message = try await webSocketTask.receive()
#if DEBUG
            print("Receive: ")
#endif
            self.receiveQueue.async {
                // Similar to WebSocketOnTextTmpCodable part with the received message
                var data: Data!;
                if case .data(let messageData) = message {
                    // Try to decode the returned data and process it further
                    data = messageData
                    
                } else if case .string(let messageString) = message {
                    guard let stringData = messageString.data(using: .utf8) else { return }
#if DEBUG
                    print(stringData)
#endif
                    data = stringData
                }
                
                guard let data = data else { return }
                
                if let tmpCodable = try? self.decoder.decode(WebSocketOnTextTmpCodable.self, from: data) {
                    if let id = tmpCodable.id {
                        self.pendingRequests.getValueAsync(key: id) { value in
                            self.receiveQueue.async {
                                guard let string = String(data: data, encoding: .utf8) else { return }
                                value?.responseCompletion(string)
                            }
                        }
                    } else if let params = tmpCodable.params {
                        self.currentSubscriptions.getValueAsync(key: params.subscription) { value in
                            self.receiveQueue.async {
                                guard let string = String(data: data, encoding: .utf8) else { return }
                                value?.onNotification(string)
                            }
                        }
                    }
                }
            }
            // Keep receiving new messages
            if !self.closed {
                self.readMessage()
            }
        }
    }
    
    
    private func reconnect(firstTime: Bool = false) throws {
        if !firstTime {
            self.closeWebSocketConnection()
        }
        // Reconnect logic
        
        let session = URLSession(configuration: .default)
        webSocketTask = session.webSocketTask(with: wsUrl)
        webSocketTask.resume()
        
        // Start listening for new messages right after the WebSocket connection established
        self.readMessage()
    }
    
    // Close the WebSocket connection when we're done.
    func closeWebSocketConnection() {
        webSocketTask.cancel(with: .normalClosure, reason: nil)
        self.closed = true
    }
    
}
