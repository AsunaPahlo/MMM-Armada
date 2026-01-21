# MMM-Armada

A [MagicMirror²](https://magicmirror.builders/) module to display your Final Fantasy XIV submarine fleet status from [Armada-web](https://github.com/your-armada-repo).


## Installation

1. Navigate to your MagicMirror modules folder:
   ```bash
   cd ~/MagicMirror/modules
   ```

2. Clone this repository:
   ```bash
   git clone https://github.com/your-username/MMM-Armada.git
   ```

3. No additional dependencies are required - the module uses only built-in Node.js features.

## Configuration

Add the module to your `config/config.js` file:

```javascript
{
    module: "MMM-Armada",
    position: "top_right",
    config: {
        apiUrl: "http://localhost:5000",  // Your Armada-web API URL
        apiKey: "your-api-key-here",      // Your Armada-web API key
    }
}
```

### Configuration Options

#### General Options

| Option | Description | Default |
|--------|-------------|---------|
| `apiUrl` | URL of your Armada-web API | `http://localhost:5000` |
| `apiKey` | Bearer token for API authentication | `""` (required) |
| `updateInterval` | How often to fetch data (in milliseconds) | `60000` (1 minute) |
| `animationSpeed` | DOM update animation duration (in milliseconds) | `2000` |
| `initialLoadDelay` | Delay before first data load (in milliseconds) | `0` |
| `displayMode` | Display mode: `summary` or `detailed` | `summary` |
| `summarySize` | Summary pill size: `compact`, `normal`, or `large` | `normal` |
| `summaryLayout` | Summary layout: `vertical` or `horizontal` | `vertical` |
| `summaryOpacity` | Background opacity for all modes: `0.0` to `1.0` | `0.4` |
| `debug` | Enable debug logging | `false` |

#### Detailed Mode Options

These options only apply when `displayMode` is set to `detailed`:

| Option | Description | Default |
|--------|-------------|---------|
| `maxSubmarines` | Maximum number of submarines to display | `10` |
| `sortBy` | Sort by: `hours_remaining`, `status`, `fc_name`, or `name` | `hours_remaining` |
| `sortAscending` | Sort in ascending order | `true` |
| `showFcName` | Show Free Company name | `true` |
| `showBuild` | Show submarine build information | `false` |
| `showRoute` | Show voyage route | `true` |
| `showLevel` | Show submarine level | `true` |

### Configuration Examples

#### Summary Mode (Default)

```javascript
{
    module: "MMM-Armada",
    position: "top_right",
    config: {
        apiUrl: "http://192.168.1.100:5000",
        apiKey: "your-secret-api-key",
        displayMode: "summary"
    }
}
```

#### Detailed Mode

```javascript
{
    module: "MMM-Armada",
    position: "top_right",
    config: {
        apiUrl: "http://192.168.1.100:5000",
        apiKey: "your-secret-api-key",
        displayMode: "detailed",
        maxSubmarines: 8,
        sortBy: "hours_remaining",
        showFcName: true,
        showRoute: true
    }
}
```

## Display Modes

### Summary Mode

A clean, compact dashboard with 5 stat cards:

- **Days to Restock** - Days until supplies need restocking (color-coded: green > 7 days, yellow ≤ 7 days, red ≤ 3 days)
- **Voyaging** - Number of submarines currently on voyages
- **Ready** - Number of submarines ready to deploy
- **Almost Ready** - Number of submarines returning soon
- **Gil (30 days)** - Estimated Gil earned over the last 30 days

### Detailed Mode

A full table view showing:

- Fleet status summary (ready/voyaging/total)
- Daily Gil income
- Supply forecast with days until restock
- Individual submarine list with status icons, names, levels, routes, and time remaining

## Requirements

- [MagicMirror²](https://magicmirror.builders/) installed and running
- [Armada-web](https://github.com/your-armada-repo) API accessible from your MagicMirror

## Troubleshooting

### Module not loading
- Ensure the module folder is named exactly `MMM-Armada`
- Check that the module is properly added to your `config.js`
- Restart MagicMirror after configuration changes

### API connection errors
- Verify your `apiUrl` is correct and accessible from the MagicMirror device
- Confirm your `apiKey` is valid
- Check that Armada-web is running and the API endpoint is available
- Enable `debug: true` in the config to see detailed error messages

### Data not updating
- Check your `updateInterval` setting
- Verify Armada-web is receiving updated data from your FFXIV game

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

Asuna (asunatsukii@gmail.com)
