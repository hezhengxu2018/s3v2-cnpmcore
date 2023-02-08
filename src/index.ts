import S3 from "aws-sdk/clients/s3";

class S3v2Client {
  config: S3.Types.ClientConfiguration;

  constructor(config: S3.Types.ClientConfiguration) {
    this.config = config;
  }
}

export default S3v2Client;
