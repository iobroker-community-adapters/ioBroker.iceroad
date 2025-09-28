# ioBroker Adapter Development with GitHub Copilot

**Version:** 0.4.0
**Template Source:** https://github.com/DrozmotiX/ioBroker-Copilot-Instructions

This file contains instructions and best practices for GitHub Copilot when working on ioBroker adapter development.

## Project Context

You are working on an ioBroker adapter. ioBroker is an integration platform for the Internet of Things, focused on building smart home and industrial IoT solutions. Adapters are plugins that connect ioBroker to external systems, devices, or services.

### Ice Road Adapter Specific Context

This is the **iceroad** adapter for ioBroker, designed to provide ice warning forecasts for windshields using the German eiswarnung.de REST API service.

**Primary Functions:**
- Fetches ice warning data from eiswarnung.de API for multiple locations
- Processes weather data to determine ice formation risks on windshields  
- Supports up to 5 different locations with individual API keys
- Provides hourly scheduled data updates
- Sends notifications via multiple channels (Email, Pushover, Telegram, WhatsApp, Jarvis, Lovelace, Synochat)
- Implements reminder functionality for ice warnings

**Key Technical Details:**
- **API Service:** https://www.eiswarnung.de/rest-api/ (German ice warning service)
- **Execution Mode:** Scheduled (hourly: `0 * * * *`)
- **Data Source:** External REST API (cloud-based)
- **Target Region:** Germany (GPS coordinates required)
- **API Requirements:** Free API key per location from eiswarnung.de
- **Location Input:** Longitude/Latitude coordinates (can be auto-populated from ioBroker system settings)

**Configuration Structure:**
- Multiple location support (Location_Name1-5, APIK1-5)
- Individual notification settings per location
- Reminder system with configurable hours
- Integration with various messaging adapters

**Notification Integrations:**
- Email (via ioBroker email adapter)
- Pushover (with device/priority settings)
- Telegram (with chat ID support)
- WhatsApp (phone number based)
- Jarvis (smart home assistant)
- Lovelace (dashboard integration)
- Synochat (Synology chat)

## Testing

### Unit Testing
- Use Jest as the primary testing framework for ioBroker adapters
- Create tests for all adapter main functions and helper methods
- Test error handling scenarios and edge cases
- Mock external API calls and hardware dependencies
- For adapters connecting to APIs/devices not reachable by internet, provide example data files to allow testing of functionality without live connections
- Example test structure:
  ```javascript
  describe('AdapterName', () => {
    let adapter;
    
    beforeEach(() => {
      // Setup test adapter instance
    });
    
    test('should initialize correctly', () => {
      // Test adapter initialization
    });
  });
  ```

### Integration Testing

**IMPORTANT**: Use the official `@iobroker/testing` framework for all integration tests. This is the ONLY correct way to test ioBroker adapters.

**Official Documentation**: https://github.com/ioBroker/testing

#### Framework Structure
Integration tests MUST follow this exact pattern:

```javascript
const path = require('path');
const { tests } = require('@iobroker/testing');

// Define test coordinates or configuration
const TEST_COORDINATES = '52.520008,13.404954'; // Berlin
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Use tests.integration() with defineAdditionalTests
tests.integration(path.join(__dirname, '..'), {
    defineAdditionalTests({ suite }) {
        suite('Test adapter with specific configuration', (getHarness) => {
            let harness;

            before(() => {
                harness = getHarness();
            });

            it('should configure and start adapter', function () {
                return new Promise(async (resolve, reject) => {
                    try {
                        harness = getHarness();
                        
                        // Get adapter object using promisified pattern
                        const obj = await new Promise((res, rej) => {
                            harness.objects.getObject('system.adapter.your-adapter.0', (err, o) => {
                                if (err) return rej(err);
                                res(o);
                            });
                        });
                        
                        if (!obj) {
                            return reject(new Error('Adapter object not found'));
                        }

                        // Configure adapter properties
                        Object.assign(obj.native, {
                            position: TEST_COORDINATES,
                            createCurrently: true,
                            createHourly: true,
                            createDaily: true,
                            // Add other configuration as needed
                        });

                        // Set the updated configuration
                        harness.objects.setObject(obj._id, obj);

                        console.log('✅ Step 1: Configuration written, starting adapter...');
                        
                        // Start adapter and wait
                        await harness.startAdapterAndWait();
                        
                        console.log('✅ Step 2: Adapter started');

                        // Wait for adapter to process data
                        const waitMs = 15000;
                        await wait(waitMs);

                        console.log('🔍 Step 3: Checking states after adapter run...');
                        
                        // Verify that data states have been created
                        const states = await harness.states.getKeysAsync('your-adapter.0.*');
                        console.log(`Found ${states.length} states`);
                        
                        // Check specific states
                        const currentState = await harness.states.getStateAsync('your-adapter.0.info.connection');
                        console.log(`Connection state: ${currentState ? currentState.val : 'not found'}`);
                        
                        // Additional verification
                        if (currentState) {
                            console.log('✅ Step 4: Verification completed successfully');
                            resolve();
                        } else {
                            reject(new Error('Expected states not found after adapter run'));
                        }
                        
                    } catch (error) {
                        console.error('❌ Test failed:', error.message);
                        reject(error);
                    }
                });
            });
        });
    }
});
```

