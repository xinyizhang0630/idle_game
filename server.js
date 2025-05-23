const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const SAVE_FILE = path.join(__dirname, 'saves', 'game_data.json');

// Initialize save directory
const initSaveFile = async () => {
    const defaultData = {
        resources: 0,
        resourcesPerSecond: 0,
        totalCollected: 0,
        playTime: 0,
        totalClicks: 0,
        upgrades: {
            autoDrone: {
                level: 0,
                baseCost: 10,
                multiplier: 1
            }
        },
        achievements: {
            firstClick: { unlocked: false },
            collector100: { unlocked: false },
            collector1000: { unlocked: false },
            timePlayer: { unlocked: false },
            expertMiner: { unlocked: false }
        }
    };

    try {
        await fs.mkdir(path.dirname(SAVE_FILE), { recursive: true });
        await fs.writeFile(SAVE_FILE, JSON.stringify(defaultData, null, 2));
    } catch (err) {
        console.error('Initialization error:', err);
    }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.post('/api/save', async (req, res) => {
    try {
        const completeData = {
            ...req.body,
            lastUpdated: new Date().toISOString()
        };
        await fs.writeFile(SAVE_FILE, JSON.stringify(completeData, null, 2));
        res.json({ status: 'success', data: completeData });
    } catch (error) {
        console.error('Save error:', error);
        res.status(500).json({ error: 'Save failed', details: error.message });
    }
});

app.get('/api/load', async (req, res) => {
    try {
        const defaultData = {
            resources: 0,
            resourcesPerSecond: 0,
            totalCollected: 0,
            playTime: 0,
            totalClicks: 0,
            upgrades: {
                autoDrone: {
                    level: 0,
                    baseCost: 10,
                    multiplier: 1
                }
            },
            achievements: {
                firstClick: { unlocked: false },
                collector100: { unlocked: false },
                collector1000: { unlocked: false },
                timePlayer: { unlocked: false },
                expertMiner: { unlocked: false }
            }
        };

        try {
            const rawData = await fs.readFile(SAVE_FILE, 'utf8');
            const savedData = JSON.parse(rawData);
            
            // Merge with defaults to ensure all fields exist
            const responseData = {
                ...defaultData,
                ...savedData,
                upgrades: {
                    autoDrone: {
                        ...defaultData.upgrades.autoDrone,
                        ...(savedData.upgrades?.autoDrone || {})
                    }
                },
                achievements: {
                    ...defaultData.achievements,
                    ...(savedData.achievements || {})
                }
            };
            
            res.json(responseData);
        } catch {
            await fs.writeFile(SAVE_FILE, JSON.stringify(defaultData, null, 2));
            res.json(defaultData);
        }
    } catch (error) {
        console.error('Load error:', error);
        res.status(500).json({ 
            error: 'Load failed',
            fallbackData: {
                resources: 0,
                upgrades: { autoDrone: { level: 0 } }
            }
        });
    }
});

// Start server
const startServer = async () => {
    await initSaveFile();
    
    app.listen(PORT, () => {
        console.log(`🟢 Server running at http://localhost:${PORT}`);
        console.log(`📁 Save location: ${SAVE_FILE}`);
    });
};

startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});