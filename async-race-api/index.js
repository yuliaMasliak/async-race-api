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
  res.append('X-Total-Count', garage.length);
  res.append('Access-Control-Expose-Headers', 'X-Total-Count');

  const currentPage = req.query._page;
  const currentPageLimit = req.query._limit;
  res.statusMessage = 'OK';
  if (currentPage && currentPageLimit) {
    const chunk = garage.slice(
      (currentPage - 1) * currentPageLimit,
      currentPage * currentPageLimit
    );
    res.status(200).json(chunk);
  } else {
    res.status(200).json(garage);
  }
});

app.get('/garage/:id', (req, res) => {
  const car = garage.find((car) => car.id == Number(req.params.id));
  if (!car) {
    res.statusCode = 404;
    res.statusMessage = 'NOT FOUND';
    return res.json({});
  } else {
    res.statusMessage = 'OK';
    res.status(200).json(car);
  }
});

app.post('/garage', (req, res) => {
  const idGenerator = () => {
    return garage.length ? Math.max(...garage.map((car) => car.id)) + 1 : 0;
  };

  const car = (name = 'Car', color = '#FFFFFF') => {
    const obj = { id: idGenerator(), name: name, color: color };
    return obj;
  };

  garage = garage.concat(car(req.body.name, req.body.color));
  res.statusCode = 201;
  res.statusMessage = 'CREATED';
  res.json(car(req.body.name, req.body.color));
});

app.delete('/garage/:id', (req, res) => {
  const car = garage.find((car) => car.id == Number(req.params.id));
  if (!car) {
    res.status(404);
    res.statusMessage = 'NOT FOUND';
    res.json({});
  } else {
    garage.forEach((car) => {
      if (car.id == Number(req.params.id)) {
        garage = garage.filter((car) => car.id !== Number(req.params.id));
        res.status(200);
        res.statusMessage = 'OK';
        res.json({});
      }
    });
  }
});

app.put('/garage/:id', (req, res) => {
  const car = garage.find((car) => car.id == Number(req.params.id));
  if (!car) {
    res.status(404);
    res.statusMessage = 'NOT FOUND';
    res.json({});
  }
  const updatedCar = {
    id: Number(req.params.id),
    name: req.body.name,
    color: req.body.color
  };
  garage.forEach((car) => {
    if (car.id == Number(req.params.id)) {
      car.name = updatedCar.name;
      car.color = updatedCar.color;
      res.status(200);
      res.statusMessage = 'OK';
      res.json(updatedCar);
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

//winners
app.get('/winners', (req, res) => {
  res.append('X-Total-Count', winners.length);
  res.append('Access-Control-Expose-Headers', 'X-Total-Count');

  const currentPage = req.query._page;
  const currentPageLimit = req.query._limit;
  res.statusMessage = 'OK';
  if (currentPage && currentPageLimit) {
    const chunk = winners.slice(
      (currentPage - 1) * currentPageLimit,
      currentPage * currentPageLimit
    );
    res.status(200).json(chunk);
  } else {
    res.status(200).json(winners);
  }
});

app.get('/winners/:id', (req, res) => {
  const car = winners.find((car) => car.id == Number(req.params.id));
  if (!car) {
    return res.status(400).json({
      error: 'NOT FOUND'
    });
  } else {
    res.json(car);
  }
});

app.post('/winners', (req, res) => {
  const existingWinner = winners.find((car) => car.id == Number(req.body.id));

  if (existingWinner) {
    res.status(500);
    res.statusMessage = 'Insert failed, duplicate id';
    return res.json({
      error: 'INTERNAL SERVER ERROR'
    });
  } else {
    const winner = {
      id: Number(req.body.id),
      wins: Number(req.body.wins),
      time: Number(req.body.time)
    };
    winners = winners.concat(winner);
    res.statusCode = 201;
    res.statusMessage = 'CREATED';
    res.json(winner);
  }
});

app.delete('/winner/:id', (req, res) => {
  const winner = winners.find((car) => car.id == Number(req.params.id));
  if (!winner) {
    res.status(404);
    res.statusMessage = 'NOT FOUND';
    return res.json({});
  } else {
    winners.forEach((car) => {
      if (car.id == Number(req.params.id)) {
        winners = winners.filter((car) => car.id !== Number(req.params.id));
        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.json({});
      }
    });
  }
});

app.put('/winners/:id', (req, res) => {
  const winner = winners.find((car) => car.id == Number(req.params.id));
  if (!winner) {
    res.status(404);
    res.statusMessage = 'NOT FOUND';
    return res.json({});
  }
  const updatedCar = {
    wins: Number(req.body.wins),
    time: Number(req.body.time),
    id: req.params.id
  };
  winners.forEach((car) => {
    if (car.id == updatedCar.id) {
      car.wins += 1;
      car.time = car.time < updatedCar.time ? car.time : updatedCar.time;
    }
    res.statusCode = 200;
    res.statusMessage = 'OK';
    return res.json(car);
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`App running at ${PORT}`);
});
