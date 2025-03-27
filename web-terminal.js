/**
 * WebTerminal - A customizable terminal for web applications
 */
class WebTerminal {
    /**
     * Create a new terminal instance
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        //default config, users able to modify/add more to the config
        this.config = {
            //appearance
            backgroundColor: '#000',
            textColor: '#0f0',
            fontSize: '14px',
            fontFamily: 'Consolas, monospace',
            width: '600px',
            height: '400px',
            promptSymbol: '>',

            //behavior
            welcomeMessage: 'Web Terminal v1.0.0\nType "help" for available commands.',
            historySize: 100,

            //override with user options
            ...options
        };

        //command registry
        this.commands = {};

        //terminal state
        this.history = [];
        this.historyIndex = -1;
        this.inputBuffer = '';

        //load history from localStorage if available
        this.loadHistory();
        //create elements
        this.createTerminalElements();
        // Register default commands
        this.registerDefaultCommands();
        // Initialize event listeners
        this.initEventListeners();
    }

    /**
     * Create and append terminal DOM elements
     */
    createTerminalElements() {
        //create toggle button
        this.toggleButton = document.createElement('div');
        this.toggleButton.className = 'web-terminal-toggle';
        this.toggleButton.innerHTML = '&lt;/&gt;';
        this.toggleButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 40px;
            height: 40px;
            background-color: ${this.config.backgroundColor};
            color: ${this.config.textColor};
            border-radius: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-family: ${this.config.fontFamily};
            z-index: 9998;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        `;

        //create terminal container
        this.container = document.createElement('div');
        this.container.className = 'web-terminal-container';
        this.container.style.cssText = `
            position: fixed;
            bottom: 25%;
            left: 30%;
            width: ${this.config.width};
            height: ${this.config.height};
            background-color: ${this.config.backgroundColor};
            color: ${this.config.textColor};
            font-family: ${this.config.fontFamily};
            font-size: ${this.config.fontSize};
            border-radius: 5px;
            overflow: hidden;
            display: none;
            flex-direction: column;
            z-index: 9999;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            resize: both;
            min-width: 300px;
            min-height: 200px;
        `;

        //create terminal header for dragging
        this.header = document.createElement('div');
        this.header.className = 'web-terminal-header';
        this.header.style.cssText = `
            padding: 5px 10px;
            background-color: rgba(255, 255, 255, 0.1);
            cursor: move;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        this.header.innerHTML = '<span>Terminal</span>';

        //add minimize button to header
        const minimizeButton = document.createElement('span');
        minimizeButton.innerHTML = '−';
        minimizeButton.style.cssText = `
            cursor: pointer;
            padding: 0 5px;
        `;
        minimizeButton.onclick = () => this.toggleTerminal();
        this.header.appendChild(minimizeButton);

        //create output display
        this.output = document.createElement('div');
        this.output.className = 'web-terminal-output';
        this.output.style.cssText = `
            flex: 1;
            padding: 10px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-break: break-word;
        `;

        //create input container
        this.inputContainer = document.createElement('div');
        this.inputContainer.className = 'web-terminal-input-container';
        this.inputContainer.style.cssText = `
            display: flex;
            padding: 5px 10px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        `;

        //create prompt
        this.prompt = document.createElement('span');
        this.prompt.className = 'web-terminal-prompt';
        this.prompt.textContent = this.config.promptSymbol + ' ';

        //create input field
        this.input = document.createElement('input');
        this.input.className = 'web-terminal-input';
        this.input.type = 'text';
        this.input.style.cssText = `
            flex: 1;
            background: transparent;
            border: none;
            outline: none;
            color: inherit;
            font-family: inherit;
            font-size: inherit;
            padding: 0;
            margin: 0;
        `;

        //create the terminal
        this.inputContainer.appendChild(this.prompt);
        this.inputContainer.appendChild(this.input);

        this.container.appendChild(this.header);
        this.container.appendChild(this.output);
        this.container.appendChild(this.inputContainer);

        //append to document
        document.body.appendChild(this.toggleButton);
        document.body.appendChild(this.container);

        //display welcome message
        if (this.config.welcomeMessage) {
            this.writeLine(this.config.welcomeMessage);
        }
    }

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        //toggle terminal visibility
        this.toggleButton.addEventListener('click', () => this.toggleTerminal());

