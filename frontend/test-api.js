// Test API calls
import { locationService, sectorService } from './services';

console.log('Testing API calls...');

// Test locations
locationService.getLocations()
  .then(data => {
    console.log('✅ Locations API Success:', data);
    return sectorService.getSectors();
  })
  .then(data => {
    console.log('✅ Sectors API Success:', data);
    console.log('All API tests passed!');
  })
  .catch(error => {
    console.error('❌ API Error:', error);
  });