// Sample data for all 36 Nigerian states + FCT with updated pricing
const nigerianStatesDeliveryFees = [
  // Lagos - Split into Mainland and Island
  { state: 'Lagos Mainland', fee: 4500, zone: 'South-West', estimatedDays: 2 },
  { state: 'Lagos Island', fee: 5000, zone: 'South-West', estimatedDays: 2 },
  
  // Abuja
  { state: 'Abuja', fee: 5000, zone: 'North-Central', estimatedDays: 3 },
  
  // South-West (excluding Lagos)
  { state: 'Ogun', fee: 6000, zone: 'South-West', estimatedDays: 3 },
  { state: 'Oyo', fee: 6000, zone: 'South-West', estimatedDays: 3 },
  { state: 'Osun', fee: 6000, zone: 'South-West', estimatedDays: 4 },
  { state: 'Ondo', fee: 6000, zone: 'South-West', estimatedDays: 4 },
  { state: 'Ekiti', fee: 6000, zone: 'South-West', estimatedDays: 4 },
  
  // South-South
  { state: 'Rivers', fee: 6000, zone: 'South-South', estimatedDays: 4 },
  { state: 'Delta', fee: 6000, zone: 'South-South', estimatedDays: 4 },
  { state: 'Edo', fee: 6000, zone: 'South-South', estimatedDays: 4 },
  { state: 'Akwa Ibom', fee: 6000, zone: 'South-South', estimatedDays: 5 },
  { state: 'Cross River', fee: 6000, zone: 'South-South', estimatedDays: 5 },
  { state: 'Bayelsa', fee: 6000, zone: 'South-South', estimatedDays: 6 },
  
  // South-East
  { state: 'Anambra', fee: 6000, zone: 'South-East', estimatedDays: 4 },
  { state: 'Enugu', fee: 6000, zone: 'South-East', estimatedDays: 4 },
  { state: 'Imo', fee: 6000, zone: 'South-East', estimatedDays: 4 },
  { state: 'Abia', fee: 6000, zone: 'South-East', estimatedDays: 4 },
  { state: 'Ebonyi', fee: 6000, zone: 'South-East', estimatedDays: 5 },
  
  // North-Central (excluding Abuja)
  { state: 'Niger', fee: 6000, zone: 'North-Central', estimatedDays: 4 },
  { state: 'Kwara', fee: 6000, zone: 'North-Central', estimatedDays: 4 },
  { state: 'Kogi', fee: 6000, zone: 'North-Central', estimatedDays: 4 },
  { state: 'Benue', fee: 6000, zone: 'North-Central', estimatedDays: 5 },
  { state: 'Plateau', fee: 6000, zone: 'North-Central', estimatedDays: 5 },
  { state: 'Nasarawa', fee: 6000, zone: 'North-Central', estimatedDays: 4 },
  
  // North-West
  { state: 'Kaduna', fee: 6000, zone: 'North-West', estimatedDays: 5 },
  { state: 'Kano', fee: 6000, zone: 'North-West', estimatedDays: 5 },
  { state: 'Katsina', fee: 6000, zone: 'North-West', estimatedDays: 6 },
  { state: 'Sokoto', fee: 6000, zone: 'North-West', estimatedDays: 6 },
  { state: 'Zamfara', fee: 6000, zone: 'North-West', estimatedDays: 6 },
  { state: 'Kebbi', fee: 6000, zone: 'North-West', estimatedDays: 6 },
  { state: 'Jigawa', fee: 6000, zone: 'North-West', estimatedDays: 6 },
  
  // North-East
  { state: 'Adamawa', fee: 6000, zone: 'North-East', estimatedDays: 6 },
  { state: 'Bauchi', fee: 6000, zone: 'North-East', estimatedDays: 5 },
  { state: 'Borno', fee: 6000, zone: 'North-East', estimatedDays: 7 },
  { state: 'Gombe', fee: 6000, zone: 'North-East', estimatedDays: 6 },
  { state: 'Taraba', fee: 6000, zone: 'North-East', estimatedDays: 6 },
  { state: 'Yobe', fee: 6000, zone: 'North-East', estimatedDays: 7 }
];

module.exports = nigerianStatesDeliveryFees;