#### Testing Best Practices for Adapters with External APIs

Many ioBroker adapters interact with external APIs that require authentication or specific network conditions. Here's how to handle testing effectively:

**1. Separation of Concerns**
- **Unit Tests**: Test internal logic without external dependencies  
- **Integration Tests (Local)**: Test adapter initialization and ioBroker integration without API calls
- **API Tests (Separate)**: Test actual API connectivity with real credentials

**2. API Testing Strategy**
```javascript
// test/integration-api.js - Separate file for API testing
const path = require('path');
const { tests } = require('@iobroker/testing');

// Only run if API credentials are available
const API_KEY = process.env.EISWARNUNG_API_KEY;
const TEST_COORDS = '52.520008,13.404954'; // Berlin coordinates

if (API_KEY) {
    tests.integration(path.join(__dirname, '..'), {
        defineAdditionalTests({ suite }) {
            suite('API Integration Tests', (getHarness) => {
                it('should fetch data from eiswarnung.de API', async function() {
                    this.timeout(30000); // API calls may take time
                    
                    const harness = getHarness();
                    
                    // Configure adapter with real API key
                    await harness.changeAdapterConfig('iceroad', {
                        native: {
                            'Location_Name1': 'Test Location',
                            'APIK1': API_KEY,
                            'long1': '13.404954',
                            'lat1': '52.520008'
                        }
                    });
                    
                    await harness.startAdapter();
                    await new Promise(resolve => setTimeout(resolve, 15000));
                    
                    // Verify API data was received
                    const weatherState = await harness.states.getStateAsync('iceroad.0.Location_1.forecast');
                    expect(weatherState).to.not.be.null;
                    expect(weatherState.val).to.not.be.empty;
                });
            });
        }
    });
} else {
    console.log('Skipping API tests - EISWARNUNG_API_KEY not provided');
}
```

**3. Mocking External Dependencies**
For regular integration tests, mock the API responses:

```javascript
// Mock axios for predictable testing
const mockAxiosResponse = {
    data: {
        forecast: 'Test ice warning data',
        temperature: -2,
        risk_level: 'high'
    }
};

// In your test setup
beforeEach(() => {
    // Mock axios if adapter uses it for API calls
    sinon.stub(axios, 'get').resolves(mockAxiosResponse);
});
```

### Ice Road Adapter Specific Testing

For the iceroad adapter, consider these specific test scenarios:

**API Response Handling:**
- Test parsing of eiswarnung.de API responses
- Test handling of multiple locations
- Test coordinate format conversion (comma to fullstop handling)
- Test timeout handling (10-second timeout configured)

**Notification Testing:**
- Mock notification adapters (pushover, telegram, email)
- Test reminder functionality with different hour settings
- Test notification triggering based on ice warning levels

**Configuration Testing:**
- Test auto-population of coordinates from ioBroker system settings
- Test validation of GPS coordinates
- Test API key validation per location

```javascript
// Example test for coordinate handling
it('should convert comma coordinates to fullstop format', () => {
    const adapter = new IceroadAdapter();
    const result = adapter.formatCoordinates('52,520008', '13,404954');
    expect(result.lat).to.equal('52.520008');
    expect(result.lng).to.equal('13.404954');
});

// Example test for API timeout configuration
it('should respect 10-second timeout for axios requests', () => {
    const adapter = new IceroadAdapter();
    const axiosConfig = adapter.getAxiosConfig();
    expect(axiosConfig.timeout).to.equal(10000);
});
```

