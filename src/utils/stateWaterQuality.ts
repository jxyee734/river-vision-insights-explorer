import { calculateWaterQualityIndex } from './predictionModel';

interface StateWaterQuality {
  state: string;
  phValue: number;
  bodLevel: number;
  ammoniacalNitrogen: number;
  suspendedSolids: number;
  waterQualityIndex: {
    index: number;
    label: string;
    color: string;
  };
}

const malaysiaStates = [
  'Johor',
  'Kedah',
  'Kelantan',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Perak',
  'Perlis',
  'Pulau Pinang',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu',
  'Kuala Lumpur',
  'Labuan',
  'Putrajaya'
];

// Generate mock water quality data for each state
export function generateStateWaterQuality(): StateWaterQuality[] {
  return malaysiaStates.map(state => {
    // Generate realistic mock data based on state characteristics
    const phValue = 6.5 + Math.random() * 2; // pH range: 6.5-8.5
    const bodLevel = 1 + Math.random() * 3; // BOD range: 1-4 mg/L
    const ammoniacalNitrogen = 0.1 + Math.random() * 0.4; // NH3-N range: 0.1-0.5 mg/L
    const suspendedSolids = 25 + Math.random() * 75; // SS range: 25-100 mg/L

    // Adjust values based on state characteristics
    const adjustedValues = adjustValuesByState(state, {
      phValue,
      bodLevel,
      ammoniacalNitrogen,
      suspendedSolids
    });

    // Calculate water quality index
    const waterQualityIndex = calculateWaterQualityIndex(
      adjustedValues.phValue,
      adjustedValues.bodLevel,
      adjustedValues.ammoniacalNitrogen,
      adjustedValues.suspendedSolids
    );

    return {
      state,
      ...adjustedValues,
      waterQualityIndex
    };
  });
}

function adjustValuesByState(state: string, values: {
  phValue: number;
  bodLevel: number;
  ammoniacalNitrogen: number;
  suspendedSolids: number;
}) {
  let adjustedValues = { ...values };

  // Adjust values based on state characteristics
  switch (state) {
    case 'Selangor':
    case 'Kuala Lumpur':
    case 'Putrajaya':
      // Urban areas tend to have slightly worse water quality
      adjustedValues.bodLevel *= 1.2;
      adjustedValues.ammoniacalNitrogen *= 1.3;
      adjustedValues.suspendedSolids *= 1.2;
      break;

    case 'Pahang':
    case 'Kelantan':
    case 'Terengganu':
      // East coast states during monsoon season
      adjustedValues.suspendedSolids *= 1.4;
      adjustedValues.bodLevel *= 0.9;
      break;

    case 'Sabah':
    case 'Sarawak':
      // Better water quality due to less development
      adjustedValues.bodLevel *= 0.8;
      adjustedValues.ammoniacalNitrogen *= 0.7;
      adjustedValues.suspendedSolids *= 0.9;
      break;

    case 'Penang':
    case 'Melaka':
      // Coastal urban areas
      adjustedValues.bodLevel *= 1.1;
      adjustedValues.ammoniacalNitrogen *= 1.2;
      break;

    default:
      // Other states maintain baseline values
      break;
  }

  // Ensure values stay within realistic ranges
  adjustedValues.phValue = Math.min(Math.max(adjustedValues.phValue, 6.0), 9.0);
  adjustedValues.bodLevel = Math.min(Math.max(adjustedValues.bodLevel, 0.5), 6.0);
  adjustedValues.ammoniacalNitrogen = Math.min(Math.max(adjustedValues.ammoniacalNitrogen, 0.1), 1.0);
  adjustedValues.suspendedSolids = Math.min(Math.max(adjustedValues.suspendedSolids, 20), 150);

  return adjustedValues;
}