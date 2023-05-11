const modelJson = { 'coefficients': [3.2249590845866583, -0.008487893619997352, -8.289355052151508, -2.7553679060180372e-05, 0.018381381764979644, 6.682066508973032, 1.136819970260633e-07, -1.132177881582365e-05, -0.006509158078653439, -1.741753472222248] }
// Define the 2D polynomial function
function polynomialFeatures2D({ time, profit, degree }: { time: number; profit: number; degree: number; }): number[] {
    const features = [1];
    for (let i = 1; i <= degree; i++) {
        for (let j = 0; j <= i; j++) {
            features.push(Math.pow(time, i - j) * Math.pow(profit, j));
        }
    }
    return features;
}

function polynomial2DFunction(time: number, profit: number): number {
    const degree = 3;
    const features = polynomialFeatures2D({ time, profit, degree });
    let result = 0;

    for (let i = 0; i < features.length; i++) {
        result += modelJson.coefficients[i] * features[i];
    }

    return result;
}

// Define the calculateProfitProbability function
export function calculateProfitProbability({ delta, ttf }: { delta: number; ttf: number }): number {
    return polynomial2DFunction(ttf, delta);
}
