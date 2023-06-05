const express = require('express');
const cors = require('cors');

let garage = [
  {
    name: 'Tesla',
    color: '#e6e6fa',
    id: 1
  },
  {
    name: 'BMW',
    color: '#fede00',
    id: 2
  },
  {
    name: 'Mersedes',
    color: '#6c779f',
    id: 3
  },
  {
    name: 'Ford',
    color: '#ef3c40',
    id: 4
  }
];

let winners = [
  {
    id: 1,
    wins: 1,
    time: 10
  }
];

const app = express();
app.use(cors());
app.use(express.json());

const state = { velocity: {}, blocked: {} };

app.get('/garage', (req, res) => {
  res.json(garage);
});
app.get('/garage/:id', (req, res) => {
  const car = garage.filter((car) => car.id == Number(req.params.id));
  if (car.length === 0) {
    return res.status(400).json({
      error: 'NOT FOUND'
    });
  } else {
    res.json(car);
  }
});

app.post('/garage', (req, res) => {
  const idGenerator = () => {
    return garage.length ? Math.max(...garage.map((car) => car.id)) + 1 : 0;
  };
  if (!req.body.name || !req.body.color) {
    return res.status(400).json({
      error: 'data is missing'
    });
  }

  const car = {
    id: idGenerator(),
    name: req.body.name,
    color: req.body.color
  };

  garage = garage.concat(car);
  res.json(car);
});

app.delete('/garage/:id', (req, res) => {
  const car = garage.filter((car) => car.id == Number(req.params.id));
  if (car.length === 0) {
    return res.status(400).json({
      error: 'NOT FOUND'
    });
  }
  garage.forEach((car) => {
    if (car.id == Number(req.params.id)) {
      garage = garage.filter((car) => car.id !== Number(req.params.id));
      res.json({});
    }
  });
});

app.patch('/engine', (req, res) => {
  const { id, status } = req.query;

  if (!id || !status || !/^(started)|(stopped)|(drive)$/.test(status)) {
    return res
      .status(400)
      .send(
        'Wrong parameters: "id" should be any positive number, "status" should be "started", "stopped" or "drive"'
      );
  }

  if (!garage.find((car) => car.id === +id)) {
    return res
      .status(404)
      .send('Car with such id was not found in the garage.');
  }

  const distance = 500000;
  if (status === 'drive') {
    const velocity = state.velocity[id];

    if (!velocity)
      return res
        .status(404)
        .send(
          'Engine parameters for car with such id was not found in the garage. Have you tried to set engine status to "started" before?'
        );
    if (state.blocked[id])
      return res
        .status(429)
        .send(
          "Drive already in progress. You can't run drive for the same car twice while it's not stopped."
        );

    state.blocked[id] = true;

    const x = Math.round(distance / velocity);

    if (new Date().getMilliseconds() % 3 === 0) {
      setTimeout(() => {
        delete state.velocity[id];
        delete state.blocked[id];
        res
          .header('Content-Type', 'application/json')
          .status(500)
          .send("Car has been stopped suddenly. It's engine was broken down.");
      }, (Math.random() * x) ^ 0);
    } else {
      setTimeout(() => {
        delete state.velocity[id];
        delete state.blocked[id];
        res
          .header('Content-Type', 'application/json')
          .status(200)
          .send(JSON.stringify({ success: true }));
      }, x);
    }
  } else {
    const x = req.query.speed ? +req.query.speed : (Math.random() * 2000) ^ 0;

    const velocity =
      status === 'started' ? Math.max(50, (Math.random() * 200) ^ 0) : 0;

    if (velocity) {
      state.velocity[id] = velocity;
    } else {
      delete state.velocity[id];
      delete state.blocked[id];
    }

    setTimeout(
      () =>
        res
          .header('Content-Type', 'application/json')
          .status(200)
          .send(JSON.stringify({ velocity, distance })),
      x
    );
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);
