import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import axios from "axios";

const app = express();
const port = 3001;

app.use(express.json());

app.get('/', (req, res) => {
   res.send('Server Bill running');
});

function randomPorts(min, max){
   return Math.floor(Math.random() * (max - min )) + min;
}
const avaiblePorts = [];
for (let i = 0; i < 41; i++){
   avaiblePorts.push(randomPorts(3010, 3050));
}

const initDB = async () => {
   try {
      const db = await open({
         filename: 'billdatabase.db',
         driver: sqlite3.Database,
      });

      await db.exec(`CREATE TABLE IF NOT EXISTS images (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         gameId INT,
         image TEXT,
         effect TEXT,
         filter TEXT,
         diegoPort INT,
         elisePort INT
      )`);

      console.log('Database initialized');
      
      return db;
   } catch (error) {
      console.error('Error initializing database:', error);
   }
};

app.post('/upload', async (req, res) => {
   try {
      console.log(req.body);
      const gameId = req.body.gameId;
      const effect = req.body.effect;
      const filter = req.body.filter;
      const image = req.body.image;
      const db = await initDB();

      const diegoPort = avaiblePorts.pop();
      const elisePort = avaiblePorts.pop();

      await sendImageServerClaire(gameId, image);
      await saveImageData(db, gameId, image, effect, filter, diegoPort, elisePort);

      startDiegoServer(diegoPort);
      startEliseServer(elisePort);

      res.status(200).json({ message: 'Image data saved successfully'});
   } catch (error) {
      console.error('Error handling upload request:', error);
      res.status(500).json({error: 'Internal Server Error'});
   }
});

const sendImageServerClaire = async (gameId, image) =>{
   try {
      await axios.post("http://127.0.0.1:3002/saveimage", {
         gameId: gameId,
         image: image
      });
      console.log("image to send serverClaire");
   } catch (error) {
      console.error("error to send serverClaire", error);
   }
};

const saveImageData = async (db, gameId, image, effect, filter, diegoPort, elisePort) => {
   try {
      await db.run(`INSERT INTO images (gameId, image, effect, filter, diegoPort, elisePort) VALUES (?, ?, ?, ?, ?, ?)`, [gameId, image, effect, filter, diegoPort, elisePort]);
      console.log('Image data saved to database');
   } catch (error) {
      console.error('Error saving image data to database:', error);
   }
};
   
function startDiegoServer(port){
   const app = express();

   app.use(express.json());

   app.get('/', (req, res) => {
      const gameId = req.body.gameId;
      const image = req.body.image;
      const effect = req.body.effect;

      res.json({
         partie_id: gameId,
         image_id: "0101010101",
         user_id: "0202020202",
         image: image,
         final_image: image,
         sequence: [
            {
            effects: [
               {type: effect},
               {add_effects_status: true}
            ]
            }
         ]
      })
   });
   app.listen(port, () => {
      console.log(`Server Diego is running on port ${port}`);
   });
}

function startEliseServer(port){
   const app = express();

   app.use(express.json());

   app.get('/', (req, res) => {
      const gameId = req.body.gameId;
      const image = req.body.image;
      const effect = req.body.effect;
      const filter = req.body.filter;

      res.json({
         partie_id: gameId,
         image_id: "0101010101",
         user_id: "0202020202",
         image: image,
         final_image: image,
         sequence: [
            {
            effects: [
               {type: effect},
               {add_effects_status: true}
            ]
         }, {
            filters: [
               {type: filter},
               {add_filters_status: true}
            ]
         }],
         succees: true
      });
   });
   app.listen(port, () => {
      console.log(`Server Elise is running on port ${port}`);
   });
}

async function endGame(gameId){
   try {
      const db = await initDB();
      const query = `SELECT diegoPort, elisePort FROM images WHERE gameId = ?`;
      const result = await db.get(query, [gameId]);
      
      if (result){
         const diegoPort = result.diegoPort;
         const elisePort = result.elisePort;

         stopServer(diegoPort);
         stopServer(elisePort);

         await db.run(`DELETE FROM images WHERE gameId = ?`, [gameId]);
         avaiblePorts.push(diegoPort);
         avaiblePorts.push(elisePort);
         console.log(`game with this id ${gameId} is ended success`);
      } else {
         console.log(`game with this id ${gameId} is not found`);
      }
   } catch (error) {
      console.error("Error game ending : ", error);
   }
}

function stopServer(port){
   console.log(`Server rining on port ${port} is stop`)
}

app.post("/closeServers", (req, res) =>{
   try {
      const gameId = req.body.gameId;
      endGame(gameId);
      res.status(200).send("servers is close success");
   } catch {
      console.error("error for close servers :", error);
      res.status(500).send("server error");
   }
})

app.listen(port, () => {
   console.log(`Server Bill is running on port ${port}`);
});