#!/usr/bin/env node
const { program } = require('commander');
const chalk = require('chalk');
const fg = require('fast-glob');

if (process.argv.includes('-h') || process.argv.includes('--help')) {
    console.log(`
  ${chalk.bold.cyan('Usage:')} ${chalk.green('clip-react [options]')}

  ${chalk.bold.cyan('Options:')}
    ${chalk.green('map')}              ${chalk.gray(' # Example: clip-react map')}
                      ${chalk.gray('   Starts the interactive directory selector ')}
    ${chalk.green('-h, --help')}       ${chalk.gray(' # Example: clip-react --help')}
                      ${chalk.gray('   Show help ')}
    ${chalk.green('-v, --version')}    ${chalk.gray(' # Example: clip-react --version')}
                      ${chalk.gray('   Show installed version ')}

  ${chalk.bold.cyan('Thanks for using Clip!')}
    ${chalk.underline.blue('https://github.com/Clip-react/clip')}
    `);
    process.exit(0);
}
const madge = require('madge');
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const ora = require('ora');
const Table = require('cli-table3');

/**
 * Analyzes the dependencies of the project files.
 * @param {string[]} files - List of files to analyze.
 * @returns {Promise<object>} Madge dependency object.
 */
async function analyzeDependencies(files) {
    const dependencyObject = await madge(files);
    return dependencyObject.obj();
}

/**
 * Detects which common React directories exist in the project.
 * @returns {Promise<string[]>} List of found directories.
 */
async function detectAvailableDirectories() {
    const commonDirs = ['src', 'public', 'app', 'lib', 'components', 'pages'];
    const available = [];
    
    for (const dir of commonDirs) {
        const dirPath = path.join(process.cwd(), dir);
        if (await fs.pathExists(dirPath)) {
            available.push(dir);
        }
    }
    
    return available;
}

/**
 * Shows an interactive menu for the user to select the directory.
 * @returns {Promise<string>} Selected directory.
 */
async function promptDirectorySelection() {
    console.log(chalk.bold.cyan('\n📎 Clip-React Map Generator'));
    console.log(chalk.gray('═══════════════════════════════════════════════\n'));

    const availableDirs = await detectAvailableDirectories();

    const choices = [
        ...availableDirs.map(dir => ({
            name: `${dir}/  ${chalk.gray(`(detected in your project)`)}`,
            value: dir,
            short: dir
        })),
        {
            name: chalk.yellow('Other directory (specify path)'),
            value: 'custom',
            short: 'Custom'
        }
    ];

    if (availableDirs.length === 0) {
        console.log(chalk.yellow('⚠️ No common React directories detected'));
        console.log(chalk.gray('    Please specify the path manually\n'));
    } else {
        console.log(chalk.gray(`✓ ${availableDirs.length} ${availableDirs.length === 1 ? 'directory detected' : 'directories detected'}`));
    }

    console.log(chalk.gray('  Use ↑↓ to navigate • Enter to select\n'));

    const { selectedDir } = await inquirer.prompt([
        {
            type: 'list',
            name: 'selectedDir',
            message: 'Select the directory to analyze:',
            choices,
            prefix: '📂',
            pageSize: 10,
            loop: false
        }
    ]);

    if (selectedDir === 'custom') {
        const { customPath } = await inquirer.prompt([
            {
                type: 'input',
                name: 'customPath',
                message: 'Enter the directory path:',
                prefix: '📝',
                default: 'src',
                validate: async (input) => {
                    if (!input || input.trim() === '') {
                        return 'Please enter a valid path.';
                    }
                    const dirPath = path.join(process.cwd(), input.trim());
                    if (await fs.pathExists(dirPath)) {
                        return true;
                    }
                    return `The directory "${input}" does not exist. Please enter a valid path.`;
                }
            }
        ]);
        return customPath.trim();
    }

    return selectedDir;
}




/**
 * Generates the HTML for the visual map.
 * @param {object[]} nodes - Array of nodes for the graph.
 * @param {object[]} edges - Array of edges for the graph.
 * @returns {string} HTML file content.
 */
