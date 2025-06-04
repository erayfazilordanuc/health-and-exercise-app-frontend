import axios from 'axios';

axios
  .post('/login', {
    firstName: 'Finn',
    lastName: 'Williams',
  })
  .then(
    response => {
      console.log(response);
    },
    error => {
      console.log(error);
    },
  );