## ioBroker Adapter Patterns

### Adapter Lifecycle
```javascript
class MyAdapter extends utils.Adapter {
  constructor(options = {}) {
    super({
      ...options,
      name: 'myadapter',
    });
    this.on('ready', this.onReady.bind(this));
    this.on('unload', this.onUnload.bind(this));
  }

  async onReady() {
    // Initialize adapter
    this.log.info('Adapter started');
    
    // Set up connection monitoring
    this.setState('info.connection', false, true);
  }

  onUnload(callback) {
    try {
      // Clear timeouts/intervals
      if (this.connectionTimer) {
        clearTimeout(this.connectionTimer);
        this.connectionTimer = undefined;
      }
      // Close connections, clean up resources
      callback();
    } catch (e) {
      callback();
    }
  }
}
```

### State Management
```javascript
// Create states with proper configuration
await this.setObjectNotExistsAsync('data.temperature', {
  type: 'state',
  common: {
    name: 'Temperature',
    type: 'number',
    role: 'value.temperature',
    unit: '°C',
    read: true,
    write: false,
  },
  native: {},
});

// Update states with quality and timestamp
await this.setStateAsync('data.temperature', {
  val: 25.5,
  ack: true,
  ts: Date.now(),
  q: 0x00, // Good quality
});
```

### Error Handling and Logging
```javascript
try {
  const result = await this.apiCall();
  this.log.debug(`API call successful: ${JSON.stringify(result)}`);
} catch (error) {
  this.log.error(`API call failed: ${error.message}`);
  this.setState('info.connection', false, true);
  
  // For critical errors, you might want to stop the adapter
  if (error.code === 'AUTH_FAILED') {
    this.log.error('Authentication failed - check credentials');
    this.disable();
  }
}
```

### Configuration Access
```javascript
// Access adapter configuration
const apiKey = this.config.apiKey;
const updateInterval = this.config.updateInterval || 3600000; // Default 1 hour

// Validate required configuration
if (!apiKey) {
  this.log.error('API key not configured');
  return;
}
```

### Scheduled Execution
```javascript
// For adapters that run on schedule (mode: "schedule")
async onReady() {
  // Perform the scheduled task
  await this.fetchData();
  
  // Stop adapter after task completion (for schedule mode)
  this.stop?.();
}
```

### Connection Monitoring
```javascript
// Set connection state based on API availability
async checkConnection() {
  try {
    await this.testApiConnection();
    await this.setStateAsync('info.connection', true, true);
    this.log.debug('Connection to API established');
  } catch (error) {
    await this.setStateAsync('info.connection', false, true);
    this.log.warn(`Connection lost: ${error.message}`);
  }
}
```

## Code Style and Standards

- Follow JavaScript/TypeScript best practices
- Use async/await for asynchronous operations
- Implement proper resource cleanup in `unload()` method
- Use semantic versioning for adapter releases
- Include proper JSDoc comments for public methods

## CI/CD and Testing Integration

### GitHub Actions for API Testing
For adapters with external API dependencies, implement separate CI/CD jobs:

```yaml
# Tests API connectivity with demo credentials (runs separately)
demo-api-tests:
  if: contains(github.event.head_commit.message, '[skip ci]') == false
  
  runs-on: ubuntu-22.04
  
  steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Use Node.js 20.x
      uses: actions/setup-node@v4
      with:
        node-version: 20.x
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run demo API tests
      run: npm run test:integration-demo
```

### CI/CD Best Practices
- Run credential tests separately from main test suite
- Use ubuntu-22.04 for consistency
- Don't make credential tests required for deployment
- Provide clear failure messages for API connectivity issues
- Use appropriate timeouts for external API calls (120+ seconds)

### Package.json Script Integration
Add dedicated script for credential testing:
```json
{
  "scripts": {
    "test:integration-demo": "mocha test/integration-demo --exit"
  }
}
```

### Practical Example: Complete API Testing Implementation
Here's a complete example based on lessons learned from the Discovergy adapter:

