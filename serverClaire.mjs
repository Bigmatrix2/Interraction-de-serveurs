import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const app = express();
const port = 3002;

app.use(express.json());

app.get('/', (req, res) => {
   res.send('Server Claire running');
});

const initDB = async () => {
   try {
      const db = await open({
         filename: 'clairedatabase.db',
         driver: sqlite3.Database,
      });

      await db.exec(`CREATE TABLE IF NOT EXISTS originalimage (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         gameId INT,
         image TEXT
      )`);

      console.log('Database initialized');
      
      return db;
   } catch (error) {
      console.error('Error initializing database:', error);
   }
};

app.post('/saveimage', async (req, res) => {
   try {
      const gameId = req.body.gameId;
      const image = req.body.image;
      const db = await initDB();

      await saveImageData(db, gameId, image);

      res.status(200).send('Image data saved successfully');
   } catch (error) {
      console.error('Error handling upload request:', error);
      res.status(500).send('Internal Server Error');
   }
});

const saveImageData = async (db, gameId, image) => {
   try {
      await db.run(`INSERT INTO originalimage (gameId, image) VALUES (?, ?)`, [gameId, image]);
      console.log('Image data saved to database');
   } catch (error) {
      console.error('Error saving image data to database:', error);
   }
};

app.listen(port, () => {
   console.log(`Server is running on port ${port}`);
});