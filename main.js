const Client = require('ftp');
const fs = require('fs');
const notify = function() {}

const defaultConfig = {
  server: {
    host: 'localhost',
    user: 'root',
    password: 'pass',
  },
  blacklist: [
    '.ftpconfig'
  ],
  local: "./",
  remote: "/test/"
};

console.log('Loading ./.ftpconfig file');

if (!fs.existsSync('./.ftpconfig')) initConfigFile("Creating configuration file");
let config = fs.readFileSync('./.ftpconfig', { encoding: 'utf8' });

try {
  config = JSON.parse(config);
} catch (error) {
  throw new Error("Can't parse configuration file");
}

console.log('Loading configuration');
Object.keys(defaultConfig).forEach(k => {
  if (!config[k]) return initConfigFile("Invalid '.ftpconfig' file");
});

const c = new Client();

console.log('Configuration loaded', config);
console.log('Connecting to FTP server...');

c.on('ready', function() {
  console.log('Connected !');
  let lastUpload = 0;
  fs.watch(config.local, { encoding: 'utf8' }, (event, file) => {
    if (event != 'change' || lastUpload > Date.now() - 500) return;
    lastUpload = Date.now();
    file = `${config.local}/${file}`;
    console.log(`Uploading ${file}`);
    fs.readFile(file, { encoding: 'utf8' }, (err, content) => {
      if (err) console.error("Can't read file => ", err.message);
      else c.put(content, `${config.remote}/${file}`, function(err) {
        if (err) {
          console.error(`Can't upload ${file}`);
          notify({
            title: 'Error !',
            message: `Can't upload ${file}`,
          });
        } else {
          console.log(`${file} uploaded !`);
          notify({
            title: 'FTP Uploader',
            message: `${file} uploaded !`,
          });
        }
      });
    });
  });
});

c.on('error', (err) => {
  console.error("Can't connect to server => ", err.message);
  setTimeout(() => {}, 5000);
});

c.connect(config.server);

function initConfigFile(err_msg = null) {
  if (err_msg) console.error(err_msg);
  if (fs.existsSync('./.ftpconfig')) fs.unlinkSync('./.ftpconfig');
  fs.writeFileSync('./.ftpconfig', JSON.stringify(defaultConfig));
}
