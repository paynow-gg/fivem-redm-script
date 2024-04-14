# PayNow Script for FiveM / RedM

The official PayNow addon seamlessly integrates with game servers for FiveM & RedM, facilitating in-game transactions and enhancing gameplay with secure and efficient financial interactions. This guide will help you set up the PayNow plugin on your server.

## Prerequisites

Ensure you have administrative access to your FiveM / RedM server and the ability to modify its configuration.

## Installation

Drag and drop the `paynow` resource into your FiveM / RedM server's resources folder.

## Configuration

After the plugin is installed for the first time, you may want to customize its settings, such as the server connection token and the command fetch interval.

### Setting Your Token

To connect your server with the PayNow gameserver, set your unique PayNow token using the following server console command:

```plaintext
set paynow.token <token>
```

Replace `<token>` with your actual PayNow token.

To permanently set this, add `set paynow.token <token>` to your `server.cfg`

### Adjusting Fetch Interval

The default fetch interval is recommended for most servers, but you can adjust it to meet your specific needs by using the command `set paynow.interval <interval>`, with interval being in seconds.

## Support

For support, questions, or more information, join our Discord community:

- [Discord](https://discord.gg/paynow)

## Contributing

Contributions are welcome! If you'd like to improve the PayNow plugin or suggest new features, please fork the repository, make your changes, and submit a pull request.
