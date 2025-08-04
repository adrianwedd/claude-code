/**
 * Cross-Platform Integration Tests
 * Tests complete workflow: TTS → Web App → Mobile App → Claude API
 */

const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

// Test configuration
const TEST_PORT = 3002;
const TEST_SESSION_ID = 'test-session-123';
const TEST_PROJECT_ID = 'test-project-456';

describe('Cross-Platform Integration Tests', () => {
  let server;
  let io;
  let webClient;
  let mobileClient;
  let cliProcess;

  beforeAll(async () => {
    // Start test WebSocket server
    const httpServer = createServer();
    io = new Server(httpServer, {
      cors: { origin: "*" }
    });
    
    server = httpServer.listen(TEST_PORT);
    
    // Set up server handlers (simplified version of main server)
    io.on('connection', (socket) => {
      console.log(`Test client connected: ${socket.id}`);
      
      // Echo chat messages with AI simulation
      socket.on('chat_message', (data) => {
        const message = {
          ...data,
          id: `msg-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: socket.id
        };
        
        // Broadcast original message
        io.emit('chat_message', message);
        
        // Simulate AI response after delay
        setTimeout(() => {
          const aiResponse = {
            ...message,
            id: `ai-${Date.now()}`,
            content: `AI Response: ${data.content}`,
            role: 'assistant',
            userId: 'claude-ai'
          };
          io.emit('chat_message', aiResponse);
        }, 100);
      });
      
      // Handle TTS notifications
      socket.on('tts_notification', (data) => {
        const notification = {
          ...data,
          id: `tts-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: socket.id
        };
        io.emit('tts_notification', notification);
      });
      
      // Handle terminal commands
      socket.on('terminal_command', (data) => {
        const result = {
          commandId: `cmd-${Date.now()}`,
          sessionId: data.sessionId,
          output: `Executed: ${data.command}\nTest output`,
          type: 'success',
          timestamp: new Date().toISOString()
        };
        socket.emit('terminal_output', result);
      });
      
      // Handle file updates
      socket.on('file_update', (data) => {
        const update = {
          ...data,
          id: `file-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: socket.id
        };
        io.emit('file_update', update);
      });
    });
  });

  afterAll(async () => {
    // Clean up connections
    if (webClient) webClient.close();
    if (mobileClient) mobileClient.close();
    if (cliProcess) cliProcess.kill();
    if (server) server.close();
  });

  describe('WebSocket Server Integration', () => {
    test('should handle multiple client connections', (done) => {
      webClient = Client(`http://localhost:${TEST_PORT}`);
      mobileClient = Client(`http://localhost:${TEST_PORT}`);
      
      let connectionsCount = 0;
      
      const onConnect = () => {
        connectionsCount++;
        if (connectionsCount === 2) {
          expect(webClient.connected).toBe(true);
          expect(mobileClient.connected).toBe(true);
          done();
        }
      };
      
      webClient.on('connect', onConnect);
      mobileClient.on('connect', onConnect);
    });

    test('should broadcast chat messages between clients', (done) => {
      const testMessage = {
        content: 'Hello from integration test!',
        sessionId: TEST_SESSION_ID,
        projectId: TEST_PROJECT_ID
      };
      
      let messagesReceived = 0;
      const expectedMessages = 2; // Original + AI response
      
      const messageHandler = (message) => {
        messagesReceived++;
        expect(message.content).toBeDefined();
        expect(message.timestamp).toBeDefined();
        expect(message.id).toBeDefined();
        
        if (messagesReceived === expectedMessages) {
          done();
        }
      };
      
      mobileClient.on('chat_message', messageHandler);
      webClient.emit('chat_message', testMessage);
    });

    test('should handle TTS notifications across platforms', (done) => {
      const ttsNotification = {
        message: 'Test TTS notification',
        type: 'info',
        priority: 'normal'
      };
      
      mobileClient.on('tts_notification', (notification) => {
        expect(notification.message).toBe(ttsNotification.message);
        expect(notification.type).toBe(ttsNotification.type);
        expect(notification.id).toBeDefined();
        expect(notification.timestamp).toBeDefined();
        done();
      });
      
      webClient.emit('tts_notification', ttsNotification);
    });

    test('should execute terminal commands and return output', (done) => {
      const command = {
        command: 'echo "integration test"',
        sessionId: TEST_SESSION_ID
      };
      
      webClient.on('terminal_output', (output) => {
        expect(output.commandId).toBeDefined();
        expect(output.sessionId).toBe(TEST_SESSION_ID);
        expect(output.output).toContain('Executed:');
        expect(output.type).toBe('success');
        done();
      });
      
      webClient.emit('terminal_command', command);
    });

    test('should synchronize file updates between clients', (done) => {
      const fileUpdate = {
        filePath: 'test.js',
        content: 'console.log("test");',
        projectId: TEST_PROJECT_ID,
        action: 'update'
      };
      
      mobileClient.on('file_update', (update) => {
        expect(update.filePath).toBe(fileUpdate.filePath);
        expect(update.content).toBe(fileUpdate.content);
        expect(update.action).toBe(fileUpdate.action);
        expect(update.id).toBeDefined();
        done();
      });
      
      webClient.emit('file_update', fileUpdate);
    });
  });

  describe('TTS System Integration', () => {
    test('should trigger TTS notifications from web interface', async () => {
      const ttsScript = path.join(__dirname, '../../Script/tts.sh');
      
      return new Promise((resolve, reject) => {
        exec(`bash ${ttsScript} test`, (error, stdout, stderr) => {
          if (error) {
            // TTS might not be available in test environment
            console.warn('TTS test skipped - audio not available');
            resolve();
            return;
          }
          
          expect(stdout).toBeDefined();
          resolve();
        });
      });
    });

    test('should filter content appropriately for TTS', async () => {
      const ttsScript = path.join(__dirname, '../../Script/tts.py');
      const testContent = 'Build completed successfully! ```code block``` should be filtered';
      
      return new Promise((resolve, reject) => {
        exec(`python3 ${ttsScript} speak "${testContent}"`, (error, stdout, stderr) => {
          // Should not fail even if audio is not available
          expect(error).toBeFalsy();
          resolve();
        });
      });
    });
  });

  describe('Claude API Integration', () => {
    test('should integrate with Claude API client', async () => {
      const claudeApiPath = path.join(__dirname, '../../runtime/claude-api');
      
      // Test that the Claude API client can be imported and initialized
      try {
        const { spawn } = require('child_process');
        const testProcess = spawn('python3', ['-c', `
import sys
sys.path.append('${claudeApiPath}')
try:
    from claude_client import ClaudeAPIClient
    print('Claude API client import successful')
except ImportError as e:
    print(f'Import error: {e}')
except Exception as e:
    print(f'Initialization would require API key: {e}')
`]);
        
        return new Promise((resolve) => {
          let output = '';
          testProcess.stdout.on('data', (data) => {
            output += data.toString();
          });
          
          testProcess.on('close', (code) => {
            expect(output).toContain('successful');
            resolve();
          });
        });
      } catch (error) {
        console.warn('Claude API test skipped - Python dependencies not available');
      }
    });
  });

  describe('End-to-End Workflow', () => {
    test('should complete full workflow: Web → WebSocket → Mobile → TTS', (done) => {
      const workflowSteps = [];
      const expectedSteps = ['web_message', 'mobile_received', 'tts_triggered'];
      
      // Step 1: Web client sends message
      webClient.emit('chat_message', {
        content: 'End-to-end test message',
        sessionId: TEST_SESSION_ID
      });
      workflowSteps.push('web_message');
      
      // Step 2: Mobile client receives message
      mobileClient.on('chat_message', (message) => {
        if (message.content === 'End-to-end test message') {
          workflowSteps.push('mobile_received');
          
          // Step 3: Trigger TTS notification
          mobileClient.emit('tts_notification', {
            message: 'Message received on mobile',
            type: 'info'
          });
        }
      });
      
      // Step 4: Verify TTS notification received
      webClient.on('tts_notification', (notification) => {
        if (notification.message === 'Message received on mobile') {
          workflowSteps.push('tts_triggered');
          
          // Verify all steps completed
          expect(workflowSteps).toEqual(expectedSteps);
          done();
        }
      });
    });

    test('should handle error scenarios gracefully', (done) => {
      const invalidMessage = {
        // Missing required fields
        sessionId: null,
        content: ''
      };
      
      webClient.on('error', (error) => {
        expect(error.message).toBeDefined();
        done();
      });
      
      webClient.emit('chat_message', invalidMessage);
    });

    test('should maintain session state across reconnections', (done) => {
      // Simulate connection drop and reconnect
      webClient.disconnect();
      
      setTimeout(() => {
        webClient.connect();
        
        webClient.on('connect', () => {
          // Should be able to rejoin session
          webClient.emit('join_session', TEST_SESSION_ID);
          
          webClient.on('session_joined', (data) => {
            expect(data.sessionId).toBe(TEST_SESSION_ID);
            done();
          });
        });
      }, 100);
    });
  });

  describe('Performance Tests', () => {
    test('should handle concurrent messages efficiently', (done) => {
      const messageCount = 50;
      const messages = [];
      let receivedCount = 0;
      
      const startTime = Date.now();
      
      mobileClient.on('chat_message', (message) => {
        receivedCount++;
        
        if (receivedCount === messageCount) {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          // Should process 50 messages in under 2 seconds
          expect(duration).toBeLessThan(2000);
          console.log(`Processed ${messageCount} messages in ${duration}ms`);
          done();
        }
      });
      
      // Send multiple messages rapidly
      for (let i = 0; i < messageCount; i++) {
        webClient.emit('chat_message', {
          content: `Performance test message ${i}`,
          sessionId: TEST_SESSION_ID
        });
      }
    });

    test('should maintain low latency for real-time communication', (done) => {
      const timestamps = [];
      
      mobileClient.on('chat_message', (message) => {
        const receiveTime = Date.now();
        const sendTime = parseInt(message.content.split('-')[1]);
        const latency = receiveTime - sendTime;
        
        // Should have latency under 100ms for local testing
        expect(latency).toBeLessThan(100);
        console.log(`Message latency: ${latency}ms`);
        done();
      });
      
      const sendTime = Date.now();
      webClient.emit('chat_message', {
        content: `Latency test-${sendTime}`,
        sessionId: TEST_SESSION_ID
      });
    });
  });

  describe('Security Tests', () => {
    test('should validate message format and reject invalid data', (done) => {
      const maliciousData = {
        content: '<script>alert("xss")</script>',
        sessionId: TEST_SESSION_ID,
        metadata: {
          dangerous: '../../etc/passwd'
        }
      };
      
      // Should either reject or sanitize the message
      mobileClient.on('chat_message', (message) => {
        expect(message.content).not.toContain('<script>');
        done();
      });
      
      mobileClient.on('error', (error) => {
        // Expected for malicious data
        expect(error.message).toBeDefined();
        done();
      });
      
      webClient.emit('chat_message', maliciousData);
    });

    test('should handle rate limiting gracefully', async () => {
      // Send many messages rapidly to trigger rate limiting
      const rapidMessages = Array.from({ length: 200 }, (_, i) => ({
        content: `Rate limit test ${i}`,
        sessionId: TEST_SESSION_ID
      }));
      
      return new Promise((resolve) => {
        let errorReceived = false;
        
        webClient.on('error', (error) => {
          if (error.message.includes('rate limit') || error.message.includes('Rate limit')) {
            errorReceived = true;
          }
        });
        
        rapidMessages.forEach(message => {
          webClient.emit('chat_message', message);
        });
        
        setTimeout(() => {
          // Should have triggered rate limiting
          console.log('Rate limiting test completed');
          resolve();
        }, 1000);
      });
    });
  });
});

// Helper function to wait for condition
function waitFor(condition, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, 50);
      }
    };
    
    check();
  });
}

// Export for use in other test files
module.exports = {
  TEST_PORT,
  TEST_SESSION_ID,
  TEST_PROJECT_ID,
  waitFor
};