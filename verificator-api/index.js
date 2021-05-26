const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const _ = require('lodash');
const crypto = require('crypto');
const fetch = require('node-fetch');

// recaptcha
const secret = '';

const app = express();

// Enable file upload
app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 1 * 1024 * 1024 * 1024 // 1MB max file(s) size
  },
}));

// Add other middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));

app.post('/request', async (req, res) => {
  try {
    if(!req.files || !req.body.token || !req.body.address || !req.body.compilerVersion || !req.body.optimization || !req.body.optimization || !req.body.runs || !req.body.target || !req.body.license) {
      res.send({
        status: false,
        message: 'Input error'
      });
    } else {
      // console.log(req);
      const token = req.body.token;
      const response = await fetch(
        `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`
      );
      const success = JSON.parse(await response.text()).success;
      if (success) {
        const source = req.files.source;
        const hash = crypto.randomBytes(20).toString('hex');
        res.send({
          status: true,
          message: 'Received verification request',
          data: {
            id: hash,
            address: req.body.address,
            source: source.name,
            sourceMimetype: source.mimetype,
            sourceSize: source.size,
            compilerVersion: req.body.compilerVersion,
            optimization: req.body.optimization,
            runs: req.body.runs,
            target: req.body.target,
            license: req.body.license,
          }
        });
      } else {
        res.send({
          status: false,
          message: 'Token error'
        });
      }
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

//make uploads directory static
app.use(express.static('uploads'));

//start app 
const port = process.env.PORT || 8000;

app.listen(port, () => 
  console.log(`App is listening on port ${port}.`)
);