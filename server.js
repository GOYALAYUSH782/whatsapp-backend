import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import Pusher from "pusher";
import Messages from './dbMessages.js';

const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: "1157766",
  key: "e36b67f2d59e00c88278",
  secret: "65a118e43d646bf590b6",
  cluster: "ap2",
  useTLS: true
});

app.use(cors());
app.use(express.json());

const connectionString = 'mongodb+srv://admin:ihmF9y7XAFB00mGi@cluster0.qn56k.mongodb.net/whatsappdb?retryWrites=true&w=majority';

mongoose.connect(connectionString, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.once('open', () => {
  console.log('Db connected');

  const msgCollections = db.collection('messagecontents');
  const changeStream = msgCollections.watch();

  changeStream.on('change', (change) => {
    // console.log(change);
    if (change.operationType === 'insert') {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        message: messageDetails.message,
        name: messageDetails.name,
        timestamp: messageDetails.timestamp
      });

    } else {
      console.log('error triggering Pusher');
    }
  })

});

app.get('/', (req, res) => res.status(200).send('hello world'));

app.get('/messages/sync', (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  })
})

app.post('/messages/new', (req, res) => {
  const dbMessage = req.body;
  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  })
})

app.listen(port, () => console.log(`Listening in port ${port}`));