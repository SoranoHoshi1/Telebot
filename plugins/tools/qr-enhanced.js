
import QRCode from 'qrcode';

export default {
  command: ['qr', 'qrcode', 'qrgen'],
  tags: ['tools'],
  help: ['/qr <text>', '/qrcode <text>', '/qrgen <text>'],
  description: 'Advanced QR code generator with customization',
  async run(ctx) {
    try {
      const input = ctx.message.text.split(' ').slice(1).join(' ');
      
      if (!input) {
        return ctx.reply(`
📱 *QR Code Generator*

Generate QR codes for various purposes:

*Basic Usage:*
• /qr Hello World
• /qr https://example.com
• /qr WiFi:MyNetwork:MyPassword

*Special Formats:*
• WiFi: WIFI:T:WPA;S:NetworkName;P:Password;;
• Email: mailto:user@example.com
• Phone: tel:+1234567890
• SMS: sms:+1234567890:Hello
• Location: geo:40.7128,-74.0060

*Options:*
• /qr text --color blue
• /qr text --size large
• /qr text --logo
        `.trim(), { parse_mode: 'Markdown' });
      }

      // Parse options
      const parts = input.split(' --');
      const text = parts[0].trim();
      const options = {};
      
      for (let i = 1; i < parts.length; i++) {
        const [key, value] = parts[i].split(' ');
        options[key] = value || true;
      }

      // Validate input
      const validation = global.security.validateInput(text, 'text');
      if (!validation.valid) {
        return ctx.reply(`❌ Invalid input: ${validation.reason}`);
      }

      await ctx.replyWithChatAction('upload_photo');

      // Generate QR code options
      const qrOptions = {
        errorCorrectionLevel: 'M',
        type: 'png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: options.color === 'blue' ? '#0066CC' : 
                 options.color === 'red' ? '#CC0000' : 
                 options.color === 'green' ? '#00CC00' : '#000000',
          light: '#FFFFFF'
        },
        width: options.size === 'small' ? 200 : 
               options.size === 'large' ? 800 : 400
      };

      let qrBuffer;

      qrBuffer = await QRCode.toBuffer(text, qrOptions);

      const caption = `📱 *QR Code Generated*

📝 *Content:* ${text.length > 50 ? text.substring(0, 50) + '...' : text}
📏 *Size:* ${qrOptions.width}x${qrOptions.width}
🎨 *Color:* ${options.color || 'black'}
${getQRInfo(text)}`;

      await ctx.replyWithPhoto(
        { source: qrBuffer },
        { caption, parse_mode: 'Markdown' }
      );

    } catch (error) {
      console.error('QR code generation error:', error);
      await ctx.reply('⚠️ Failed to generate QR code. Please try again.');
    }
  }
};

function getQRInfo(text) {
  if (text.startsWith('http://') || text.startsWith('https://')) {
    return '\n🌐 *Type:* Website Link';
  } else if (text.startsWith('mailto:')) {
    return '\n📧 *Type:* Email Address';
  } else if (text.startsWith('tel:')) {
    return '\n📞 *Type:* Phone Number';
  } else if (text.startsWith('WIFI:')) {
    return '\n📶 *Type:* WiFi Credentials';
  } else if (text.startsWith('geo:')) {
    return '\n📍 *Type:* Geographic Location';
  } else if (text.startsWith('sms:')) {
    return '\n💬 *Type:* SMS Message';
  } else {
    return '\n📄 *Type:* Plain Text';
  }
}