#### test/integration-demo.js
```javascript
const path = require("path");
const { tests } = require("@iobroker/testing");

// Helper function to encrypt password using ioBroker's encryption method
async function encryptPassword(harness, password) {
    const systemConfig = await harness.objects.getObjectAsync("system.config");
    
    if (!systemConfig || !systemConfig.native || !systemConfig.native.secret) {
        throw new Error("Could not retrieve system secret for password encryption");
    }
    
    const secret = systemConfig.native.secret;
    let result = '';
    for (let i = 0; i < password.length; ++i) {
        result += String.fromCharCode(secret[i % secret.length].charCodeAt(0) ^ password.charCodeAt(i));
    }
    
    return result;
}

// Run integration tests with demo credentials
tests.integration(path.join(__dirname, ".."), {
    defineAdditionalTests({ suite }) {
        suite("API Testing with Demo Credentials", (getHarness) => {
            let harness;
            
            before(() => {
                harness = getHarness();
            });

            it("Should connect to API and initialize with demo credentials", async () => {
                console.log("Setting up demo credentials...");
                
                if (harness.isAdapterRunning()) {
                    await harness.stopAdapter();
                }
                
                const encryptedPassword = await encryptPassword(harness, "demo_password");
                
                await harness.changeAdapterConfig("your-adapter", {
                    native: {
                        username: "demo@provider.com",
                        password: encryptedPassword,
                        // other config options
                    }
                });

                console.log("Starting adapter with demo credentials...");
                await harness.startAdapter();
                
                // Wait for API calls and initialization
                await new Promise(resolve => setTimeout(resolve, 60000));
                
                const connectionState = await harness.states.getStateAsync("your-adapter.0.info.connection");
                
                if (connectionState && connectionState.val === true) {
                    console.log("✅ SUCCESS: API connection established");
                    return true;
                } else {
                    throw new Error("API Test Failed: Expected API connection to be established with demo credentials. " +
                        "Check logs above for specific API errors (DNS resolution, 401 Unauthorized, network issues, etc.)");
                }
            }).timeout(120000);
        });
    }
});
```

### Ice Road Adapter API Integration

For the iceroad adapter specifically, API testing should focus on:

```javascript
// test/integration-eiswarnung-api.js
const path = require("path");
const { tests } = require("@iobroker/testing");

// Test configuration with Berlin coordinates
const TEST_CONFIG = {
    'Location_Name1': 'Berlin Test',
    'APIK1': process.env.EISWARNUNG_API_KEY || 'demo_key',
    'long1': '13.404954', // Berlin longitude
    'lat1': '52.520008',  // Berlin latitude
    'mail_active1': false,
    'pushover_active1': false,
    'telegram_active1': false
};

tests.integration(path.join(__dirname, ".."), {
    defineAdditionalTests({ suite }) {
        suite("Eiswarnung API Integration", (getHarness) => {
            it("Should handle API timeout correctly", async function() {
                this.timeout(30000);
                
                const harness = getHarness();
                
                await harness.changeAdapterConfig("iceroad", {
                    native: TEST_CONFIG
                });
                
                await harness.startAdapter();
                
                // Wait for API call with 10-second timeout
                await new Promise(resolve => setTimeout(resolve, 15000));
                
                // Check if adapter handled timeout gracefully
                const connectionState = await harness.states.getStateAsync("iceroad.0.info.connection");
                
                // Either connected successfully or failed gracefully
                expect(connectionState).to.not.be.null;
                expect(typeof connectionState.val).to.equal('boolean');
            });
            
            it("Should process coordinate format conversion", async function() {
                const harness = getHarness();
                
                // Test with comma format coordinates
                const commaConfig = {
                    ...TEST_CONFIG,
                    'long1': '13,404954', // Comma format
                    'lat1': '52,520008'   // Comma format
                };
                
                await harness.changeAdapterConfig("iceroad", {
                    native: commaConfig
                });
                
                await harness.startAdapter();
                await new Promise(resolve => setTimeout(resolve, 10000));
                
                // Adapter should have converted coordinates internally
                // Check logs or states for successful processing
                const adapterLogs = harness.getLog();
                const hasCoordinateHandling = adapterLogs.some(log => 
                    log.message.includes('coordinate') || log.message.includes('location')
                );
                
                expect(hasCoordinateHandling).to.be.true;
            });
        });
    }
});
```