function generateHtmlContent(nodes, edges) {
    const logoSvg = `<svg width="32" height="32" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,500) scale(0.1,-0.1)" fill="currentColor"><path d="M2187 4540 c-215 -54 -306 -308 -173 -482 l35 -45 -17 -49 c-15 -45-17 -146 -20 -1113 -1 -654 1 -1091 7 -1135 34 -242 252 -407 493 -374 184 25 338 177 368 364 6 35 10 408 10 900 0 836 0 841 -21 868 -28 35 -70 35 -98 0-21 -27 -21 -32 -21 -894 0 -981 5 -920 -81 -1014 -90 -99 -223 -128 -339 -75-74 35 -110 67 -145 131 l-30 53 -3 1098 c-1 702 1 1112 8 1135 l9 37 88 0c72 0 96 5 131 23 87 46 143 123 166 227 10 43 15 50 35 50 22 0 26 -7 38 -60 23 -102 75 -171 163 -217 35 -18 65 -24 132 -26 l87 -4 8 -36 c5 -21 8 -604 8-1297 l0 -1260 -23 -65 c-36 -99 -79 -169 -151 -241 -185 -186 -474 -220 -706-84 -73 42 -165 141 -207 220 -71 137 -68 76 -68 1233 0 1036 0 1039 -21 1066-25 32 -68 35 -95 5 -18 -20 -19 -53 -19 -1073 0 -977 1 -1056 18 -1121 53-207 195 -382 384 -472 97 -47 160 -62 278 -69 169 -10 324 38 467 146 87 66 148 143 203 255 79 162 75 89 75 1485 0 1088 -2 1249 -16 1310 l-15 68 35 47c91 118 83 280 -17 392 -52 57 -118 87 -204 91 -105 6 -163 -16 -235 -90 l-58-58 -61 0 c-60 0 -61 0 -105 49 -76 84 -198 125 -297 101z m187 -55 c94 -45 150 -137 150 -246 0 -54 -5 -74 -30 -120 -38 -66 -97 -114 -171 -135 -67 -19-117 -14 -190 22 -165 80 -197 302 -63 432 22 23 60 48 83 56 56 21 170 16 221 -9z m672 -3 c53 -27 117 -100 132 -150 20 -65 15 -151 -12 -208 -41 -88-144 -154 -241 -154 -140 0 -275 133 -275 270 0 110 88 224 200 261 43 14 152 4 196 -19z"/><path d="M2287 4337 c-80 -65 -35 -197 67 -197 69 0 116 44 116 110 0 93 -111 146 -183 87z m141 -26 c23 -14 10 -46 -21 -49 -23 -3 -27 0 -27 22 0 21 10 32 30 35 3 0 11 -3 18 -8z"/><path d="M2972 4347 c-34 -19 -55 -55 -56 -96 -1 -48 26 -89 72 -108 76 -32 152 23 152 111 0 54 -52 106 -106 106 -22 -1 -49 -6 -62 -13z m122 -33 c20 -8 21 -50 1 -58 -36 -14 -61 24 -33 52 14 14 12 14 32 6z"/></g></svg>`;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Clip-React Map</title>
    <script type="text/javascript" src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
    <style type="text/css">
        :root {
            --bg-color: #ffffff;
            --text-color: #111827;
            --card-bg: #ffffff;
            --border-color: #e5e7eb;
            --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            --accent-color: #4f46e5;
            --node-text: #111827;
        }
        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
        }
        #network {
            width: 100%;
            height: 100%;
            border: none;
            box-sizing: border-box;
        }
        #header {
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            z-index: 10;
            display: flex;
            justify-content: space-between;
            align-items: center;
            pointer-events: none; /* Allow clicking through the header */
        }
        #search-container {
            display: flex;
            align-items: center;
            gap: 12px;
            pointer-events: auto; /* Re-enable pointer events for contents */
        }
        #controls {
            display: flex;
            align-items: center;
            gap: 12px;
            pointer-events: auto;
        }
        #theme-switcher {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            width: 40px;
            height: 40px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: var(--shadow);
            color: var(--text-color);
        }
        #theme-switcher svg { display: none; }
        body:not(.dark-mode) #theme-switcher .sun-icon { display: block; }
        body.dark-mode #theme-switcher .moon-icon { display: block; }

        body.dark-mode {
            --bg-color: #111827;
            --text-color: #f9fafb;
            --card-bg: #1f2937;
            --border-color: #374151;
            --accent-color: #6366f1;
            --node-text: #f9fafb;
        }
        #logo {
            color: var(--text-color);
            flex-shrink: 0;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 1.1rem;
            font-weight: 600;
        }
        #search-wrapper {
            position: relative;
            display: flex;
            align-items: center;
        }
        #search-input {
            width: 350px;
            padding: 10px 36px 10px 16px;
            font-size: 15px;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            background: var(--card-bg);
            color: var(--text-color);
            box-shadow: var(--shadow);
            transition: all 0.2s ease;
        }
        #search-input:focus {
            border-color: var(--accent-color);
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
            outline: none;
        }
        #search-input::placeholder { color: #6c757d; }
        #clear-button {
            position: absolute;
            right: 12px;
            background: none;
            border: none;
            cursor: pointer;
            color: #6c757d;
            font-size: 20px;
            padding: 0;
            width: 20px;
            height: 20px;
            display: none;
            align-items: center;
            justify-content: center;
            transition: color 0.2s ease;
        }
        #clear-button:hover { color: var(--text-color); }
        #clear-button.visible { display: flex; }
        #suggestions {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            margin-top: 8px;
            max-height: 250px;
            overflow-y: auto;
            box-shadow: var(--shadow);
            position: absolute;
            top: 50px;
            width: 100%;
        }
        .suggestion-item {
            padding: 12px 16px;
            cursor: pointer;
            color: var(--text-color);
            border-bottom: 1px solid var(--border-color);
            font-size: 14px;
        }
        .suggestion-item:last-child { border-bottom: none; }
        .suggestion-item:hover { background-color: rgba(13, 110, 253, 0.05); }

        #info-bar {
            position: absolute;
            bottom: -120px;
            left: 50%;
            transform: translateX(-50%);
            width: auto;
            max-width: 600px;
            height: auto;
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: space-around;
            padding: 12px 20px;
            transition: bottom 0.3s ease-in-out;
            box-shadow: var(--shadow);
        }
        #info-bar.visible { bottom: 20px; }
        .info-item {
            text-align: center;
            padding: 0 15px;
            border-right: 1px solid var(--border-color);
        }
        .info-item:last-child { border-right: none; }
        .info-item strong {
            display: block;
            font-size: 20px;
            color: var(--text-color);
            font-weight: 600;
        }
        .info-item span {
            font-size: 11px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-top: 4px;
            display: block;
        }
    </style>
