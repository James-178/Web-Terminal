# Web Terminal

A customizable terminal interface for web applications that brings command-line functionality to your browser.

![Web Terminal](https://via.placeholder.com/800x400?text=Web+Terminal)

## 🚀 Features

- **Fully Customizable UI**: Change colors, fonts, size, and appearance
- **Command History**: Navigate through previously executed commands
- **Tab Completion**: Smart command and argument completion
- **Draggable & Resizable**: Position and resize the terminal as needed
- **Persistent History**: Command history saved between sessions
- **Custom Commands**: Easily add your own commands with validation and tab completion
- **Minimizable**: Toggle visibility with a floating button

## 📋 Usage

### Basic Setup

```html
<!DOCTYPE html>
<html>
<head>
    <title>Web Terminal Demo</title>
    <script src="web-terminal.js"></script>
</head>
<body>
    <script>
        // Initialize the terminal when the page loads
        document.addEventListener('DOMContentLoaded', () => {
            const terminal = new WebTerminal();
        });
    </script>
</body>
</html>
```

### Customization

```javascript
const terminal = new WebTerminal({
    // Appearance
    backgroundColor: '#1e1e1e',
    textColor: '#00ff00',
    fontSize: '16px',
    fontFamily: 'Fira Code, monospace',
    width: '800px',
    height: '500px',
    promptSymbol: '$',
    
    // Behavior
    welcomeMessage: 'Welcome to My Custom Terminal!\nType "help" to get started.',
    historySize: 200
});

terminal.updateAppearance({
    backgroundColor: '#0a2342',
    textColor: '#a0d2eb'
});
```

### Adding Custom Commands

```javascript
terminal.registerCommand('greet', {
    description: 'Greet someone by name',
    usage: 'greet [name]',
    action: (args, terminal) => {
        const name = args.length > 0 ? args[0] : 'World';
        terminal.writeLine(`Hello, ${name}!`);
    },
    validator: (args) => {
        // Optional: validate arguments
        return true;
    },
    tabComplete: (partial, previousArgs, terminal, position) => {
        // Optional: provide tab completion suggestions
        const names = ['Alice', 'Bob', 'Charlie', 'Dave'];
        return names.filter(name => name.toLowerCase().startsWith(partial.toLowerCase()));
    }
});
```

## 🔧 API Reference

### Constructor

```javascript
const terminal = new WebTerminal(options);
```

### Methods

| Method | Description |
|--------|-------------|
| `writeLine(text)` | Write a line of text to the terminal |
| `write(text)` | Write text without a line break |
| `clear()` | Clear the terminal screen |
| `registerCommand(name, options)` | Register a new command |
| `executeCommand(commandText)` | Execute a command programmatically |
| `toggleTerminal()` | Show/hide the terminal |
| `updateAppearance(options)` | Update terminal appearance |

### Command Options

| Option | Type | Description |
|--------|------|-------------|
| `description` | String | Command description shown in help |
| `usage` | String | Usage example shown in help |
| `action` | Function | Function to execute (receives args and terminal) |
| `validator` | Function | Optional function to validate arguments |
| `tabComplete` | Function | Optional function to provide tab completions |

## 🔍 Advanced Usage

### Position-Aware Tab Completion

```javascript
terminal.registerCommand('open', {
    description: 'Open a file or URL',
    usage: 'open [type] [name]',
    action: (args, terminal) => {
        // Command implementation
    },
    tabComplete: (partial, previousArgs, terminal, position) => {
        // Different completions based on argument position
        if (position === 1) {
            return ['file', 'url', 'app'].filter(opt => 
                opt.startsWith(partial || ''));
        } else if (position === 2) {
            // Context-aware suggestions based on first argument
            const firstArg = previousArgs[0];
            if (firstArg === 'file') {
                return ['document.txt', 'image.png'].filter(f => 
                    f.startsWith(partial || ''));
            } else if (firstArg === 'url') {
                return ['google.com', 'github.com'].filter(u => 
                    u.startsWith(partial || ''));
            }
        }
        return [];
    }
});
```

### Programmatic Control

```javascript
// Execute commands programmatically
terminal.executeCommand('clear');
terminal.executeCommand('greet Alice');

// Update appearance on the fly
terminal.updateAppearance({
    backgroundColor: '#000080',
    textColor: '#ffffff'
});

// Show or hide the terminal
terminal.toggleTerminal();
```

## 📦 Installation

### Direct Download

1. Download `web-terminal.js`
2. Include it in your HTML file

### CDN (Example)

```html
<script src="https://cdn.example.com/web-terminal.js"></script>
```

## 🤝 Contributing

Contributions are welcome! Feel free to submit pull requests or open issues.

## 📄 License

MIT License

---

Made for web developers who miss the command line
