# VietQR Telegram Bot

A Telegram bot that generates QR codes for bank transfers using the VietQR API. This bot allows users to generate QR codes for bank transfers with customizable parameters.

## Features

- Generate QR codes for bank transfers
- Customize transfer information (bank, account, amount, etc.)
- List supported banks
- View available QR code templates

## Prerequisites

- Node.js (v16 or later)
- A Telegram bot token (obtain from [@BotFather](https://t.me/BotFather))
- VietQR API credentials (register at [my.vietqr.io](http://my.vietqr.io/))

## Local Development

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd vietqr-telegram-bot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy the `.env.example` file to `.env`
   - Set your Telegram Bot token in `TELEGRAM_BOT_TOKEN`
   - Set your VietQR API credentials in `VIETQR_CLIENT_ID` and `VIETQR_API_KEY`

4. Start the bot in development mode:
   ```bash
   npm run dev
   ```

## Deployment

### Deploy to Render (Recommended)

1. Fork this repository to your GitHub account

2. Create a new Web Service on Render:
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository
   - Choose a name for your service
   - Select the branch to deploy
   - Select "Node" as the runtime
   - The build command and start command will be automatically detected from render.yaml

3. Set up environment variables:
   - In your Render dashboard, go to the "Environment" tab
   - Add the following variables:
     - `TELEGRAM_BOT_TOKEN`
     - `VIETQR_CLIENT_ID`
     - `VIETQR_API_KEY`

4. Deploy:
   - Click "Create Web Service"
   - Render will automatically build and deploy your bot

### Deploy using Docker

1. Build the Docker image:
   ```bash
   docker build -t vietqr-telegram-bot .
   ```

2. Run the container:
   ```bash
   docker run -d \
     -e TELEGRAM_BOT_TOKEN=your_token \
     -e VIETQR_CLIENT_ID=your_client_id \
     -e VIETQR_API_KEY=your_api_key \
     vietqr-telegram-bot
   ```

## How to Use

Once the bot is running, you can interact with it on Telegram using the following commands:

- `/start` - Start the bot and receive welcome message
- `/help` - Display available commands and usage instructions
- `/qr` - Generate a QR code with default values
- `/qr [params]` - Generate a QR code with custom parameters
- `/banks` - List supported banks
- `/templates` - List available QR templates

### Custom Parameters

When using the `/qr` command, you can customize the QR code by specifying parameters:

```
/qr bank=970415 accountName=John accountNumber=123456789 amount=100000 memo=Payment template=compact
```

All parameters are optional. If not provided, default values will be used.

Available parameters:
- `bank`: Bank ID (e.g., 970415 for VietinBank)
- `accountName`: Account holder's name
- `accountNumber`: Bank account number
- `amount`: Amount to transfer (in VND)
- `memo`: Transfer description/memo
- `template`: QR template (qr_only, compact, compact2)

## Dependencies

- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api) - Node.js module to interact with the official Telegram Bot API
- [vietqr](https://github.com/vietqr/vietqr-node) - VietQR API client for Node.js
- [dotenv](https://github.com/motdotla/dotenv) - Load environment variables from .env file

## License

This project is licensed under the ISC License. 