</head>
<body>
    <div id="header">
        <div id="search-container">
            <div id="logo">${logoSvg} <span>Clip-React Map</span></div>
            <div id="search-wrapper">
                <input type="text" id="search-input" placeholder="Search file (Ctrl+K)..." />
                <button id="clear-button" title="Clear">×</button>
                <div id="suggestions"></div>
            </div>
        </div>
        <div id="controls">
            <button id="theme-switcher">
                <svg class="sun-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                <svg class="moon-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            </button>
        </div>
    </div>

    <div id="info-bar">
        <div class="info-item">
            <strong id="info-file"></strong>
            <span>File</span>
        </div>
        <div class="info-item">
            <strong id="info-size"></strong>
            <span>Size</span>
        </div>
        <div class="info-item">
            <strong id="info-deps"></strong>
            <span>Imports</span>
        </div>
        <div class="info-item">
            <strong id="info-dependents"></strong>
            <span>Used by</span>
        </div>
    </div>
    <div id="network"></div>
    <script type="text/javascript">
        // --- Graph Coloring ---
        function getFileColor(filename) {
            const ext = filename.split('.').pop().toLowerCase();
            const colors = {
                'js':   { bg: '#fefce8', border: '#eab308' },
                'jsx':  { bg: '#eff6ff', border: '#2563eb' },
                'ts':   { bg: '#eef2ff', border: '#4f46e5' },
                'tsx':  { bg: '#eef2ff', border: '#4f46e5' },
                'css':  { bg: '#f0f9ff', border: '#0ea5e9' },
                'scss': { bg: '#fdf2f8', border: '#db2777' },
                'html': { bg: '#fef2f2', border: '#ef4444' },
                'json': { bg: '#f8fafc', border: '#64748b' },
                'svg':  { bg: '#f5f3ff', border: '#7c3aed' },
                'md':   { bg: '#f9fafb', border: '#4b5563' },
                'png':  { bg: '#fff7ed', border: '#f97316' },
                'jpg':  { bg: '#fff7ed', border: '#f97316' },
                'default': { bg: '#f8fafc', border: '#94a3b8' }
            };
            return colors[ext] || colors['default'];
        }

        const nodesData = ${JSON.stringify(nodes)};
        nodesData.forEach(node => {
            const colors = getFileColor(node.label);
            node.color = {
                border: colors.border,
                background: colors.bg,
                highlight: { border: 'var(--accent-color)', background: '#E0F2FE' },
                hover: { border: 'var(--accent-color)', background: '#E0F2FE' }
            };

            if (node.focused) {
                node.color = {
                    border: '#16A34A',
                    background: '#D1FAE5',
                    highlight: { border: '#059669', background: '#A7F3D0' },
                    hover: { border: '#059669', background: '#A7F3D0' }
                };
                node.font = { size: 16, color: '#065F46', face: 'system-ui', bold: { size: 18 } };
                node.borderWidth = 3;
                node.shapeProperties = { borderRadius: 6 };
            }
        });

        // --- Vis.js Network Setup ---
        const nodes = new vis.DataSet(nodesData);
        const edges = new vis.DataSet(${JSON.stringify(edges)});
        const container = document.getElementById('network');
        const data = { nodes, edges };
        const options = {
            nodes: {
                shape: 'box',
                margin: { top: 10, right: 12, bottom: 10, left: 12 },
                font: { color: '#111827', size: 14, face: 'system-ui' },
                borderWidth: 1.5,
                shapeProperties: { borderRadius: 4 },
                widthConstraint: { maximum: 250 },
                shadow: { enabled: true, color: 'rgba(0,0,0,0.05)', x: 2, y: 2, size: 5 }
            },
            edges: {
                arrows: { to: { enabled: true, scaleFactor: 0.6 } },
                smooth: { type: 'dynamic' },
                color: {
                    color: '#94a3b8',
                    highlight: 'var(--accent-color)',
                    hover: 'var(--accent-color)'
                },
                width: 1,
                hoverWidth: 1.5
            },
            physics: {
                solver: 'forceAtlas2Based',
                forceAtlas2Based: {
                    gravitationalConstant: -50,
                    centralGravity: 0.005,
                    springLength: 250,
                    springConstant: 0.1,
                    avoidOverlap: 0.8
                },
                maxVelocity: 100,
                minVelocity: 1,
                stabilization: { iterations: 200 }
            },
            interaction: {
                hover: true,
                tooltipDelay: 200
            }
        };
        const network = new vis.Network(container, data, options);

        // --- Interactive Logic ---
        const searchInput = document.getElementById('search-input');
        const clearButton = document.getElementById('clear-button');
        const suggestionsContainer = document.getElementById('suggestions');
        const infoBar = document.getElementById('info-bar');
        const allNodeIds = nodes.getIds();
        const infoFile = document.getElementById('info-file');
        const infoSize = document.getElementById('info-size');
        const infoDeps = document.getElementById('info-deps');
        const infoDependents = document.getElementById('info-dependents');
        const themeSwitcher = document.getElementById('theme-switcher');

        // --- Theme Manager ---
        const themeManager = (() => {
            const THEME_KEY = 'clipReactMapTheme';
            let currentTheme = localStorage.getItem(THEME_KEY) || 'light';

            function applyTheme(theme) {
                document.body.classList.toggle('dark-mode', theme === 'dark');
            }

            function toggleTheme() {
                currentTheme = (currentTheme === 'light') ? 'dark' : 'light';
                localStorage.setItem(THEME_KEY, currentTheme);
                applyTheme(currentTheme);
            }

            // Apply initial theme
            applyTheme(currentTheme);

            return { toggleTheme };
        })();

        themeSwitcher.addEventListener('click', themeManager.toggleTheme);

        let currentSelectedNode = null;

        function formatBytes(bytes, decimals = 2) {
            if (!bytes || bytes === 0) return '0 Bytes';
            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        }

        function focusOnNode(nodeId) {
            network.focus(nodeId, { scale: 1.2, animation: { duration: 500, easingFunction: 'easeInOutCubic' } });
            network.selectNodes([nodeId]);
            currentSelectedNode = nodeId;
            displayNodeInfo(nodeId);
            suggestionsContainer.style.display = 'none';
        }

        function clearSearch() {
            searchInput.value = '';
            clearButton.classList.remove('visible');
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.style.display = 'none';
            if (currentSelectedNode !== null) {
                network.unselectAll();
                network.fit({ animation: { duration: 500, easingFunction: 'easeInOutCubic' } });
                currentSelectedNode = null;
                hideInfoBar();
            }
        }

        clearButton.addEventListener('click', clearSearch);

        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            clearButton.classList.toggle('visible', query.length > 0);

            if (query.length === 0) {
                suggestionsContainer.style.display = 'none';
                return;
            }

            const suggestions = allNodeIds.filter(id => id.toLowerCase().includes(query));
            suggestionsContainer.innerHTML = '';
            if (suggestions.length > 0) {
                suggestions.slice(0, 5).forEach(nodeId => {
                    const item = document.createElement('div');
                    item.className = 'suggestion-item';
                    item.textContent = nodeId;
                    item.onclick = () => {
                        searchInput.value = nodeId;
                        focusOnNode(nodeId);
                    };
                    suggestionsContainer.appendChild(item);
                });
                suggestionsContainer.style.display = 'block';
            } else {
                suggestionsContainer.style.display = 'none';
            }
        });

        function displayNodeInfo(nodeId) {
            const node = nodes.get(nodeId);
            if (node) {
                infoFile.textContent = node.label.split('/').pop();
                infoSize.textContent = formatBytes(node.size);
                infoDeps.textContent = node.dependencies.length;
                infoDependents.textContent = node.dependents.length;
                infoBar.classList.add('visible');
            }
        }

        function hideInfoBar() {
            infoBar.classList.remove('visible');
        }

        network.on('click', function(params) {
            if (params.nodes.length > 0) {
                currentSelectedNode = params.nodes[0];
                displayNodeInfo(params.nodes[0]);
            } else {
                currentSelectedNode = null;
                hideInfoBar();
            }
        });

        document.addEventListener('keydown', function(event) {
            if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
                event.preventDefault();
                searchInput.focus();
            }
            if (event.key === 'Escape') {
                clearSearch();
            }
        });
    </script>
