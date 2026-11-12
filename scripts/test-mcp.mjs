import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverEntry = path.resolve(__dirname, '../dist/index.js');

function parseTextJson(callResult) {
  assert.ok(Array.isArray(callResult.content) && callResult.content.length > 0, 'Expected content array');
  const first = callResult.content[0];
  assert.equal(first.type, 'text', 'Expected text content block');
  return JSON.parse(first.text);
}

async function runTests() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverEntry],
    stderr: 'pipe',
  });

  const client = new Client(
    { name: 'chinastay-mcp-test-client', version: '1.0.0' },
    { capabilities: {} }
  );

  try {
    await client.connect(transport);
    console.log('✓ Connected to ChinaStay MCP server over stdio');

    // 1. Verify tools/list
    const { tools } = await client.listTools();
    const toolNames = tools.map((t) => t.name).sort();
    assert.deepEqual(
      toolNames,
      [
        'check_china_app_status',
        'check_china_visa_transit',
        'get_city_fixer_rates',
        'get_viral_spot_driver_card',
      ],
      'Expected exact 4 core ChinaStay MCP tools'
    );
    console.log(`✓ Verified tools/list (${toolNames.join(', ')})`);

    // 2. Verify resources/list & resources/read
    const { resources } = await client.listResources();
    assert.equal(resources.length, 4, 'Expected 4 reference resources');
    const countriesRes = await client.readResource({ uri: 'chinastay://reference/countries' });
    const countriesJson = JSON.parse(countriesRes.contents[0].text);
    assert.ok(countriesJson.totalCountries >= 57, 'Expected 57+ countries in registry');
    console.log(`✓ Verified resources/list & resources/read (${countriesJson.totalCountries} countries)`);

    // 3. Verify prompts/list & prompts/get
    const { prompts } = await client.listPrompts();
    assert.equal(prompts.length, 1, 'Expected verify_china_itinerary prompt');
    const promptRes = await client.getPrompt({
      name: 'verify_china_itinerary',
      arguments: {
        passport_country: 'United States',
        route_summary: 'LAX -> Shenzhen -> Hong Kong',
      },
    });
    assert.ok(promptRes.messages[0].content.text.includes('check_china_visa_transit'));
    console.log('✓ Verified prompts/list & prompts/get');

    // 4a. Visa Tool: US 240h valid TWOV (US -> Shenzhen -> Hong Kong)
    const usValid = await client.callTool({
      name: 'check_china_visa_transit',
      arguments: {
        passport_country: 'US',
        origin_country: 'United States',
        entry_port: 'Shenzhen',
        onward_country: 'Hong Kong',
        planned_stay_hours: 144,
      },
    });
    assert.ok(!usValid.isError);
    const usValidJson = parseTextJson(usValid);
    assert.equal(usValidJson.verdict.status, 'ELIGIBLE_TWOV');
    assert.equal(usValidJson.entryPort.code, 'SZX');
    assert.equal(
      usValidJson.officialDeepLinks.countryGuide,
      'https://chinastay.org/visa-free/us-citizens-240-hour-china-transit/'
    );
    console.log('✓ check_china_visa_transit: US -> Shenzhen (SZX) -> Hong Kong = ELIGIBLE_TWOV');

    // 4b. Visa Tool: US Round-Trip Rejection Trap (US -> Shanghai -> US)
    const usRoundTrip = await client.callTool({
      name: 'check_china_visa_transit',
      arguments: {
        passport_country: 'United States',
        origin_country: 'USA',
        entry_port: 'PVG',
        onward_country: 'United States',
      },
    });
    const usRoundTripJson = parseTextJson(usRoundTrip);
    assert.equal(usRoundTripJson.verdict.status, 'INELIGIBLE_SAME_COUNTRY');
    console.log('✓ check_china_visa_transit: US round-trip trap caught (INELIGIBLE_SAME_COUNTRY)');

    // 4c. Visa Tool: Direct 30-day Visa-Free (France)
    const frDirect = await client.callTool({
      name: 'check_china_visa_transit',
      arguments: { passport_country: 'France' },
    });
    const frDirectJson = parseTextJson(frDirect);
    assert.equal(frDirectJson.verdict.status, 'DIRECT_VISA_FREE');
    assert.equal(frDirectJson.verdict.maxDays, 30);
    console.log('✓ check_china_visa_transit: France = DIRECT_VISA_FREE (30 days)');

    // 4d. Visa Tool: Unknown passport returns isError: true
    const badVisa = await client.callTool({
      name: 'check_china_visa_transit',
      arguments: { passport_country: 'Atlantis' },
    });
    assert.equal(badVisa.isError, true);
    console.log('✓ check_china_visa_transit: Unknown passport returns isError=true');

    // 5a. App Tool: Google Maps 500m GPS shift & Wi-Fi block
    const gmaps = await client.callTool({
      name: 'check_china_app_status',
      arguments: { query: 'Google Maps' },
    });
    const gmapsJson = parseTextJson(gmaps);
    assert.equal(gmapsJson.results[0].id, 'google-maps');
    assert.equal(gmapsJson.results[0].wifi.status, 'blocked');
    assert.equal(gmapsJson.results[0].deepLink, 'https://chinastay.org/app-checker/google-maps/');
    console.log('✓ check_china_app_status: Google Maps deep link & status verified');

    // 5b. App Tool: Uber synonym maps cleanly to Didi
    const uber = await client.callTool({
      name: 'check_china_app_status',
      arguments: { query: 'uber' },
    });
    const uberJson = parseTextJson(uber);
    assert.ok(uberJson.results.some((r) => r.id === 'didi'));
    assert.ok(uberJson.note.includes('Uber exited Mainland China'));
    console.log('✓ check_china_app_status: Uber -> DiDi synonym mapping verified');

    // 5c. App Tool: Unknown app returns isError: true
    const badApp = await client.callTool({
      name: 'check_china_app_status',
      arguments: { query: 'NonExistentAppXYZ123' },
    });
    assert.equal(badApp.isError, true);
    console.log('✓ check_china_app_status: Unknown app returns isError=true');

    // 6a. Viral Spot Tool: Shenzhen Drone Delivery flashcard
    const drone = await client.callTool({
      name: 'get_viral_spot_driver_card',
      arguments: { query: 'drone', city: 'Shenzhen' },
    });
    const droneJson = parseTextJson(drone);
    assert.equal(droneJson.totalMatched, 1);
    assert.ok(droneJson.spots[0].chineseTaxiDriverCard.didiDestinationChinese.includes('深圳湾'));
    assert.equal(
      droneJson.spots[0].deepLinks.spotAnchorUrl,
      'https://chinastay.org/viral-coordinates/#shenzhen-meituan-drone-delivery'
    );
    console.log('✓ get_viral_spot_driver_card: Shenzhen drone spot + taxi flashcard verified');

    // 6b. Viral Spot Tool: Unknown spot returns isError=true
    const badSpot = await client.callTool({
      name: 'get_viral_spot_driver_card',
      arguments: { city: 'Atlantis' },
    });
    assert.equal(badSpot.isError, true);
    console.log('✓ get_viral_spot_driver_card: Unknown spot returns isError=true');

    // 7a. City Fixer Tool: Shenzhen dossier
    const szFixer = await client.callTool({
      name: 'get_city_fixer_rates',
      arguments: { city: 'Shenzhen' },
    });
    const szFixerJson = parseTextJson(szFixer);
    assert.equal(szFixerJson.city.slug, 'shenzhen');
    assert.equal(
      szFixerJson.deepLinks.fixerBookingPage,
      'https://chinastay.org/city-guides/shenzhen/local-translator/'
    );
    console.log('✓ get_city_fixer_rates: Shenzhen fixer dossier verified');

    // 7b. City Fixer Tool: Overview of all 7 cities
    const allFixers = await client.callTool({
      name: 'get_city_fixer_rates',
      arguments: {},
    });
    const allFixersJson = parseTextJson(allFixers);
    assert.equal(allFixersJson.coveredCities.length, 7);
    console.log('✓ get_city_fixer_rates: 7 covered cities overview verified');

    // 7c. City Fixer Tool: Unknown city returns isError=true
    const badCity = await client.callTool({
      name: 'get_city_fixer_rates',
      arguments: { city: 'Timbuktu' },
    });
    assert.equal(badCity.isError, true);
    console.log('✓ get_city_fixer_rates: Unknown city returns isError=true');

    console.log('\nALL MCP END-TO-END PROTOCOL TESTS PASSED.');
  } finally {
    await transport.close();
  }
}

runTests().catch((err) => {
  console.error('MCP Test Failed:', err);
  process.exit(1);
});
