// db.js
import { config } from "dotenv";
config();

import pg from "pg";

const pool = new pg.Pool({
  user: process.env.DB_USER, // Your PostgreSQL user
  host: process.env.DB_HOST, // Your PostgreSQL host
  database: process.env.DB_DATABASE, // Your PostgreSQL database
  password: process.env.DB_PASSWORD, // Your PostgreSQL password
  port: process.env.DB_PORT, // Your PostgreSQL port
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 20000, // How long to try to connect before timing out
  ssl: {
    rejectUnauthorized: true,
    ca: `-----BEGIN CERTIFICATE-----
MIIEQTCCAqmgAwIBAgIUEqck9pa3oxesUPLel1XO90HpJHMwDQYJKoZIhvcNAQEM
BQAwOjE4MDYGA1UEAwwvMDZhNzQyOGEtMjFiMy00NDI0LWI0YjctNGQyOTI5Nzll
Yjg3IFByb2plY3QgQ0EwHhcNMjQwMTE2MTYyNzEwWhcNMzQwMTEzMTYyNzEwWjA6
MTgwNgYDVQQDDC8wNmE3NDI4YS0yMWIzLTQ0MjQtYjRiNy00ZDI5Mjk3OWViODcg
UHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCCAYoCggGBALTtBCfp
al2KD+ZRTe4kUwKXMsCEn3Zw8ps9M5aJpNHfEF9B9bbv870Ltb0DD6tZtH9jg+ZE
9JIU2EbP5j9gJKZRFcQWwLtmKjb02xkCEYVc27ctKIbNsvJs6AOOxiuF8o3WOKJE
IYmTE2JznWrgg6WjeLEAg8Tn5pGsVjY4wPiY3PjxfDKAiBv0K5Q7EtlIVwpuqhOx
c++FuwofzuG6Ng448TygACSFeSbqGS27dsoBcZ45wP+znSh+AxND5eWNNRvMFqDl
q9biaLYmhcs7Ybu4fSa1U07lqfDouWKCZochmGxDnorQO/qi+/IeMR0w/ywWBZtv
afABU+PDcFFXWPyuBNyGQDW0A5sIVx4MQ9W9iGbkPp/HysYJjK01JKmdOWopC/G1
5nQckpIEU5WIWAcrWcUcyWo5nezOLgDZtgk2iQ8sz87s7rnIDVwFmmn2suNqrqlm
ey+s15mf7dbYC8VE3e4D32SL8RflJfB/yDLpBvtfyayLvRE7vgbRq9xmCQIDAQAB
oz8wPTAdBgNVHQ4EFgQUBlwuJ8LKY3VJAz6vn/rpt3WNStkwDwYDVR0TBAgwBgEB
/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQADggGBAA8p6JZcw6IpuElU
ONXy1bdy9cPbHGnwLJ3VrGj4OdPzh1LzMPnF92wjMPOxrXljSjL7yikah1/rlgt0
98ZGdjqZXIfgNYEm46EEq7/yaAlTmfKJctZLJQUaysFTrZTRrfIaXiddwdnSL8F0
Cn7R+wO/gtUIczBtsqwqmSxY0akXAp9gg7a07CBZSyEagUX3MsLiXHjW1hRNY/U/
dRfTxM0ceeDYD/7pLHIBVocyDTXIlWTnIwaMBUbM3M7O4QuOMDirfbPDReqUww6n
2QW0pSQgvCgkb2RS7ZDrgSY3dacYV3WMwuHTNMMVpfkncIP4iaEaH+8KH7Qt1TxP
vwgqnjuVM6BARsSAnC8wLwWldzb488qmGuOq0a2gGAgpyLnKlH1cbqvpWKP8fyhy
JxcKa3gKYPAxDmnrzT+qTDh6z1x1lnYy9fNZWvGD2ou7qs+CWEUf+uE+bkLBDaoe
oCNL+PbCc1uaN5dyHiGih2bQADH0rgqdHQWH1Qcw42SQXRtg9w==
-----END CERTIFICATE-----

      `,
  },
});
try {
  pool
    .connect()
    .then(() => {
      console.log("Connected to DB");
    })
    .catch((error) => {
      console.log("Error connecting DB", error);
    });
} catch (error) {
  console.log(error);
}
export default pool;
