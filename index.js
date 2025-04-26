require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { VietQR } = require('vietqr');
const fs = require('fs');
const path = require('path');

// Get configuration from environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const VIETQR_CLIENT_ID = process.env.VIETQR_CLIENT_ID;
const VIETQR_API_KEY = process.env.VIETQR_API_KEY;
const PORT = process.env.PORT || 3000;
// Validate environment variables
if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined in .env file');
}

if (!VIETQR_CLIENT_ID || !VIETQR_API_KEY) {
  throw new Error('VIETQR_CLIENT_ID or VIETQR_API_KEY is not defined in .env file');
}

// Initialize the VietQR API client
const vietQR = new VietQR({
  clientID: VIETQR_CLIENT_ID,
  apiKey: VIETQR_API_KEY,
});

// Initialize the Telegram Bot with polling
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Default transfer values
const DEFAULT_TRANSFER = {
  bank: '970415', // VietinBank by default
  accountName: 'QUY VAC XIN PHONG CHONG COVID',
  accountNumber: '113366668888',
  amount: '79000',
  memo: 'Ung Ho Quy Vac Xin',
  template: 'compact' // Your custom template ID
};

// Helper function to save a base64 image to file
async function saveBase64Image(base64Data, outputPath) {
  return new Promise((resolve, reject) => {
    // Remove the data URL prefix if present
    const base64Image = base64Data.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    
    // Create buffer from base64
    const imageBuffer = Buffer.from(base64Image, 'base64');
    
    // Write buffer to file
    fs.writeFile(outputPath, imageBuffer, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(outputPath);
      }
    });
  });
}

// Welcome message when user starts the bot
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    'Welcome to VietQR Bot! Use /qr command to generate a QR code for bank transfer.\n\n' +
    'Example: /qr bank=970415 accountName=Example accountNumber=123456789 amount=100000 memo=Payment template=compact\n\n' +
    'All parameters are optional. If not provided, default values will be used.'
  );
});

// Help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    'Commands:\n' +
    '/start - Start the bot\n' +
    '/help - Show this help message\n' +
    '/qr - Generate a QR code with default values\n' +
    '/qr [params] - Generate a QR code with custom parameters\n\n' +
    'Available parameters:\n' +
    '- bank: Bank ID (e.g., 970415)\n' +
    '- accountName: Account name\n' +
    '- accountNumber: Bank account number\n' +
    '- amount: Amount to transfer\n' +
    '- memo: Transfer description\n' +
    '- template: QR template (xefSukK or qr_only, compact, compact2)\n\n' +
    'Example: /qr bank=970415 accountName=John accountNumber=123456789 amount=100000 memo=Payment template=xefSukK'
  );
});

// List banks command
bot.onText(/\/banks/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    bot.sendMessage(chatId, 'Fetching list of supported banks...');
    
    const response = await vietQR.getBanks();
    
    if (response.code === '00') {
      let banksMessage = 'Supported banks:\n\n';
      response.data.slice(0, 10).forEach(bank => {
        banksMessage += `- ${bank.name} (ID: ${bank.bin})\n`;
      });
      banksMessage += `\nTotal ${response.data.length} banks supported. This is a partial list.`;
      
      bot.sendMessage(chatId, banksMessage);
    } else {
      bot.sendMessage(chatId, `Error fetching banks: ${response.desc}`);
    }
  } catch (error) {
    console.error('Error fetching banks:', error);
    bot.sendMessage(chatId, 'Error fetching banks. Please try again later.');
  }
});

// List templates command
bot.onText(/\/templates/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    bot.sendMessage(chatId, 'Fetching available templates...');
    
    const response = await vietQR.getTemplate();
    
    if (response.code === '00') {
      let templatesMessage = 'Available templates:\n\n';
      response.data.forEach(template => {
        templatesMessage += `- ${template.name} (code: ${template.template})\n`;
      });
      
      bot.sendMessage(chatId, templatesMessage);
    } else {
      bot.sendMessage(chatId, `Error fetching templates: ${response.desc}`);
    }
  } catch (error) {
    console.error('Error fetching templates:', error);
    bot.sendMessage(chatId, 'Error fetching templates. Please try again later.');
  }
});

// QR generation command
bot.onText(/\/qr(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const params = match[1].trim();
  
  try {
    // Parse the parameters if provided
    const transferParams = { ...DEFAULT_TRANSFER };
    
    if (params) {
      // Extract key-value pairs
      params.split(' ').forEach(param => {
        const [key, value] = param.split('=');
        if (key && value) {
          transferParams[key.trim()] = value.trim();
        }
      });
    }
    
    // Validate parameters
    if (!transferParams.bank || !transferParams.accountNumber) {
      bot.sendMessage(chatId, 'Bank ID and account number are required. Using defaults.');
    }
    
    // Show the user we're generating the QR code
    bot.sendMessage(chatId, 'Generating QR code...');
    
    console.log('Bot: Generating QR with params:', transferParams);
    
    // Generate the QR code
    const response = await vietQR.genQRCodeBase64(transferParams);
    
    console.log('Bot: Received response from VietQR:', {
      code: response.code,
      desc: response.desc,
      hasData: !!response.data,
      error: response.error,
      responseType: typeof response
    });
    
    if (response.data && response.data.qrDataURL) {
      console.log('Bot: QR code data URL received, length:', response.data.qrDataURL.length);
      
      // Create tmp directory if it doesn't exist
      const tmpDir = path.join(__dirname, 'tmp');
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir);
        console.log('Bot: Created tmp directory:', tmpDir);
      }
      
      // Unique filename
      const filename = `qr_${Date.now()}.png`;
      const filePath = path.join(tmpDir, filename);
      console.log('Bot: Saving QR code to:', filePath);
      
      try {
        // Save the image
        await saveBase64Image(response.data.qrDataURL, filePath);
        console.log('Bot: QR code saved successfully');
        
        // Send the QR code to the user
        await bot.sendPhoto(chatId, filePath, {
          caption: `QR Code for bank transfer:\nBank: ${transferParams.bank}\nAccount: ${transferParams.accountNumber}\nName: ${transferParams.accountName}\nAmount: ${transferParams.amount} VND\nMemo: ${transferParams.memo}`,
        });
        console.log('Bot: QR code sent to user');
        
        // Clean up the temporary file
        setTimeout(() => {
          fs.unlink(filePath, (err) => {
            if (err) console.error('Bot: Error deleting temp file:', err);
            else console.log('Bot: Temporary file deleted:', filePath);
          });
        }, 30000); // Delete after 30 seconds
      } catch (fileError) {
        console.error('Bot: Error handling QR code file:', fileError);
        bot.sendMessage(chatId, 'Error saving or sending QR code. Please try again later.');
      }
    } else {
      console.error('Bot: Invalid response format:', response);
      bot.sendMessage(chatId, `Error generating QR code: ${response.desc || response.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Bot: Error in QR generation:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    bot.sendMessage(chatId, `Error generating QR code: ${error.message}`);
  }
});

// Handle unknown commands
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  
  // Only respond to text messages that start with '/'
  if (msg.text && msg.text.startsWith('/') && !msg.text.match(/^\/(start|help|qr|banks|templates)/)) {
    bot.sendMessage(chatId, 'Unknown command. Type /help to see available commands.');
  }
});

// Start the bot
console.log('VietQR Telegram Bot is running...');

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
}); 