</body>
</html>
`;
}

/**
 * Main function for the 'map' command.
 * @param {object} options - Command options (e.g., { file: 'path/to/file' }).
 */
async function mapAction(options) {
    const spinner = ora({ text: 'Starting project analysis', color: 'cyan' }).start();
    try {
        spinner.text = 'Searching for compatible files...';
        let files;
        let scanTarget = 'the project';

        const directoryToScan = await promptDirectorySelection();
        scanTarget = `the directory '${directoryToScan}'`;
        const scanPath = path.join(directoryToScan, '**/*.{js,jsx,ts,tsx}').replace(/\\/g, '/');
        files = await fg(scanPath, {
            caseSensitive: false,
            ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**']
        });

        if (files.length === 0) {
            spinner.fail(chalk.yellow(`⚠️ No compatible files found in ${scanTarget}.`));
            console.log(chalk.gray('   Make sure to run this command at the root of your project.'));
            return;
        }

        const normalizedFiles = files.map(f => f.replace(/\\/g, '/'));

        spinner.text = `Analyzing dependencies of ${normalizedFiles.length} files...`;

        const adjListRaw = await analyzeDependencies(normalizedFiles);

        const adjList = Object.entries(adjListRaw).reduce((acc, [key, value]) => {
            const normalizedKey = key.replace(/\\/g, '/');
            const normalizedValue = value.map(dep => dep.replace(/\\/g, '/'));
            acc[normalizedKey] = normalizedValue;
            return acc;
        }, {});

        const allFiles = Object.keys(adjList);

        spinner.text = 'Calculating graph relationships...';
        const dependentsMap = allFiles.reduce((acc, file) => ({ ...acc, [file]: [] }), {});
        allFiles.forEach(fromFile => {
            adjList[fromFile].forEach(toFile => {
                if (dependentsMap[toFile]) {
                    dependentsMap[toFile].push(fromFile);
                }
            });
        });

        const nodesData = allFiles.map(file => {
            let fileSize = 0;
            try { fileSize = fs.statSync(file).size; } catch (e) {}
            return {
                id: file,
                label: path.basename(file),
                title: file,
                size: fileSize,
                dependencies: adjList[file] || [],
                dependents: dependentsMap[file] || [],
            };
        });

        spinner.succeed(chalk.green('Dependency analysis complete'));

        const nodesMap = nodesData.reduce((acc, node) => ({ ...acc, [node.id]: node }), {});
        const relations = allFiles.flatMap(from => adjList[from].map(to => ({ from, to })));

        const table = new Table({
            head: [chalk.cyan('Metric'), chalk.cyan('Value')],
            colWidths: [30, 15],
            style: { head: [], border: ['gray'] }
        });
        table.push(
            ['📁 Files analyzed', chalk.yellow(files.length.toString())],
            ['🔗 Relationships found', chalk.yellow(relations.length.toString())],
            ['📊 Nodes in graph', chalk.yellow(nodesData.length.toString())]
        );
        console.log('\n' + table.toString() + '\n');

        let nodes, edges;

        nodes = nodesData;
        edges = relations;

        spinner.start('Generating visual map...');
        const htmlContent = generateHtmlContent(nodes, edges);

        let outputFilename = 'clipMap.html';

        await fs.writeFile(outputFilename, htmlContent);
        spinner.succeed(chalk.green(`Map generated! Open ${chalk.bold.underline(outputFilename)} in your browser.`));

    } catch (error) {
        spinner.fail(chalk.red('An unexpected error occurred:'));
        console.error(error);
    }
}


program
    .command('map')
    .action(mapAction);


program
    .version('1.0.0', '-v, --version')
    .name('clip-react')
    .usage('[options] [command]');

program.parse(process.argv);