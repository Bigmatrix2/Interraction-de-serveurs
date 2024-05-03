import { createServer } from 'node:http';
import fs from 'node:fs';

const server = createServer((req, res) => {
   fs.readFile('main.html', (err, data) => {
      if (err) {
         res.writeHead(500, { 'Content-Type': 'text/plain' });
         res.end('Erreur lecture HTML');
      } else {
         res.writeHead(200, { 'Content-Type': 'text/html' });
         res.end(data);
      }
   });
});

server.listen(3000, '127.0.0.1', () => {
   console.log('Listening on 127.0.0.1:3000');
});
