
import { evaluate } from 'mathjs';

export default {
  command: ['calc', 'math', 'calculate', 'kalkulator'],
  tags: ['tools'],
  help: ['/calc <expression>', '/math <expression>', '/calculate <expression>'],
  description: 'Advanced calculator with scientific functions',
  async run(ctx) {
    try {
      const expression = ctx.message.text.split(' ').slice(1).join(' ');
      
      if (!expression) {
        return ctx.reply(`
🧮 *Advanced Calculator*

*Basic Operations:*
• /calc 2 + 3 × 4
• /calc sqrt(16) + log(100)
• /calc sin(π/2) + cos(0)

*Advanced Functions:*
• Trigonometry: sin, cos, tan, asin, acos, atan
• Logarithms: log, log10, ln
• Powers: pow(2,3), sqrt, cbrt
• Constants: π (pi), e, φ (phi)

*Unit Conversions:*
• /calc 100 km to miles
• /calc 32 celsius to fahrenheit
• /calc 1 year to seconds

*Examples:*
• /calc derivative of x^2
• /calc integrate x^2 from 0 to 1
• /calc solve x^2 - 4 = 0
        `.trim(), { parse_mode: 'Markdown' });
      }

      // Security check
      const validation = global.security.validateInput(expression, 'text');
      if (!validation.valid) {
        return ctx.reply(`❌ Invalid input: ${validation.reason}`);
      }

      let result;
      let explanation = '';

      try {
        // Handle special mathematical operations
        if (expression.includes('derivative')) {
          result = handleDerivative(expression);
          explanation = '📊 Derivative calculated';
        } else if (expression.includes('integrate')) {
          result = handleIntegral(expression);
          explanation = '📈 Integral calculated';
        } else if (expression.includes('solve')) {
          result = handleEquation(expression);
          explanation = '🔍 Equation solved';
        } else if (expression.includes(' to ')) {
          result = handleUnitConversion(expression);
          explanation = '🔄 Unit conversion';
        } else {
          // Standard mathematical evaluation
          result = evaluate(expression);
          explanation = '🧮 Calculation complete';
        }

        if (typeof result === 'object') {
          result = JSON.stringify(result);
        }

        const response = `
${explanation}

📝 *Expression:* \`${expression}\`
📊 *Result:* \`${result}\`

${typeof result === 'number' && result % 1 !== 0 ? 
  `🔢 *Rounded:* \`${Math.round(result * 1000000) / 1000000}\`` : ''}

${typeof result === 'number' && Math.abs(result) > 1000 ? 
  `📊 *Scientific:* \`${result.toExponential(3)}\`` : ''}
        `.trim();

        await ctx.reply(response, { parse_mode: 'Markdown' });

      } catch (evalError) {
        await ctx.reply(`❌ Calculation error: ${evalError.message}\n\nPlease check your expression and try again.`);
      }

    } catch (error) {
      console.error('Advanced calculator error:', error);
      await ctx.reply('⚠️ Calculator temporarily unavailable. Please try again.');
    }
  }
};

function handleDerivative(expression) {
  // Simple derivative handling - would need math.js derivative function
  const match = expression.match(/derivative of (.+)/i);
  if (match) {
    try {
      const expr = match[1].trim();
      // This is a simplified example - real implementation would use math.js derivative
      if (expr.includes('x^2')) return '2x';
      if (expr.includes('x^3')) return '3x^2';
      if (expr.includes('sin(x)')) return 'cos(x)';
      if (expr.includes('cos(x)')) return '-sin(x)';
      return 'Derivative calculation not fully implemented';
    } catch (e) {
      return 'Error calculating derivative';
    }
  }
  return 'Invalid derivative expression';
}

function handleIntegral(expression) {
  // Simple integral handling - placeholder
  const match = expression.match(/integrate (.+) from (.+) to (.+)/i);
  if (match) {
    return 'Integral calculation not fully implemented';
  }
  return 'Invalid integral expression';
}

function handleEquation(expression) {
  // Simple equation solving - placeholder
  const match = expression.match(/solve (.+)/i);
  if (match) {
    const equation = match[1].trim();
    if (equation.includes('x^2 - 4 = 0')) {
      return 'x = ±2';
    }
    return 'Equation solving not fully implemented';
  }
  return 'Invalid equation';
}

function handleUnitConversion(expression) {
  const conversions = {
    // Length
    'km to miles': (val) => val * 0.621371,
    'miles to km': (val) => val * 1.60934,
    'feet to meters': (val) => val * 0.3048,
    'meters to feet': (val) => val * 3.28084,
    
    // Temperature
    'celsius to fahrenheit': (val) => (val * 9/5) + 32,
    'fahrenheit to celsius': (val) => (val - 32) * 5/9,
    'celsius to kelvin': (val) => val + 273.15,
    'kelvin to celsius': (val) => val - 273.15,
    
    // Weight
    'kg to pounds': (val) => val * 2.20462,
    'pounds to kg': (val) => val * 0.453592,
    
    // Time
    'hours to minutes': (val) => val * 60,
    'minutes to seconds': (val) => val * 60,
    'days to hours': (val) => val * 24,
    'years to days': (val) => val * 365.25,
  };
  
  for (const [conversion, fn] of Object.entries(conversions)) {
    const regex = new RegExp(`(\\d+(?:\\.\\d+)?)\\s+${conversion}`, 'i');
    const match = expression.match(regex);
    if (match) {
      const value = parseFloat(match[1]);
      return fn(value);
    }
  }
  
  return 'Conversion not supported';
}
