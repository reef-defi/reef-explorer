const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const crypto = require('crypto');
const fetch = require('node-fetch');
const { Pool } = require('pg');
const axios = require('axios');

const postgresConnParams = {
  user: process.env.POSTGRES_USER || 'reef',
  host: process.env.POSTGRES_HOST || 'postgres',
  database: process.env.POSTGRES_DATABASE || 'reef',
  password: process.env.POSTGRES_PASSWORD || 'reef',
  port: process.env.POSTGRES_PORT || 5432,
};

// Recaptcha
const secret = process.env.RECAPTCHA_SECRET || '';

// Http port
const port = process.env.PORT || 8000;

// Connnect to db
const getPool = async () => {
  const pool = new Pool(postgresConnParams);
  await pool.connect();
  return pool;
}

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

app.post('/api/verificator/request', async (req, res) => {
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

        // check file extension, only .sol is allowed
        const fileName = source.name;
        const fileExtension = fileName.split('.').pop();
        if (fileExtension !== 'sol') {
          res.send({
            status: false,
            message: 'File error: only sol extension is allowed'
          });
        }

        // Insert contract_verification_request
        const sourceFileContent = source.data.toString('utf8');
        const id = crypto.randomBytes(20).toString('hex');
        const timestamp = Date.now();
        const pool = await getPool();
        const sql = `INSERT INTO contract_verification_request (
          id,
          contract_id,
          source,
          filename,
          compiler_version,
          optimization,
          runs,
          target,
          license,
          status,
          timestamp
        ) VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11
        );`;
        const data = [
          id,
          req.body.address,
          sourceFileContent.replace(/\x00/g,''),
          fileName,
          req.body.compilerVersion,
          req.body.optimization,
          req.body.runs,
          req.body.target,
          req.body.license,
          'PENDING',
          timestamp
        ];
        try {
          await pool.query(sql, data);
          res.send({
            status: true,
            message: 'Received verification request',
            data: {
              id,
              address: req.body.address,
              source: fileName,
              sourceMimetype: source.mimetype,
              sourceSize: source.size,
              compilerVersion: req.body.compilerVersion,
              optimization: req.body.optimization,
              runs: req.body.runs,
              target: req.body.target,
              license: req.body.license,
            }
          });
        } catch (error) {
          console.log('Database error:', error);
          res.send({
            status: false,
            message: 'Database error'
          });
        }
        await pool.end();
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

app.post('/api/verificator/untrusted-request', async (req, res) => {
  try {
    if(!req.files || !req.body.address || !req.body.compilerVersion || !req.body.optimization || !req.body.optimization || !req.body.runs || !req.body.target || !req.body.license) {
      res.send({
        status: false,
        message: 'Input error'
      });
    } else {
       
      const source = req.files.source;

      // check file extension, only .sol is allowed
      const fileName = source.name;
      const fileExtension = fileName.split('.').pop();
      if (fileExtension !== 'sol') {
        res.send({
          status: false,
          message: 'File error: only sol extension is allowed'
        });
      }

      // Insert contract_verification_request
      const sourceFileContent = source.data.toString('utf8');
      const id = crypto.randomBytes(20).toString('hex');
      const timestamp = Date.now();
      const pool = await getPool();
      const sql = `INSERT INTO contract_verification_request (
        id,
        contract_id,
        source,
        filename,
        compiler_version,
        optimization,
        runs,
        target,
        license,
        status,
        timestamp
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11
      );`;
      const data = [
        id,
        req.body.address,
        sourceFileContent.replace(/\x00/g,''),
        fileName,
        req.body.compilerVersion,
        req.body.optimization,
        req.body.runs,
        req.body.target,
        req.body.license,
        'PENDING',
        timestamp
      ];
      try {
        await pool.query(sql, data);
        res.send({
          status: true,
          message: 'Received verification request',
          data: {
            id,
            address: req.body.address,
            source: fileName,
            sourceMimetype: source.mimetype,
            sourceSize: source.size,
            compilerVersion: req.body.compilerVersion,
            optimization: req.body.optimization,
            runs: req.body.runs,
            target: req.body.target,
            license: req.body.license,
          }
        });
      } catch (error) {
        console.log('Database error:', error);
        res.send({
          status: false,
          message: 'Database error'
        });
      }
      await pool.end();
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post('/api/verificator/request-status', async (req, res) => {
  if(!req.params.id) {
    res.send({
      status: false,
      message: 'Input error'
    });
  } else {
    try {
      const requestId = req.params.id;
      const data = [
        requestId
      ];
      const query = `
        SELECT
          contract_id
          status
        FROM contract_verification_request
        WHERE id = $1
      ;`;
      const dbres = await pool.query(query, data);
      if (dbres.rows.length > 0) {
        if (res.rows[0].status) {
          const requestStatus = dbres.rows[0].status;
          const contractId = dbres.rows[0].contract_id;
          res.send({
            status: true,
            message: 'Request found',
            data: {
              id: requestId,
              address: contractId,
              status: requestStatus,
            }
          });
        } else {
          res.send({
            status: false,
            message: 'Request not found'
          });
        }
      } else {
        res.send({
          status: false,
          message: 'Request not found'
        });
      }
    } catch (error) {
      res.send({
        status: false,
        message: 'Error'
      });
    }
  }
});

app.get('/api/price/reef', async (req, res) => {
  const denom = 'reef-finance';
  await axios
    .get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${denom}&vs_currencies=usd&include_24hr_change=true`
    )
    .then((response) => {
      res.send({
        status: true,
        message: 'Success',
        data: {
          usd: response.data[denom].usd,
          usd_24h_change: response.data[denom].usd_24h_change,
        }
      });
    })
    .catch((error) => {
      res.send({
        status: false,
        message: 'Error'
      });
    })
});

app.get('/api/staking/rewards', async (req, res) => {
  try {
    const query = `
      SELECT
        block_number,
        data,
        event_index,
        method,
        phase,
        section,
        timestamp
      FROM event
      WHERE section = 'staking' AND method = 'Reward'
    ;`;
    const dbres = await pool.query(query);
    if (dbres.rows.length > 0) {
      res.send({
        status: true,
        message: 'Request found',
        data: {
          rows: dbres.rows,
        }
      });
    } else {
      res.send({
        status: false,
        message: 'Request not found'
      });
    }
  } catch (error) {
    res.send({
      status: false,
      message: 'Error'
    });
  }
});

// Make uploads directory static
app.use(express.static('uploads'));

// Start app
app.listen(port, () => 
  console.log(`Contract verificator API is listening on port ${port}.`)
);