        // Handle input submission
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = this.input.value.trim();
                if (command) {
                    this.executeCommand(command);
                    this.addToHistory(command);
                    this.input.value = '';
                    this.historyIndex = -1;
                    this.inputBuffer = '';
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory('up');
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory('down');
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.handleTabCompletion();
            }
        });

        //make terminal draggable
        this.makeDraggable();

        //handle resize events
        this.container.addEventListener('mouseup', () => {
            this.config.width = this.container.style.width;
            this.config.height = this.container.style.height;
        });
    }

    /**
     * Make the terminal draggable
     */
    makeDraggable() {
        let offsetX, offsetY, isDragging = false;

        this.header.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - this.container.getBoundingClientRect().left;
            offsetY = e.clientY - this.container.getBoundingClientRect().top;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const x = e.clientX - offsetX;
                const y = e.clientY - offsetY;

                this.container.style.left = `${Math.max(0, x)}px`;
                this.container.style.top = `${Math.max(0, y)}px`;
                this.container.style.bottom = 'auto';
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    /**
     * Toggle terminal visibility
     */
    toggleTerminal() {
        const isVisible = this.container.style.display === 'flex';
        this.container.style.display = isVisible ? 'none' : 'flex';

        if (!isVisible) {
            this.input.focus();
        }
    }

    /**
     * Write text to the terminal
     * @param {string} text - Text to write
     */
    write(text) {
        this.output.innerHTML += text;
        this.scrollToBottom();
    }

    /**
     * Write a line to the terminal
     * @param {string} text - Text to write
     */
    writeLine(text) {
        this.write(text + '\n');
    }

    /**
     * Clear the terminal output
     */
    clear() {
        this.output.innerHTML = '';
    }

    /**
     * Scroll to the bottom of the terminal output
     */
    scrollToBottom() {
        this.output.scrollTop = this.output.scrollHeight;
    }

    /**
     * Execute a command
     * @param {string} commandText - Command to execute
     */
    executeCommand(commandText) {
        //display the command
        this.writeLine(`${this.config.promptSymbol} ${commandText}`);

        //parse the command and arguments
        const args = commandText.split(' ');
        const commandName = args.shift().toLowerCase();

        //find the command
        const command = this.commands[commandName];

        if (command) {
            try {
                //validate arguments if validator exists
                if (command.validator && !command.validator(args)) {
                    this.writeLine(`Error: Invalid arguments for command '${commandName}'`);
                    if (command.usage) {
                        this.writeLine(`Usage: ${command.usage}`);
                    }
                    return;
                }

                //execute the command
                command.action(args, this);
            } catch (error) {
                this.writeLine(`Error executing command '${commandName}': ${error.message}`);
            }
        } else {
            this.writeLine(`Command not found: ${commandName}`);
        }
    }

    /**
     * Register a command
     * @param {string} name - Command name
     * @param {Object} options - Command options
     * @param {Function} options.action - Command action function
     * @param {string} options.description - Command description
     * @param {string} options.usage - Command usage example
     * @param {Function} options.validator - Function to validate command arguments
     * @param {Function} options.tabComplete - Function to provide tab completions for arguments
     */
    registerCommand(name, options) {
        this.commands[name.toLowerCase()] = {
            name: name,
            action: options.action || (() => { }),
            description: options.description || '',
            usage: options.usage || name,
            validator: options.validator || null,
            tabComplete: options.tabComplete || null
        };
    }

    /**
     * Register default commands
     */
    registerDefaultCommands() {
        //help command
        this.registerCommand('help', {
            description: 'Display available commands',
            action: (args, terminal) => {
                if (args.length > 0) {
                    const cmdName = args[0].toLowerCase();
                    const cmd = this.commands[cmdName];

                    if (cmd) {
                        terminal.writeLine(`${cmd.name}: ${cmd.description}`);
                        terminal.writeLine(`Usage: ${cmd.usage}`);
                    } else {
                        terminal.writeLine(`Command not found: ${cmdName}`);
                    }
                } else {
                    terminal.writeLine('Available commands:');
                    Object.values(this.commands).forEach(cmd => {
                        terminal.writeLine(`  ${cmd.name}: ${cmd.description}`);
                    });
                    terminal.writeLine('\nType "help <command>" for more information about a specific command.');
                }
            }
        });

        //clear command
        this.registerCommand('clear', {
            description: 'Clear the terminal screen',
            action: (args, terminal) => {
                terminal.clear();
            }
        });

        //about command
        this.registerCommand('about', {
            description: 'Display information about the terminal',
            action: (args, terminal) => {
                terminal.writeLine('Web Terminal - A customizable terminal for web applications');
                terminal.writeLine('Type "help" to see available commands.');
            }
        });

        this.registerCommand('clearHistory', {
            description: 'Clear the terminal history',
            action: (args, terminal) => {
                terminal.history = [];
                terminal.historyIndex = -1;
                terminal.inputBuffer = '';
                terminal.saveHistory();
                terminal.writeLine('History cleared.');
            }
        });

        //exit command
        this.registerCommand('exit', {
            description: 'Minimises the terminal',
            action: (args, terminal) => {
                terminal.toggleTerminal();
            }
        });
    }

    /**
     * Add a command to history
     * @param {string} command - Command to add
     */
    addToHistory(command) {
        //no consecutive duplicates
        if (this.history.length === 0 || this.history[this.history.length - 1] !== command) {
            this.history.push(command);

            //limit history size
            if (this.history.length > this.config.historySize) {
                this.history.shift();
            }

            //save to localStorage
            this.saveHistory();
        }
    }

    /**
     * Navigate through command history
     * @param {string} direction - Direction to navigate ('up' or 'down')
     */
    navigateHistory(direction) {
        if (this.history.length === 0) return;

        if (direction === 'up') {
            //save current input if starting to navigate
            if (this.historyIndex === -1) {
                this.inputBuffer = this.input.value;
            }

            //navigate up in history
            if (this.historyIndex < this.history.length - 1) {
                this.historyIndex++;
                this.input.value = this.history[this.history.length - 1 - this.historyIndex];
            }
        } else if (direction === 'down') {
            //navigate down in history
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.input.value = this.history[this.history.length - 1 - this.historyIndex];
            } else if (this.historyIndex === 0) {
                //return to input buffer
                this.historyIndex = -1;
                this.input.value = this.inputBuffer;
            }
        }

        //move cursor to end of input
        setTimeout(() => {
            this.input.selectionStart = this.input.selectionEnd = this.input.value.length;
        }, 0);
    }

    /**
     * Handle tab completion
     */
    handleTabCompletion() {
        //if we're continuing a tab completion cycle, use the stored original input
        const input = this.tabCompletionOriginalInput || this.input.value;
        const parts = input.split(' ');
        console.log("input:", input);
        console.log("tabCompletionOriginalInput:", this.tabCompletionOriginalInput);

        //if we're completing a command name (first word)
        if (parts.length === 1) {
            const partial = parts[0].toLowerCase();
            if (partial) {
                // Find matching commands
                const matches = Object.keys(this.commands).filter(cmd =>
                    cmd.startsWith(partial)
                );

                if (matches.length === 1) {
                    //single match, complete it
                    this.input.value = matches[0];
                    this.tabCompletionOriginalInput = null; //reset
                } else if (matches.length > 1) {
                    //store original input if this is the first tab press
                    if (!this.tabCompletionMatches) {
                        this.tabCompletionOriginalInput = input;
                    }

                    //store matches for cycling if not already stored
                    if (!this.tabCompletionMatches || this.tabCompletionPartial !== partial) {
                        this.tabCompletionMatches = matches;
                        this.tabCompletionPartial = partial;
                        this.tabCompletionIndex = 0;

                        //apply the first match
                        this.input.value = this.tabCompletionMatches[this.tabCompletionIndex];
                    } else {
                        //cycle to the next match
                        this.tabCompletionIndex = (this.tabCompletionIndex + 1) % matches.length;
                        //apply next match
                        this.input.value = this.tabCompletionMatches[this.tabCompletionIndex];
                    }
                }
            }
        }
        //command-specific tab completion (for arguments)
        else if (parts.length > 1) {
            const commandName = parts[0].toLowerCase();
            const command = this.commands[commandName];

            //if command exists and has a tabComplete handler
            if (command && typeof command.tabComplete === 'function') {
                //store the input

                // if (!this.tabCompletionMatches) {
                this.tabCompletionOriginalInput = input;
                // }
                const argPartial = parts[parts.length - 1];
                const previousArgs = parts.slice(1, -1);
                const argPosition = parts.length - 1; //osition of current argument (1-based)

                try {
                    //call the command's tab completion handler with position information
                    const completions = command.tabComplete(argPartial, previousArgs, this, argPosition);

                    if (completions && completions.length > 0) {
                        if (completions.length === 1) {
                            //single completion
                            parts[parts.length - 1] = completions[0];
                            this.input.value = parts.join(' ');
                            this.tabCompletionMatches = null; //reset since we've completed
                            this.tabCompletionOriginalInput = null;
                        } else {
                            //multiple completions, cycle through them
                            const completionKey = `${commandName}-${argPosition}-${argPartial}`;

                            if (!this.tabCompletionMatches ||
                                this.tabCompletionKey !== completionKey) {
                                this.tabCompletionMatches = completions;
                                this.tabCompletionKey = completionKey;
                                this.tabCompletionIndex = 0;
                            } else {
                                //cycle to the next completion
                                this.tabCompletionIndex = (this.tabCompletionIndex + 1) % completions.length;
                            }

                            //apply the current completion
                            parts[parts.length - 1] = this.tabCompletionMatches[this.tabCompletionIndex];
                            this.input.value = parts.join(' ');
                        }
                    }
                } catch (error) {
                    console.error('Error in tab completion:', error);
                }
            }
        }

        //reset tab completion state when input changes
        this.input.addEventListener('input', () => {
            this.tabCompletionMatches = null;
            this.tabCompletionPartial = null;
            this.tabCompletionCommand = null;
            this.tabCompletionOriginalInput = null; //also reset the original input
        }, { once: true });
    }

    /**
     * Save command history to localStorage
     */
    saveHistory() {
        if (window.localStorage) {
            localStorage.setItem('webTerminalHistory', JSON.stringify(this.history));
        }
    }

    /**
     * Load command history from localStorage
     */
    loadHistory() {
        if (window.localStorage) {
            const savedHistory = localStorage.getItem('webTerminalHistory');
            if (savedHistory) {
                try {
                    this.history = JSON.parse(savedHistory);
                    //ensure history doesn't exceed max size
                    if (this.history.length > this.config.historySize) {
                        this.history = this.history.slice(-this.config.historySize);
                    }
                } catch (e) {
                    console.error('Failed to parse terminal history:', e);
                    this.history = [];
                }
            }
        }
    }

    /**
     * Update terminal appearance
     * @param {Object} options - Appearance options
     */
    updateAppearance(options = {}) {
        //update config
        Object.assign(this.config, options);

        //update styles
        if (options.backgroundColor) {
            this.container.style.backgroundColor = options.backgroundColor;
            this.toggleButton.style.backgroundColor = options.backgroundColor;
        }

        if (options.textColor) {
            this.container.style.color = options.textColor;
            this.toggleButton.style.color = options.textColor;
        }

        if (options.fontSize) {
            this.container.style.fontSize = options.fontSize;
        }

        if (options.fontFamily) {
            this.container.style.fontFamily = options.fontFamily;
            this.toggleButton.style.fontFamily = options.fontFamily;
        }

        if (options.width) {
            this.container.style.width = options.width;
        }

        if (options.height) {
            this.container.style.height = options.height;
        }

        if (options.promptSymbol) {
            this.prompt.textContent = options.promptSymbol + ' ';
        }
    }
}

// Export the class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebTerminal;
} else {
    window.WebTerminal = WebTerminal;
}