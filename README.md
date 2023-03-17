# s3v2-cnpmcore

a S3 storage wrapper which based on aws-sdk 2.x for [cnpmcore](https://github.com/cnpm/cnpmcore) 

## Installation

```shell
npm i s3v2-cnpmcore
```

## Usage

you should set env variables before run nodejs application in production:

```shell
AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE=1
```


```ts
import S3v2Client from 's3v2-cnpmcore';

// ...
// other configuration in cnpmcore
// ...

// api reference(https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/configuring-the-jssdk.html)
config.nfs.client = new S3v2Client({
  endpoint: 'your endpoint',
  key: 'your access key',
  secret: 'your secret key',
  bucket: 'npm',
  // optional
  region: 'eu-west-1', // default is ''
  
})
```

### License

MIT